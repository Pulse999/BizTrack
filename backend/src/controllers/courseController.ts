// backend/src/controllers/courseController.ts
import { Request, Response } from "express";
import { pool } from "../services/db";
import { supabase, COURSE_IMAGES_BUCKET, extractObjectPathFromPublicUrl, removeObjectByPublicUrl, buildPublicUrl } from "../services/supabase";
import { AuthRequest, canManageCourse } from "../middleware/authMiddleware";
import { v4 as uuidv4 } from "uuid";
import updateCourseProgress from "../utils/updateProgress";

/* -----------------------------------------------------
   DEFAULT COURSE IMAGE
----------------------------------------------------- */
const DEFAULT_COURSE_IMAGE =
  "https://soceciezlphvikymiglw.supabase.co/storage/v1/object/public/default%20biztrack%20course%20Image/Biztrack%20-%20Logo%20resized%20(%20Full%20-%20BT%20)%20-%20Copy.png";

/* -----------------------------------------------------
   NORMALIZER
----------------------------------------------------- */
function normalizeCourseRow(row: any) {
  return {
    ...row,
    company_id: row.company_id ?? null,   // ⭐ ADD THIS
    progress_percent: Number(row.progress_percent ?? 0),
    avg_rating:
      row.avg_rating !== null && row.avg_rating !== undefined
        ? Number(row.avg_rating)
        : null,
    rating_count: Number(row.rating_count ?? 0),
    user_rating:
      row.user_rating !== null && row.user_rating !== undefined
        ? Number(row.user_rating)
        : null,
    quizzes_count: Number(row.quizzes_count ?? 0),
    students_count: Number(row.students_count ?? 0),
    is_bookmarked: !!row.is_bookmarked,
    is_enrolled: !!row.is_enrolled,

    image_url:
      row.image_url && row.image_url.trim() !== ""
        ? row.image_url
        : DEFAULT_COURSE_IMAGE,
  };
}

/* -----------------------------------------------------
   GET /api/courses
----------------------------------------------------- */
export const listCourses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id ?? null;
    const userCompanyId = req.user?.company_id ?? null;
    const isSuperAdmin = req.user?.is_super_admin ?? false;
    const isAdmin = !!req.user?.is_admin;

    const overrideCompanyId = req.query.company_id
      ? Number(req.query.company_id)
      : null;

    // NEW: allow admin-controlled inclusion of general courses
    const includeGeneral =
      req.query.include_general === "true" || req.query.include_general === "1";

    const params: any[] = [userId];
    let whereClauses: string[] = [];

    // 1) SUPER ADMIN (no override) → return ALL courses (active + inactive)
    if (isSuperAdmin && !overrideCompanyId) {
      whereClauses.push("TRUE"); // no filtering
    }
    // 2) SUPER ADMIN posing as a company (keeps existing behavior)
    else if (isSuperAdmin && overrideCompanyId) {
      params.push(overrideCompanyId);
      // show that company's courses and general courses
      whereClauses.push(`(c.company_id = $${params.length} OR c.company_id IS NULL)`);
    }
    // 3) ADMIN (not super): default -> only their company courses (active + inactive)
    //    If include_general=true we also include general courses (company_id IS NULL).
    else if (isAdmin) {
      if (!userCompanyId) {
        // guard
        whereClauses.push("FALSE");
      } else {
        params.push(userCompanyId);
        if (includeGeneral) {
          whereClauses.push(`(c.company_id = $${params.length} OR c.company_id IS NULL)`);
        } else {
          whereClauses.push(`c.company_id = $${params.length}`);
        }
      }
    }
    // 4) NORMAL USER: only active courses; show general courses + their company active courses
    else {
      params.push(userCompanyId);
      // If userCompanyId is null (not in a company), still show general active courses.
      if (userCompanyId) {
        whereClauses.push(`c.is_active = TRUE AND (c.company_id = $${params.length} OR c.company_id IS NULL)`);
      } else {
        whereClauses.push(`c.is_active = TRUE AND c.company_id IS NULL`);
      }
    }

    const sql = `
      SELECT
      c.course_id,
      c.title,
      c.description,
      c.image_url,
      c.difficulty_level,
      c.is_active,
      c.company_id, 

        COALESCE(ec.progress_percent, 0) AS progress_percent,

        COALESCE(AVG(cr.rating), 0)::numeric(10,2) AS avg_rating,
        COUNT(cr.rating_id) AS rating_count,

        (
          SELECT rating 
          FROM course_ratings
          WHERE user_id = $1 AND course_id = c.course_id 
          LIMIT 1
        ) AS user_rating,

        EXISTS (
          SELECT 1 FROM bookmarks b
          WHERE b.user_id = $1 AND b.course_id = c.course_id
        ) AS is_bookmarked,

        EXISTS (
          SELECT 1 FROM enrolled_courses e2
          WHERE e2.user_id = $1 AND e2.course_id = c.course_id
        ) AS is_enrolled,

        (
          SELECT COUNT(*) 
          FROM quizzes q
          JOIN videos v ON v.video_id = q.video_id
          WHERE v.course_id = c.course_id
        ) AS quizzes_count,

        (
          SELECT COUNT(*) 
          FROM enrolled_courses e3
          WHERE e3.course_id = c.course_id
        ) AS students_count

      FROM courses c
      LEFT JOIN enrolled_courses ec
        ON ec.course_id = c.course_id AND ec.user_id = $1
      LEFT JOIN course_ratings cr
        ON cr.course_id = c.course_id

      WHERE ${whereClauses.join(" AND ")}
      GROUP BY c.course_id, ec.progress_percent
      ORDER BY c.created_at DESC
    `;

    const r = await pool.query(sql, params);

    return res.json({
      success: true,
      courses: r.rows.map(normalizeCourseRow),
    });
  } catch (err) {
    console.error("listCourses error:", err);
    return res.status(500).json({ success: false });
  }
};

