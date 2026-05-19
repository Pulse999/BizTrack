// backend/src/controllers/progressController.ts
import { Request, Response } from "express";
import { pool } from "../services/db";
import { AuthRequest } from "../middleware/authMiddleware";
import updateCourseProgress from "../utils/updateProgress";

/**
 * GET /api/progress/video/:videoId/status
 */
export const getVideoStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const videoId = Number(req.params.videoId);
    if (!userId || !videoId)
      return res.status(400).json({ success: false, message: "Bad request" });

    const r = await pool.query(
      `SELECT completed FROM user_video_progress WHERE user_id = $1 AND video_id = $2 LIMIT 1`,
      [userId, videoId]
    );

    const completed = r.rows.length ? !!r.rows[0].completed : false;
    return res.json({ success: true, completed });
  } catch (err) {
    console.error("getVideoStatus error:", err);
    return res.status(500).json({ success: false });
  }
};

/**
 * POST /api/progress/video/:videoId/complete
 */
export const completeVideo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const videoId = Number(req.params.videoId);
    if (!userId || !videoId)
      return res.status(400).json({ success: false, message: "Bad request" });

    // insert or update user_video_progress
    await pool.query(
      `INSERT INTO user_video_progress (user_id, video_id, completed, completed_at)
       VALUES ($1, $2, TRUE, NOW())
       ON CONFLICT (user_id, video_id)
       DO UPDATE SET completed = EXCLUDED.completed, completed_at = EXCLUDED.completed_at`,
      [userId, videoId]
    );

    // Fetch course_id for this video so we can update enrolled_courses.progress_percent
    try {
      const vRes = await pool.query(
        `SELECT course_id FROM videos WHERE video_id = $1 LIMIT 1`,
        [videoId]
      );
      const courseId = vRes.rows?.[0]?.course_id;
      if (courseId) {
        // update progress for this user/course
        await updateCourseProgress(userId, courseId);
      }
    } catch (uerr) {
      // Progress update failure should not break video completion response
      console.error("completeVideo: failed to update course progress", uerr);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("completeVideo error:", err);
    return res.status(500).json({ success: false });
  }
};

/**
 * GET /api/progress/quiz/:quizId/status
 * Returns: { attemptsUsed, passed, locked, attemptsAllowed, videoCompleted }
 */
export const getQuizStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const quizId = Number(req.params.quizId);
    if (!userId || !quizId)
      return res.status(400).json({ success: false, message: "Bad request" });

    const quizRes = await pool.query(
      `SELECT attempts_allowed, video_id, passing_score FROM quizzes WHERE quiz_id=$1 LIMIT 1`,
      [quizId]
    );
    if (!quizRes.rows.length)
      return res.status(404).json({ success: false, message: "Quiz not found" });

    const attemptsAllowed =
      quizRes.rows[0].attempts_allowed > 0
        ? Number(quizRes.rows[0].attempts_allowed)
        : 3;

    const attemptsRes = await pool.query(
      `SELECT passed FROM quiz_attempts WHERE quiz_id=$1 AND user_id=$2`,
      [quizId, userId]
    );

    const attemptsUsed = attemptsRes.rowCount;
    const passed = attemptsRes.rows.some((a: any) => a.passed === true);
    const locked = !passed && attemptsUsed >= attemptsAllowed;

    let videoCompleted = true;
    if (quizRes.rows[0].video_id) {
      const v = await pool.query(
        `SELECT completed FROM user_video_progress WHERE user_id=$1 AND video_id=$2`,
        [userId, quizRes.rows[0].video_id]
      );
      videoCompleted = v.rows.length ? !!v.rows[0].completed : false;
    }

    return res.json({
      success: true,
      attemptsUsed,
      attemptsAllowed,
      passed,
      locked,
      videoCompleted,
      passingScore: quizRes.rows[0].passing_score,
    });
  } catch (err) {
    console.error("getQuizStatus error:", err);
    return res.status(500).json({ success: false });
  }
};

/**
 * POST /api/progress/quiz/:quizId/reset (Admin)
 * Kept here — admin route to delete attempts and recompute progress.
 */
export const resetQuizAttempts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.is_admin)
      return res.status(403).json({ success: false, message: "Admin only" });

    const quizId = Number(req.params.quizId);
    const userId = Number(req.body.user_id);

    if (!quizId || !userId)
      return res.status(400).json({ success: false, message: "Bad request" });

    await pool.query(
      `DELETE FROM quiz_attempts WHERE quiz_id=$1 AND user_id=$2`,
      [quizId, userId]
    );

    // After reset, recompute course progress (in case passed quizzes were removed)
    try {
      const courseRes = await pool.query(
        `SELECT v.course_id
         FROM quizzes q
         JOIN videos v ON q.video_id = v.video_id
         WHERE q.quiz_id = $1
         LIMIT 1`,
        [quizId]
      );
      const courseId = courseRes.rows?.[0]?.course_id;
      if (courseId) {
        await updateCourseProgress(userId, courseId);
      }
    } catch (uerr) {
      console.error("resetQuizAttempts: failed to update course progress", uerr);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("resetQuizAttempts error:", err);
    return res.status(500).json({ success: false });
  }
};
