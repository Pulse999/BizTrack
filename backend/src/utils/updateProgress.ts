// backend/src/utils/updateProgress.ts
import { pool } from "../services/db";

/**
 * Compute and update course progress for a user.
 *
 * Formula (your selected rules):
 *   - Video completion gives 1 point
 *   - Quiz passing gives 1 point
 *   - BUT a quiz only counts if its video is completed (Rule B)
 *
 * TOTAL POINTS = total_videos + total_quizzes
 * EARNED = completed_videos + passed_quizzes (only with completed video)
 *
 * progress_percent = round((earned / total) * 100)
 *
 * Saves result in enrolled_courses.
 */
export async function updateCourseProgress(
  userId: number,
  courseId: number
): Promise<number> {
  if (!userId || !courseId) {
    throw new Error("userId and courseId are required");
  }

  /* -----------------------------------------------------
     1) Count total videos for this course
     ----------------------------------------------------- */
  const videoRes = await pool.query(
    `SELECT COUNT(*)::int AS total_videos
     FROM videos
     WHERE course_id = $1`,
    [courseId]
  );
  const totalVideos = videoRes.rows?.[0]?.total_videos ?? 0;

  /* -----------------------------------------------------
     2) Count total quizzes (quiz belongs to video's course)
     ----------------------------------------------------- */
  const quizRes = await pool.query(
    `SELECT COUNT(*)::int AS total_quizzes
     FROM quizzes q
     JOIN videos v ON q.video_id = v.video_id
     WHERE v.course_id = $1`,
    [courseId]
  );
  const totalQuizzes = quizRes.rows?.[0]?.total_quizzes ?? 0;

  const totalPoints = totalVideos + totalQuizzes;

  /* -----------------------------------------------------
     3) Count videos completed by this user for this course
     ----------------------------------------------------- */
  const completedVideoRes = await pool.query(
    `SELECT COUNT(DISTINCT uvp.video_id)::int AS completed_videos
     FROM user_video_progress uvp
     JOIN videos v ON uvp.video_id = v.video_id
     WHERE uvp.user_id = $1
       AND v.course_id = $2
       AND uvp.completed = TRUE`,
    [userId, courseId]
  );
  const completedVideos =
    completedVideoRes.rows?.[0]?.completed_videos ?? 0;

  /* -----------------------------------------------------
     4) Count quizzes passed by user *AND* video completed
        (Rule B enforced here)
     ----------------------------------------------------- */
  const passedQuizRes = await pool.query(
    `SELECT COUNT(DISTINCT qa.quiz_id)::int AS passed_quizzes
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.quiz_id
     JOIN videos v ON q.video_id = v.video_id
     JOIN user_video_progress uvp 
         ON uvp.video_id = v.video_id AND uvp.user_id = qa.user_id
     WHERE qa.user_id = $1
       AND v.course_id = $2
       AND qa.passed = TRUE
       AND uvp.completed = TRUE`,
    [userId, courseId]
  );
  const passedQuizzes = passedQuizRes.rows?.[0]?.passed_quizzes ?? 0;

  /* -----------------------------------------------------
     5) Calculate progress %
     ----------------------------------------------------- */
  const progressPercent =
    totalPoints > 0
      ? Math.round(((completedVideos + passedQuizzes) / totalPoints) * 100)
      : 0;

  /* -----------------------------------------------------
     6) Save/Update enrolled_courses
     ----------------------------------------------------- */
  await pool.query(
    `INSERT INTO enrolled_courses (user_id, course_id, progress_percent, last_accessed_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, course_id)
     DO UPDATE SET progress_percent = EXCLUDED.progress_percent,
                   last_accessed_at = NOW()`,
    [userId, courseId, progressPercent]
  );

  return progressPercent;
}

export default updateCourseProgress;