/* -----------------------------------------------------
   GET SINGLE COURSE (DB-SCHEMA-COMPLIANT VERSION)
----------------------------------------------------- */
export const getCourse = async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Number(req.params.id);
    const userId = req.user?.user_id ?? null;
    const userCompanyId = req.user?.company_id ?? null;
    const isSuperAdmin = req.user?.is_super_admin ?? false;

    const overrideCompanyId = req.query.company_id
      ? Number(req.query.company_id)
      : null;

    const params: any[] = [courseId, userId];
    let whereClauses = ["c.course_id = $1"];

    if (isSuperAdmin) {
      if (overrideCompanyId) {
        params.push(overrideCompanyId);
        whereClauses.push(`c.company_id = $${params.length}`);
      }
    } else {
      params.push(userCompanyId);
      whereClauses.push(`(c.company_id = $${params.length} OR c.company_id IS NULL)`);
    }


    const courseSql = `
      SELECT
        c.course_id,
        c.title,
        c.description,
        c.image_url,
        c.difficulty_level,
        c.company_id,

        COALESCE(ec.progress_percent, 0) AS progress_percent,

        COALESCE(AVG(cr.rating), 0)::numeric(10,2) AS avg_rating,
        COUNT(cr.rating_id) AS rating_count,

        (
          SELECT rating 
          FROM course_ratings
          WHERE user_id = $2 AND course_id = c.course_id 
          LIMIT 1
        ) AS user_rating,

        EXISTS (
          SELECT 1 
          FROM bookmarks b 
          WHERE b.user_id = $2 AND b.course_id = c.course_id
        ) AS is_bookmarked,

        (
          SELECT COUNT(*) 
          FROM quizzes q
          JOIN videos v ON v.video_id = q.video_id
          WHERE v.course_id = c.course_id
        ) AS quizzes_count,

        (
          SELECT COUNT(*) 
          FROM enrolled_courses ec2
          WHERE ec2.course_id = c.course_id
        ) AS students_count

      FROM courses c
      LEFT JOIN enrolled_courses ec
        ON ec.course_id = c.course_id AND ec.user_id = $2
      LEFT JOIN course_ratings cr
        ON cr.course_id = c.course_id

      WHERE ${whereClauses.join(" AND ")}
      GROUP BY c.course_id, ec.progress_percent
    `;

    const courseRes = await pool.query(courseSql, params);

    if (courseRes.rows.length === 0) {
      return res.status(404).json({ success: false });
    }

    const course = normalizeCourseRow(courseRes.rows[0]);

    // auto-enroll user
    if (userId) {
      try {
        await pool.query(
          `
          INSERT INTO enrolled_courses (user_id, course_id, progress_percent, last_accessed_at)
          VALUES ($1, $2, 0, NOW())
          ON CONFLICT (user_id, course_id) DO NOTHING
        `,
          [userId, courseId]
        );

        await updateCourseProgress(userId, courseId);
      } catch (err) {
        console.error("Auto-enroll failed:", err);
      }
    }

    const videosQuery = `
      SELECT 
        v.video_id,
        v.title,
        v.description,
        v.video_url,
        v.position,
        (
          SELECT uvp.completed
          FROM user_video_progress uvp
          WHERE uvp.video_id = v.video_id AND uvp.user_id = $2
          LIMIT 1
        ) AS completed,
        q.quiz_id,
        q.title AS quiz_title,
        q.passing_score,
        q.attempts_allowed,
        (
          SELECT COUNT(*) FROM questions WHERE quiz_id = q.quiz_id
        ) AS questions_count,
        (
          SELECT MAX(score)
          FROM quiz_attempts
          WHERE quiz_id = q.quiz_id AND user_id = $2
        ) AS best_score,
        (
          SELECT passed
          FROM quiz_attempts 
          WHERE quiz_id = q.quiz_id AND user_id = $2
          ORDER BY attempt_id DESC LIMIT 1
        ) AS passed,
        (
          SELECT COUNT(*) 
          FROM quiz_attempts 
          WHERE quiz_id = q.quiz_id AND user_id = $2
        ) AS attempts_done
      FROM videos v
      LEFT JOIN quizzes q ON q.video_id = v.video_id
      WHERE v.course_id = $1
      ORDER BY v.position ASC
    `;

    const videosRes = await pool.query(videosQuery, [courseId, userId]);

    const videos = videosRes.rows.map((row) => {
      const allowed = Number(row.attempts_allowed ?? 0);
      const done = Number(row.attempts_done ?? 0);

      let attemptsLeft = 0;
      if (allowed === 0) {
        attemptsLeft = 0;
      } else {
        attemptsLeft = Math.max(0, allowed - done);
      }

      return {
        video_id: row.video_id,
        title: row.title,
        description: row.description,
        video_url: row.video_url,
        position: row.position,
        completed: row.completed === true,
        quiz: row.quiz_id
          ? {
              quiz_id: row.quiz_id,
              title: row.quiz_title,
              passing_score: row.passing_score !== null ? Number(row.passing_score) : null,
              attempts_allowed: row.attempts_allowed !== null ? Number(row.attempts_allowed) : 0,
              questions_count: row.questions_count !== null ? Number(row.questions_count) : 0,
              best_score: row.best_score !== null ? Number(row.best_score) : null,
              passed: row.passed === true,
              attempts_left: attemptsLeft,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      course,
      videos,
    });
  } catch (err) {
    console.error("getCourse error:", err);
    return res.status(500).json({ success: false });
  }
};

