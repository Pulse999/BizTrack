// backend/src/controllers/adminController.ts
import { Request, Response } from "express";
import { pool } from "../services/db";
import { AuthRequest, canManageCourse } from "../middleware/authMiddleware";

/**
 * List users in the requesting admin's scope.
 * - company admins: only users in their company
 * - super admins: all users OR filtered by ?company_id when posing
 */
export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    // Company admin = forced company
    if (req.user && !req.user.is_super_admin) {
      const r = await pool.query(
        `SELECT user_id, biztrack_user_id, company_id, email, 
                first_name, last_name, is_admin, is_super_admin, profile_image_url
         FROM users
         WHERE company_id = $1
         ORDER BY first_name, last_name`,
        [req.user.company_id]
      );
      return res.json({ success: true, users: r.rows });
    }

    // Super admin — optional ?company_id pose
    const overrideCompanyId = req.query.company_id
      ? Number(req.query.company_id)
      : null;

    if (overrideCompanyId) {
      const r = await pool.query(
        `SELECT user_id, biztrack_user_id, company_id, email, 
                first_name, last_name, is_admin, is_super_admin, profile_image_url
         FROM users
         WHERE company_id = $1
         ORDER BY first_name, last_name`,
        [overrideCompanyId]
      );
      return res.json({ success: true, users: r.rows });
    }

    // Super admin no filtering = all users
    const r = await pool.query(
      `SELECT user_id, biztrack_user_id, company_id, email, 
              first_name, last_name, is_admin, is_super_admin, profile_image_url
       FROM users
       ORDER BY first_name, last_name`
    );

    return res.json({ success: true, users: r.rows });
  } catch (err) {
    console.error("listUsers error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error listing users" });
  }
};

/**
 * Toggle admin flag
 */
