// backend/src/controllers/videosController.ts
import { Response } from "express";
import { pool } from "../services/db";
import { AuthRequest } from "../middleware/authMiddleware";
import updateCourseProgress from "../utils/updateProgress";

export const getVideo = async (req: AuthRequest, res: Response) => {
  try {
    const videoId = Number(req.params.id);
    const userId = req.user?.user_id ?? null;

    if (!videoId || Number.isNaN(videoId)) {
      return res.status(400).json({ success: false, message: "Invalid video id" });
    }

    // Get video
    const videoRes = await pool.query(
      `SELECT video_id, course_id, title, description, video_url, duration_seconds, position
       FROM videos
       WHERE video_id = $1`,
      [videoId]
    );

    if (!videoRes.rows.length) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const video = videoRes.rows[0];

    // Auto-enroll user for this course when they access a video (Option B)
    if (userId) {
      try {
        await pool.query(
          `INSERT INTO enrolled_courses (user_id, course_id, progress_percent, last_accessed_at)
           VALUES ($1, $2, 0, NOW())
           ON CONFLICT (user_id, course_id) DO NOTHING`,
          [userId, video.course_id]
        );

        // Immediately compute an accurate progress
        try {
          await updateCourseProgress(userId, video.course_id);
        } catch (uerr) {
          console.error("getVideo: updateCourseProgress failed:", uerr);
        }
      } catch (upsertErr) {
        console.error("getVideo: failed to upsert enrolled_courses:", upsertErr);
      }
    }

    // Get course (minimal)
    const courseRes = await pool.query(
      `SELECT course_id, title
       FROM courses
       WHERE course_id = $1`,
      [video.course_id]
    );
    const course = courseRes.rows[0] || null;

    // Get playlist
    const playlistRes = await pool.query(
      `SELECT video_id, title, position
       FROM videos
       WHERE course_id = $1
       ORDER BY position ASC`,
      [video.course_id]
    );

    // Get quiz (if exists)
    const quizRes = await pool.query(
      `SELECT quiz_id, title, passing_score
       FROM quizzes
       WHERE video_id = $1
       LIMIT 1`,
      [videoId]
    );

    let quiz = quizRes.rows[0] || null;

    if (quiz) {
      // Get questions + answers (do not expose is_correct to client)
      const qRes = await pool.query(
        `SELECT q.question_id, q.text AS question_text, a.answer_id, a.text AS answer_text, a.is_correct, a.position AS answer_position
         FROM questions q
         LEFT JOIN answers a ON a.question_id = q.question_id
         WHERE q.quiz_id = $1
         ORDER BY q.position ASC, a.position ASC`,
        [quiz.quiz_id]
      );

      const questionsMap = new Map<number, { question_id: number; text: string; answers: any[] }>();

      for (const row of qRes.rows) {
        const qid = row.question_id;
        if (!questionsMap.has(qid)) {
          questionsMap.set(qid, {
            question_id: qid,
            text: row.question_text,
            answers: []
          });
        }

        // Only push answers that exist; exclude is_correct from client payload
        if (row.answer_id !== null) {
          questionsMap.get(qid)!.answers.push({
            answer_id: row.answer_id,
            text: row.answer_text,
            position: row.answer_position
          });
        }
      }

      quiz = {
        ...quiz,
        questions: Array.from(questionsMap.values())
      };
    }

    return res.json({
      success: true,
      video,
      course,
      playlist: playlistRes.rows,
      quiz
    });
  } catch (err: any) {
    console.error("getVideo error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch video", error: err?.message ?? null });
  }
};