/* -----------------------------------------------------
   UPLOAD COURSE IMAGE
   Returns public URL AND object_path (for use in updates/deletes)
----------------------------------------------------- */
export const uploadCourseImage = async (req: AuthRequest, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file)
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });

    const ext = file.originalname.split(".").pop();
    const filePath = `course_${uuidv4()}.${ext}`;

    const { error } = await supabase.storage
      .from(COURSE_IMAGES_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      console.error("supabase upload error:", error);
      throw error;
    }

    const publicUrl = buildPublicUrl(COURSE_IMAGES_BUCKET, filePath);

    return res.json({
      success: true,
      image_url: publicUrl,
      object_path: filePath,
    });
  } catch (err) {
    console.error("uploadCourseImage error:", err);
    return res.status(500).json({ success: false });
  }
};

/* -----------------------------------------------------
   TOGGLE COURSE ACTIVE
----------------------------------------------------- */
export const toggleCourseActive = async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Number(req.params.id);
    const { is_active } = req.body;

    const allowed = await canManageCourse(req.user, courseId);
    if (!allowed) return res.status(403).json({ success: false });

    const r = await pool.query(
      `
      UPDATE courses
      SET is_active = $1,
          updated_at = NOW()
      WHERE course_id = $2
      RETURNING *
      `,
      [is_active, courseId]
    );

    return res.json({
      success: true,
      course: normalizeCourseRow(r.rows[0]),
    });
  } catch (err) {
    console.error("toggleCourseActive error:", err);
    return res.status(500).json({ success: false });
  }
};