export const toggleAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId)
      return res
        .status(400)
        .json({ success: false, error: "Invalid user id" });

    const targetRes = await pool.query(
      `SELECT user_id, company_id, is_admin, is_super_admin
       FROM users WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (targetRes.rows.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "User not found" });

    const target = targetRes.rows[0];

    if (
      !req.user?.is_super_admin &&
      req.user?.company_id !== target.company_id
    ) {
      return res
        .status(403)
        .json({ success: false, error: "Not authorized" });
    }

    if (target.is_super_admin)
      return res
        .status(403)
        .json({ success: false, error: "Cannot modify super admin" });

    const newVal = !target.is_admin;

    await pool.query(
      `UPDATE users SET is_admin = $1 WHERE user_id = $2`,
      [newVal, userId]
    );

    return res.json({
      success: true,
      user_id: userId,
      is_admin: newVal,
    });
  } catch (err) {
    console.error("toggleAdmin error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error toggling admin" });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  return listUsers(req, res);
};

/**
 * Company-scoped analytics (deep) + lightweight summary (analyticsLive)
 *
 * - Returns:
 *   { success: true, analytics: <deep analytics>, analyticsLive: <summary> }
 *
 * Scoping rules:
 * - Super admin: global unless ?company_id provided (pose mode)
 * - Normal admin: forced to their company
 *
 * Query params:
 * - company_id (optional, super admin only)
 * - date_range (optional) one of "30", "7", "1", "all" (default "30")
 */
export const getCompanyAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    let companyId: number | null;

    // Super admin → use pose filter, or null for global
    if (req.user?.is_super_admin) {
      companyId = req.query.company_id ? Number(req.query.company_id) : null;
    } else {
      companyId = req.user?.company_id ?? null;
    }

    // Date range for summary (analyticsLive)
    const dateRange = (req.query.date_range as string) || "30"; // "30", "7", "1", "all"
    const dateFilterActive = dateRange !== "all";
    const sinceDate = dateFilterActive
      ? new Date(Date.now() - Number(dateRange) * 86400000)
      : null;

    /* -----------------------------
       BUILD LIGHTWEIGHT SUMMARY (analyticsLive)
       Keys required by frontend:
       - totalUsers
       - enrolledUsers
       - averageScore
       - courseCompletionBreakdown: { passed, failed, locked_out, not_started }
    ------------------------------ */

    // enrolledUsers (distinct users enrolled in scoped courses, optional date filter)
    let enrolledUsersSql = `
      SELECT COUNT(DISTINCT e.user_id)::int AS enrolled_users
      FROM enrolled_courses e
      JOIN courses c ON e.course_id = c.course_id
      JOIN users u ON e.user_id = u.user_id
      WHERE 1=1
    `;
    const enrolledParams: any[] = [];

    if (companyId) {
      enrolledParams.push(companyId);
      enrolledUsersSql += ` AND c.company_id = $${enrolledParams.length}`;
    }

    if (dateFilterActive && sinceDate) {
      enrolledParams.push(sinceDate);
      enrolledUsersSql += ` AND (e.last_accessed_at >= $${enrolledParams.length} OR u.created_at >= $${enrolledParams.length})`;
    }

    const enrolledUsersQ = await pool.query(enrolledUsersSql, enrolledParams);
    const enrolledUsers = Number(enrolledUsersQ.rows[0]?.enrolled_users ?? 0);

    // averageScore (avg quiz_attempt score scoped to company and date)
    let avgScoreSql = `
      SELECT COALESCE(AVG(qa.score), 0)::numeric(5,2) AS average_score
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.quiz_id
      JOIN courses c ON q.course_id = c.course_id
      WHERE 1=1
    `;
    const avgParams: any[] = [];
    if (companyId) {
      avgParams.push(companyId);
      avgScoreSql += ` AND c.company_id = $${avgParams.length}`;
    }
    if (dateFilterActive && sinceDate) {
      avgParams.push(sinceDate);
      avgScoreSql += ` AND qa.completed_at >= $${avgParams.length}`;
    }
    const avgScoreQ = await pool.query(avgScoreSql, avgParams);
    const averageScore = Number(avgScoreQ.rows[0]?.average_score ?? 0);

    // attempted users in period (distinct)
    let attemptedUsersSql = `
      SELECT DISTINCT qa.user_id
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.quiz_id
      JOIN courses c ON q.course_id = c.course_id
      WHERE 1=1
    `;
    const attemptedParams: any[] = [];
    if (companyId) {
      attemptedParams.push(companyId);
      attemptedUsersSql += ` AND c.company_id = $${attemptedParams.length}`;
    }
    if (dateFilterActive && sinceDate) {
      attemptedParams.push(sinceDate);
      attemptedUsersSql += ` AND qa.completed_at >= $${attemptedParams.length}`;
    }
    const attemptedUsersQ = await pool.query(attemptedUsersSql, attemptedParams);
    const attemptedUserIds = attemptedUsersQ.rows.map((r: any) => r.user_id);
    const attemptedUsersCount = attemptedUserIds.length;

    // passed count (distinct users who passed at least one attempt)
    let passedSql = `
      SELECT COUNT(DISTINCT qa.user_id)::int AS passed_count
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.quiz_id
      JOIN courses c ON q.course_id = c.course_id
      WHERE qa.passed = TRUE
    `;
    const passedParams: any[] = [];
    if (companyId) {
      passedParams.push(companyId);
      passedSql += ` AND c.company_id = $${passedParams.length}`;
    }
    if (dateFilterActive && sinceDate) {
      passedParams.push(sinceDate);
      passedSql += ` AND qa.completed_at >= $${passedParams.length}`;
    }
    const passedQ = await pool.query(passedSql, passedParams);
    const passedCount = Number(passedQ.rows[0]?.passed_count ?? 0);

    // failed count (distinct users with at least one failed attempt)
    let failedSql = `
      SELECT COUNT(DISTINCT qa.user_id)::int AS failed_count
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.quiz_id
      JOIN courses c ON q.course_id = c.course_id
      WHERE qa.passed = FALSE
    `;
    const failedParams: any[] = [];
    if (companyId) {
      failedParams.push(companyId);
      failedSql += ` AND c.company_id = $${failedParams.length}`;
    }
    if (dateFilterActive && sinceDate) {
      failedParams.push(sinceDate);
      failedSql += ` AND qa.completed_at >= $${failedParams.length}`;
    }
    const failedQ = await pool.query(failedSql, failedParams);
    const failedCount = Number(failedQ.rows[0]?.failed_count ?? 0);

    // locked_out: users with 3+ failed attempts (in the scoped data)
    // We'll count distinct users who have >= 3 failed attempts in the scoped period
    let lockedSql = `
      SELECT COUNT(*)::int AS locked_count FROM (
        SELECT qa.user_id, COUNT(*) FILTER (WHERE qa.passed = false) AS failed_attempts
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.quiz_id
        JOIN courses c ON q.course_id = c.course_id
        WHERE 1=1
    `;
    const lockedParams: any[] = [];
    if (companyId) {
      lockedParams.push(companyId);
      lockedSql += ` AND c.company_id = $${lockedParams.length}`;
    }
    if (dateFilterActive && sinceDate) {
      lockedParams.push(sinceDate);
      lockedSql += ` AND qa.completed_at >= $${lockedParams.length}`;
    }
    lockedSql += `
        GROUP BY qa.user_id
        HAVING COUNT(*) FILTER (WHERE qa.passed = false) >= 3
      ) t
    `;
    const lockedQ = await pool.query(lockedSql, lockedParams);
    const lockedCount = Number(lockedQ.rows[0]?.locked_count ?? 0);

    const notStartedCount = Math.max(0, enrolledUsers - attemptedUsersCount);

    const analyticsLive = {
      totalUsers: null as number | null,
      enrolledUsers,
      averageScore,
      courseCompletionBreakdown: {
        passed: passedCount,
        failed: failedCount,
        locked_out: lockedCount,
        not_started: notStartedCount,
      },
    };

    // totalUsers only for super admin (we keep null for non-super-admin)
    if (req.user?.is_super_admin) {
      const totQ = await pool.query(
        companyId
          ? `SELECT COUNT(*)::int AS c FROM users WHERE company_id = $1`
          : `SELECT COUNT(*)::int AS c FROM users`
        ,
        companyId ? [companyId] : []
      );
      analyticsLive.totalUsers = Number(totQ.rows[0]?.c ?? 0);
    } else {
      // For company-scoped admin, set totalUsers to number of users in that company
      const totQ = await pool.query(`SELECT COUNT(*)::int AS c FROM users WHERE company_id = $1`, [companyId]);
      analyticsLive.totalUsers = Number(totQ.rows[0]?.c ?? 0);
    }

    /* -----------------------------------------
       DEEP ANALYTICS (existing implementation)
       - This part builds the per-course, per-quiz, per-user nested analytics
    ----------------------------------------- */

    // Fetch courses for scope
    const coursesRes = await pool.query(
  companyId
    ? `SELECT course_id, title, company_id
       FROM courses
       WHERE company_id = $1
       ORDER BY title`
    : `SELECT course_id, title, company_id
       FROM courses
       ORDER BY title`,
  companyId ? [companyId] : []
);



    const courses = coursesRes.rows;
    const result: any[] = [];

    for (const course of courses) {
      // Quizzes for course
      const quizzesRes = await pool.query(
        `SELECT quiz_id, title 
         FROM quizzes 
         WHERE course_id = $1 
         ORDER BY created_at`,
        [course.course_id]
      );

      const quizzesOut: any[] = [];

      for (const quiz of quizzesRes.rows) {
        // Distinct users with attempts for this quiz
        const usersRes = await pool.query(
          `
          SELECT DISTINCT u.user_id, u.first_name, u.last_name, u.email
          FROM quiz_attempts qa
          JOIN users u ON u.user_id = qa.user_id
          WHERE qa.quiz_id = $1
          ${companyId ? "AND u.company_id = $2" : ""}
          ORDER BY u.first_name, u.last_name
          `,
          companyId ? [quiz.quiz_id, companyId] : [quiz.quiz_id]
        );

        const usersOut: any[] = [];

        // For each user → attempts
        for (const u of usersRes.rows) {
          const userParams = companyId
            ? [quiz.quiz_id, u.user_id, companyId]
            : [quiz.quiz_id, u.user_id];

          const attemptsRes = await pool.query(
            `
            SELECT qa.attempt_id, qa.score, qa.passed, 
                   qa.started_at, qa.completed_at
            FROM quiz_attempts qa
            JOIN users u2 ON u2.user_id = qa.user_id
            WHERE qa.quiz_id = $1
              AND qa.user_id = $2
              ${companyId ? "AND u2.company_id = $3" : ""}
            ORDER BY qa.started_at DESC
            `,
            userParams
          );

          const attemptsRows = attemptsRes.rows;
          const attemptIds = attemptsRows.map((a: any) => a.attempt_id);

          let answersByAttempt: Record<number, any[]> = {};

          if (attemptIds.length > 0) {
            const answersRes = await pool.query(
              `
              SELECT qaa.attempt_id, qaa.question_id, qaa.selected_answer_id, 
                     qaa.is_correct, COALESCE(a.text, '') AS answer_text
              FROM quiz_attempt_answers qaa
              LEFT JOIN answers a ON qaa.selected_answer_id = a.answer_id
              WHERE qaa.attempt_id = ANY($1::int[])
              ORDER BY qaa.attempt_id
              `,
              [attemptIds]
            );

            answersByAttempt = answersRes.rows.reduce((acc: any, row: any) => {
              acc[row.attempt_id] = acc[row.attempt_id] || [];
              acc[row.attempt_id].push({
                question_id: row.question_id,
                text: row.answer_text,
                correct: row.is_correct,
              });
              return acc;
            }, {});
          }

          const attemptsOut = attemptsRows.map((a: any) => ({
            score: Number(a.score),
            passed: !!a.passed,
            date: a.completed_at ? a.completed_at : a.started_at,
            answers: (answersByAttempt[a.attempt_id] || []).map(
              (ans: any) => ({
                text: ans.text,
                correct: ans.correct,
              })
            ),
          }));

          const latestPassed =
            attemptsOut.length > 0 ? attemptsOut[0].passed : false;

          usersOut.push({
            user_id: u.user_id,
            name: `${u.first_name} ${u.last_name}`.trim(),
            email: u.email,
            passed: latestPassed,
            attempts: attemptsOut,
          });
        }

        quizzesOut.push({
          quiz_id: quiz.quiz_id,
          title: quiz.title,
          users: usersOut,
        });
      }

      result.push({
        course_id: course.course_id,
        title: course.title,
        quizzes: quizzesOut,
      });
    }

    return res.json({ success: true, analytics: result, analyticsLive });
  } catch (err) {
    console.error("getCompanyAnalytics error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching analytics",
    });
  }
};

/**
 * Unlock user quiz
 */
export const unlockUserQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { quiz_id, user_id } = req.body;
    if (!quiz_id || !user_id)
      return res.status(400).json({
        success: false,
        error: "quiz_id and user_id required",
      });

    const quizRes = await pool.query(
      `
      SELECT q.quiz_id, q.course_id, c.company_id
      FROM quizzes q
      JOIN courses c ON q.course_id = c.course_id
      WHERE q.quiz_id = $1
      LIMIT 1`,
      [quiz_id]
    );

    if (quizRes.rows.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Quiz not found" });

    const quizRow = quizRes.rows[0];

    if (
      !req.user?.is_super_admin &&
      req.user?.company_id !== quizRow.company_id
    ) {
      return res
        .status(403)
        .json({ success: false, error: "Not authorized" });
    }

    const attemptsRes = await pool.query(
      `SELECT attempt_id FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2`,
      [quiz_id, user_id]
    );

    const attemptIds = attemptsRes.rows.map((r) => r.attempt_id);

    if (attemptIds.length === 0)
      return res.json({
        success: true,
        message: "No attempts to remove",
      });

    await pool.query(
      `DELETE FROM quiz_attempt_answers WHERE attempt_id = ANY($1::int[])`,
      [attemptIds]
    );

    await pool.query(
      `DELETE FROM quiz_attempts WHERE attempt_id = ANY($1::int[])`,
      [attemptIds]
    );

    return res.json({
      success: true,
      message: "Attempts removed",
    });
  } catch (err) {
    console.error("unlockUserQuiz error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error unlocking quiz" });
  }
};
