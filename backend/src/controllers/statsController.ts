// backend/src/controllers/statsController.ts
import { Request, Response } from "express";
import { pool } from "../services/db";
import { AuthRequest } from "../middleware/authMiddleware";

/* -----------------------------------------------------
   ADMIN STATS (your version)
   GET /api/stats
----------------------------------------------------- */
export const adminGetStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Query params
    const queryCompanyId = req.query.company_id ? Number(req.query.company_id) : null;
    const dateRange = (req.query.date_range as string) || "30"; // "30", "7", "1", "all"

    // Company scoping
    const companyId =
      user.is_super_admin && queryCompanyId
        ? queryCompanyId
        : user.is_super_admin
        ? null
        : user.company_id;

    // Build date filter
    let dateWhere = "";
    const params: any[] = [];

    if (dateRange !== "all") {
      const since = new Date(Date.now() - Number(dateRange) * 86400000);
      params.push(since);
      dateWhere = `
        AND (
          (e.last_accessed_at IS NOT NULL AND e.last_accessed_at >= $${params.length})
          OR (qa.completed_at IS NOT NULL AND qa.completed_at >= $${params.length})
          OR (u.created_at >= $${params.length})
        )
      `;
    }

    // Simple counts
    const totalUsersQ = companyId
      ? await pool.query("SELECT COUNT(*) FROM users WHERE company_id = $1", [companyId])
      : await pool.query("SELECT COUNT(*) FROM users");

    const activeUsersQ = companyId
      ? await pool.query(
          "SELECT COUNT(*) FROM users WHERE company_id = $1 AND last_login IS NOT NULL",
          [companyId]
        )
      : await pool.query("SELECT COUNT(*) FROM users WHERE last_login IS NOT NULL");

    const totalCoursesQ = companyId
      ? await pool.query("SELECT COUNT(*) FROM courses WHERE company_id = $1", [companyId])
      : await pool.query("SELECT COUNT(*) FROM courses");

    const activeCoursesQ = companyId
      ? await pool.query(
          "SELECT COUNT(*) FROM courses WHERE company_id = $1 AND is_active = true",
          [companyId]
        )
      : await pool.query("SELECT COUNT(*) FROM courses WHERE is_active = true");

    const totalVideosQ = companyId
      ? await pool.query(
          `
        SELECT COUNT(v.*)
        FROM videos v
        JOIN courses c ON v.course_id = c.course_id
        WHERE c.company_id = $1
        `,
          [companyId]
        )
      : await pool.query("SELECT COUNT(*) FROM videos");

    const totalQuizzesQ = companyId
      ? await pool.query(
          `
        SELECT COUNT(q.*)
        FROM quizzes q
        JOIN courses c ON q.course_id = c.course_id
        WHERE c.company_id = $1
        `,
          [companyId]
        )
      : await pool.query("SELECT COUNT(*) FROM quizzes");

    const certificatesQ = companyId
      ? await pool.query(
          `
        SELECT COUNT(cert.*)
        FROM certificates cert
        JOIN courses c ON cert.course_id = c.course_id
        WHERE c.company_id = $1
        `,
          [companyId]
        )
      : await pool.query("SELECT COUNT(*) FROM certificates");

    /* -----------------------------------------
       Enrolled Users (company + date range)
    ----------------------------------------- */
    let enrolledUsersSql = `
      SELECT COUNT(DISTINCT e.user_id) AS enrolled_users
      FROM enrolled_courses e
      JOIN courses c ON e.course_id = c.course_id
      JOIN users u ON e.user_id = u.user_id
      WHERE 1=1
    `;
    const enrolledParams: any[] = [];

    if (companyId) {
      enrolledUsersSql += ` AND c.company_id = $${enrolledParams.length + 1}`;
      enrolledParams.push(companyId);
    }

    if (dateRange !== "all") {
      enrolledUsersSql += ` AND (e.last_accessed_at >= $${enrolledParams.length + 1} OR u.created_at >= $${enrolledParams.length + 1})`;
      enrolledParams.push(new Date(Date.now() - Number(dateRange) * 86400000));
    }

    const enrolledUsersQ = await pool.query(enrolledUsersSql, enrolledParams);

    /* -----------------------------------------
       Average Quiz Score
    ----------------------------------------- */
    let avgScoreSql = `
      SELECT COALESCE(AVG(qa.score), 0)::numeric(5,2) AS average_score
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.quiz_id
      JOIN courses c ON q.course_id = c.course_id
      WHERE 1=1
    `;
    const avgParams: any[] = [];

    if (companyId) {
      avgScoreSql += ` AND c.company_id = $${avgParams.length + 1}`;
      avgParams.push(companyId);
    }

    if (dateRange !== "all") {
      avgScoreSql += ` AND qa.completed_at >= $${avgParams.length + 1}`;
      avgParams.push(new Date(Date.now() - Number(dateRange) * 86400000));
    }

    const avgScoreQ = await pool.query(avgScoreSql, avgParams);

    /* -----------------------------------------
       Completion Breakdown
    ----------------------------------------- */
    const attemptedUsersSql = `
      SELECT DISTINCT qa.user_id
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.quiz_id
      JOIN courses c ON q.course_id = c.course_id
      WHERE 1=1
      ${companyId ? `AND c.company_id = ${companyId}` : ""}
      ${dateRange !== "all" ? `AND qa.completed_at >= '${new Date(Date.now() - Number(dateRange) * 86400000).toISOString()}'` : ""}
    `;
    const attemptedUsersQ = await pool.query(attemptedUsersSql);
    const attemptedUserIds = attemptedUsersQ.rows.map((r: any) => r.user_id);

    const passedQ = await pool.query(
      `
      SELECT COUNT(DISTINCT qa.user_id) AS passed_count
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.quiz_id
      JOIN courses c ON q.course_id = c.course_id
      WHERE qa.passed = TRUE
      ${companyId ? `AND c.company_id = ${companyId}` : ""}
      ${dateRange !== "all" ? `AND qa.completed_at >= '${new Date(Date.now() - Number(dateRange) * 86400000).toISOString()}'` : ""}
    `
    );

    const failedQ = await pool.query(
      `
      SELECT COUNT(DISTINCT qa.user_id) AS failed_count
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.quiz_id
      JOIN courses c ON q.course_id = c.course_id
      WHERE qa.passed = FALSE
      ${companyId ? `AND c.company_id = ${companyId}` : ""}
      ${dateRange !== "all" ? `AND qa.completed_at >= '${new Date(Date.now() - Number(dateRange) * 86400000).toISOString()}'` : ""}
    `
    );

    const lockedQ = await pool.query(
      `
      SELECT COUNT(*) AS locked_count FROM (
        SELECT qa.user_id, COUNT(*) FILTER (WHERE qa.passed = false) AS failed_attempts
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.quiz_id
        JOIN courses c ON q.course_id = c.course_id
        ${companyId ? `WHERE c.company_id = ${companyId}` : ""}
        ${dateRange !== "all" ? `AND qa.completed_at >= '${new Date(Date.now() - Number(dateRange) * 86400000).toISOString()}'` : ""}
        GROUP BY qa.user_id
        HAVING COUNT(*) FILTER (WHERE qa.passed = false) >= 3
      ) t
    `
    );

    const enrolledUsers = parseInt(enrolledUsersQ.rows[0].enrolled_users || 0);
    const attemptedUsersCount = attemptedUserIds.length;

    const stats = {
      totalUsers: Number(totalUsersQ.rows[0].count),
      activeUsers: Number(activeUsersQ.rows[0].count),
      totalCourses: Number(totalCoursesQ.rows[0].count),
      activeCourses: Number(activeCoursesQ.rows[0].count),
      totalVideos: Number(totalVideosQ.rows[0].count),
      totalQuizzes: Number(totalQuizzesQ.rows[0].count),
      certificatesIssued: Number(certificatesQ.rows[0].count),
      totalCompanies: user.is_super_admin
        ? Number((await pool.query("SELECT COUNT(*) FROM company")).rows[0].count)
        : null,
      enrolledUsers,
      averageScore: Number(avgScoreQ.rows[0].average_score),
      courseCompletionBreakdown: {
        passed: Number(passedQ.rows[0].passed_count || 0),
        failed: Number(failedQ.rows[0].failed_count || 0),
        locked_out: Number(lockedQ.rows[0].locked_count || 0),
        not_started: Math.max(0, enrolledUsers - attemptedUsersCount),
      },
    };

    return res.json({ success: true, stats });
  } catch (err) {
    console.error("adminGetStats error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -----------------------------------------------------
   USER STATS (his version)
   GET /api/stats/me
----------------------------------------------------- */
export const userGetStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const enrolledRes = await pool.query(
      `SELECT COUNT(*)::int AS courses_enrolled FROM enrolled_courses WHERE user_id = $1`,
      [userId]
    );

    const videosWatchedRes = await pool.query(
      `SELECT COUNT(*)::int AS videos_watched FROM user_video_progress WHERE user_id = $1 AND completed = TRUE`,
      [userId]
    );

    const certificatesRes = await pool.query(
      `SELECT COUNT(*)::int AS certificates_earned FROM certificates WHERE user_id = $1 AND is_revoked = FALSE`,
      [userId]
    );

    const avgScoreRes = await pool.query(
      `SELECT AVG(score)::numeric(10,2) AS avg_score FROM quiz_attempts WHERE user_id = $1`,
      [userId]
    );

    const enrolledCoursesRes = await pool.query(
      `SELECT
         c.course_id,
         c.title,
         COALESCE(ec.progress_percent, 0)::int AS progress_percent,
         (SELECT COUNT(*) FROM videos v WHERE v.course_id = c.course_id) AS videos_count,
         (SELECT COUNT(*) FROM quizzes q JOIN videos v ON q.video_id = v.video_id WHERE v.course_id = c.course_id) AS quizzes_count
       FROM enrolled_courses ec
       JOIN courses c ON ec.course_id = c.course_id
       WHERE ec.user_id = $1
       ORDER BY ec.last_accessed_at DESC NULLS LAST, ec.enrollment_id DESC
       LIMIT 50`,
      [userId]
    );

    return res.json({
      success: true,
      stats: {
        coursesEnrolled: Number(enrolledRes.rows[0]?.courses_enrolled ?? 0),
        videosWatched: Number(videosWatchedRes.rows[0]?.videos_watched ?? 0),
        certificatesEarned: Number(certificatesRes.rows[0]?.certificates_earned ?? 0),
        averageScore:
          avgScoreRes.rows[0].avg_score !== null
            ? Number(avgScoreRes.rows[0].avg_score)
            : null,
      },
      enrolledCourses: enrolledCoursesRes.rows.map((r: any) => ({
        course_id: r.course_id,
        title: r.title,
        progress_percent: Number(r.progress_percent ?? 0),
        videos_count: Number(r.videos_count ?? 0),
        quizzes_count: Number(r.quizzes_count ?? 0),
      })),
    });
  } catch (err) {
    console.error("userGetStats error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