/* -----------------------------------------------------
   CREATE COURSE
----------------------------------------------------- */
export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      difficulty_level,
      image_url,
      company_id: bodyCompanyId,
    } = req.body;

    let companyId: number | null;

    if (req.user?.is_super_admin) {
      companyId = bodyCompanyId ?? null;
    } else {
      companyId = req.user?.company_id ?? null;
    }

    const imageToUse =
      image_url && image_url.trim() !== ""
        ? image_url
        : DEFAULT_COURSE_IMAGE;

    const r = await pool.query(
      `
      INSERT INTO courses (company_id, title, description, difficulty_level, image_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        companyId,
        title,
        description,
        difficulty_level ?? "Beginner",
        imageToUse,
        req.user?.user_id ?? null, // ⭐ STORE CREATOR
      ]
    );

    return res.json({
      success: true,
      course: normalizeCourseRow(r.rows[0]),
    });
  } catch (err) {
    console.error("createCourse error:", err);
    return res.status(500).json({ success: false });
  }
};


/* -----------------------------------------------------
   UPDATE COURSE
   If image changes and old image is in Course Images bucket,
   attempt to remove old object from storage.
----------------------------------------------------- */
export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Number(req.params.id);
    const { title, description, difficulty_level, image_url } = req.body;

    const allowed = await canManageCourse(req.user, courseId);
    if (!allowed)
      return res.status(403).json({ success: false });

    // Fetch existing course to detect previous image
    const existingRes = await pool.query(
      `SELECT image_url FROM courses WHERE course_id = $1 LIMIT 1`,
      [courseId]
    );
    const existing = existingRes.rows?.[0];
    const prevImageUrl: string | null = existing?.image_url ?? null;

    const finalImage =
      image_url === "" || image_url === null || image_url === undefined
        ? DEFAULT_COURSE_IMAGE
        : image_url;

    // If image changed and previous was in our bucket and not the default, attempt delete
    if (prevImageUrl && prevImageUrl !== finalImage && prevImageUrl !== DEFAULT_COURSE_IMAGE) {
      try {
        await removeObjectByPublicUrl(prevImageUrl, COURSE_IMAGES_BUCKET);
      } catch (err) {
        console.error("Failed to remove previous course image:", err);
        // Do not block update; just log
      }
    }

    const r = await pool.query(
      `
      UPDATE courses
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          difficulty_level = COALESCE($3, difficulty_level),
          image_url = $4,
          updated_at = NOW()
      WHERE course_id = $5
      RETURNING *
      `,
      [
        title ?? null,
        description ?? null,
        difficulty_level ?? null,
        finalImage,
        courseId,
      ]
    );

    return res.json({
      success: true,
      course: normalizeCourseRow(r.rows[0]),
    });
  } catch (err) {
    console.error("updateCourse error:", err);
    return res.status(500).json({ success: false });
  }
};

/* -----------------------------------------------------
   DELETE COURSE
   Remove course image from storage (if belongs to bucket)
----------------------------------------------------- */
export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Number(req.params.id);
    const allowed = await canManageCourse(req.user, courseId);

    if (!allowed)
      return res.status(403).json({ success: false });

    // Fetch course image before deleting DB record
    try {
      const q = await pool.query(`SELECT image_url FROM courses WHERE course_id = $1 LIMIT 1`, [courseId]);
      const cur = q.rows?.[0];
      const curImageUrl: string | null = cur?.image_url ?? null;

      if (curImageUrl && curImageUrl !== DEFAULT_COURSE_IMAGE) {
        try {
          await removeObjectByPublicUrl(curImageUrl, COURSE_IMAGES_BUCKET);
        } catch (err) {
          console.error("Failed to remove course image during delete:", err);
          // continue to delete DB row regardless
        }
      }
    } catch (err) {
      console.error("Could not fetch existing course image before delete:", err);
    }

    await pool.query(
      `DELETE FROM courses WHERE course_id = $1`,
      [courseId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteCourse error:", err);
    return res.status(500).json({ success: false });
  }
};

/* -----------------------------------------------------
   BOOKMARKS
----------------------------------------------------- */
export const addBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const courseId = Number(req.params.id);

    await pool.query(
      `
      INSERT INTO bookmarks (user_id, course_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, course_id) DO NOTHING
      `,
      [userId, courseId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("addBookmark error:", err);
    return res.status(500).json({ success: false });
  }
};

export const removeBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const courseId = Number(req.params.id);

    await pool.query(
      `DELETE FROM bookmarks WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("removeBookmark error:", err);
    return res.status(500).json({ success: false });
  }
};

export const listBookmarkedCourses = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.user_id;

    const r = await pool.query(
      `
      SELECT
        c.course_id,
        c.title,
        c.description,
        c.image_url,
        c.difficulty_level,
        COALESCE(ec.progress_percent, 0) AS progress_percent
      FROM bookmarks b
      JOIN courses c ON c.course_id = b.course_id
      LEFT JOIN enrolled_courses ec
        ON ec.course_id = c.course_id AND ec.user_id = $1
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      `,
      [userId]
    );

    return res.json({
      success: true,
      courses: r.rows.map(normalizeCourseRow),
    });
  } catch (err) {
    console.error("listBookmarkedCourses error:", err);
    return res.status(500).json({ success: false });
  }
};

/* -----------------------------------------------------
   RATE COURSE
----------------------------------------------------- */
export const rateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const courseId = Number(req.params.id);
    const rating = Number(req.body.rating);

    await pool.query(
      `
      INSERT INTO course_ratings (user_id, course_id, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, course_id)
      DO UPDATE SET rating = EXCLUDED.rating
      `,
      [userId, courseId, rating]
    );

    const stats = await pool.query(
      `
      SELECT AVG(rating)::numeric(10,2) AS avg_rating,
             COUNT(*) AS rating_count
      FROM course_ratings WHERE course_id = $1
      `,
      [courseId]
    );

    return res.json({
      success: true,
      avg_rating:
        stats.rows[0].avg_rating !== null
          ? Number(stats.rows[0].avg_rating)
          : null,
      rating_count: Number(stats.rows[0].rating_count),
      user_rating: rating,
    });
  } catch (err) {
    console.error("rateCourse error:", err);
    return res.status(500).json({ success: false });
  }
};
