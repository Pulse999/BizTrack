// backend/src/controllers/contentController.ts
import { Response } from "express";
import { pool } from "../services/db";
import { AuthRequest } from "../middleware/authMiddleware";

/* -------------------- VIDEOS -------------------- */

export const addVideo = async (req: AuthRequest, res: Response) => {
  const courseId = Number(req.params.courseId);
  const { title, description, video_url } = req.body;

  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin required" });
  if (!title || !video_url) return res.status(400).json({ error: "Title and video URL required" });

  try {
    const result = await pool.query(
      `INSERT INTO videos (course_id, title, description, video_url, position)
       VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(position),0)+1 FROM videos WHERE course_id = $1))
       RETURNING video_id, course_id, title, description, video_url, position`,
      [courseId, title, description || "", video_url]
    );
    return res.json({ success: true, video: result.rows[0] });
  } catch (err: any) {
    console.error("addVideo error:", err);
    return res.status(500).json({ error: "Could not add video", detail: err?.message ?? null });
  }
};

export const updateVideo = async (req: AuthRequest, res: Response) => {
  const videoId = Number(req.params.videoId);
  const { title, description, video_url } = req.body;

  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin required" });

  try {
    const result = await pool.query(
      `UPDATE videos
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           video_url = COALESCE($3, video_url)
       WHERE video_id = $4
       RETURNING video_id, course_id, title, description, video_url, position`,
      [title ?? null, description ?? null, video_url ?? null, videoId]
    );
    return res.json({ success: true, video: result.rows[0] });
  } catch (err: any) {
    console.error("updateVideo error:", err);
    return res.status(500).json({ error: "Could not update video", detail: err?.message ?? null });
  }
};

export const deleteVideo = async (req: AuthRequest, res: Response) => {
  const videoId = Number(req.params.videoId);
  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin required" });

  try {
    await pool.query(`DELETE FROM videos WHERE video_id = $1`, [videoId]);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("deleteVideo error:", err);
    return res.status(500).json({ error: "Could not delete video", detail: err?.message ?? null });
  }
};

/* -------------------- QUIZZES (one per video) -------------------- */

/**
 * Add quiz to video.
 * Accepts optional `questions` array in body:
 * { title, passing_score, questions: [{ text, position, points, answers: [{ text, is_correct }] }] }
 * The whole operation is wrapped in a transaction.
 */
export const addQuizToVideo = async (req: AuthRequest, res: Response) => {
  const videoId = Number(req.params.videoId);
  const { title, passing_score, questions } = req.body;

  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin required" });
  if (!title) return res.status(400).json({ error: "Quiz title required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const vRes = await client.query(`SELECT course_id FROM videos WHERE video_id = $1`, [videoId]);
    const video = vRes.rows[0];
    if (!video) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Video not found" });
    }

    const existing = await client.query(`SELECT quiz_id FROM quizzes WHERE video_id = $1`, [videoId]);
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "This video already has a quiz" });
    }

    const quizRes = await client.query(
      `INSERT INTO quizzes (course_id, video_id, title, passing_score)
       VALUES ($1, $2, $3, $4)
       RETURNING quiz_id, course_id, video_id, title, passing_score`,
      [video.course_id, videoId, title, passing_score ?? 80]
    );
    const quiz = quizRes.rows[0];

    const createdQuestions: any[] = [];

    // Optional: create questions + answers in same request (admin convenience)
    if (Array.isArray(questions) && questions.length) {
      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        if (!q || !q.text) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Each question must include text" });
        }

        const qInsert = await client.query(
          `INSERT INTO questions (quiz_id, text, position, points)
           VALUES ($1, $2, COALESCE($3, (SELECT COALESCE(MAX(position),0)+1 FROM questions WHERE quiz_id = $1)), COALESCE($4,1))
           RETURNING question_id, quiz_id, text, position, points`,
          [quiz.quiz_id, q.text, q.position ?? null, q.points ?? null]
        );
        const createdQ = qInsert.rows[0];

        const createdAnswers: any[] = [];
        if (Array.isArray(q.answers) && q.answers.length) {
          // enforce at least 2 and at most 4 answers on server side
          if (q.answers.length < 2 || q.answers.length > 6) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Each question must have between 2 and 6 answers" });
          }

          // ensure at least one correct
          const hasCorrect = q.answers.some((a: any) => a.is_correct === true);
          if (!hasCorrect) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Each question must have at least one correct answer" });
          }

          for (let ai = 0; ai < q.answers.length; ai++) {
            const a = q.answers[ai];
            const aInsert = await client.query(
              `INSERT INTO answers (question_id, text, is_correct, position)
               VALUES ($1, $2, $3, $4)
               RETURNING answer_id, question_id, text, is_correct, position`,
              [createdQ.question_id, a.text, !!a.is_correct, ai + 1]
            );
            createdAnswers.push(aInsert.rows[0]);
          }
        }

        createdQuestions.push({ ...createdQ, answers: createdAnswers });
      }
    }

    await client.query("COMMIT");

    // return created quiz and optionally nested created questions
    return res.json({
      success: true,
      quiz: {
        ...quiz,
        questions: createdQuestions
      }
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("addQuizToVideo error:", err);
    // better error message for unique/foreign key errors
    const detail = err?.detail || err?.message || null;
    return res.status(500).json({ error: "Could not add quiz", detail });
  } finally {
    client.release();
  }
};

export const updateQuiz = async (req: AuthRequest, res: Response) => {
  const quizId = Number(req.params.quizId);
  const { title, passing_score } = req.body;

  if (!req.user?.is_admin)
    return res.status(403).json({ error: "Admin required" });

  try {
    // normalize passing score
    let ps: number | null = null;

    if (passing_score !== undefined && passing_score !== null && passing_score !== "") {
      let num = Number(passing_score);
      if (!isNaN(num)) {
        num = Math.min(100, Math.max(1, num)); // clamp
        ps = num;
      }
    }

    const result = await pool.query(
      `UPDATE quizzes
       SET 
         title = COALESCE($1, title),
         passing_score = COALESCE($2::INT, passing_score)
       WHERE quiz_id = $3
       RETURNING quiz_id, course_id, video_id, title, passing_score`,
      [
        title ?? null,
        ps,       // always null or number
        quizId
      ]
    );

    return res.json({ success: true, quiz: result.rows[0] });
  } catch (err: any) {
    console.error("updateQuiz error:", err);
    return res.status(500).json({
      error: "Could not update quiz",
      detail: err?.message ?? null,
    });
  }
};


export const deleteQuiz = async (req: AuthRequest, res: Response) => {
  const quizId = Number(req.params.quizId);
  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin required" });

  try {
    await pool.query(`DELETE FROM quizzes WHERE quiz_id = $1`, [quizId]);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("deleteQuiz error:", err);
    return res.status(500).json({ error: "Could not delete quiz", detail: err?.message ?? null });
  }
};

/* -------------------- QUESTIONS & ANSWERS -------------------- */

export const addQuestion = async (req: AuthRequest, res: Response) => {
  const quizId = Number(req.params.quizId);
  const { text, answers, position, points } = req.body;

  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin required" });
  if (!text) return res.status(400).json({ error: "Question text required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const qRes = await client.query(
      `INSERT INTO questions (quiz_id, text, position, points)
       VALUES ($1, $2, COALESCE($3, (SELECT COALESCE(MAX(position),0)+1 FROM questions WHERE quiz_id = $1)), COALESCE($4,1))
       RETURNING question_id, quiz_id, text, position, points`,
      [quizId, text, position || null, points || null]
    );
    const question = qRes.rows[0];

    const createdAnswers: any[] = [];
    if (Array.isArray(answers) && answers.length) {
      if (answers.length < 2 || answers.length > 6) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Answers must be between 2 and 6 items" });
      }
      const hasCorrect = answers.some((a: any) => a.is_correct === true);
      if (!hasCorrect) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "At least one answer must be correct" });
      }

      for (let i = 0; i < answers.length; i++) {
        const a = answers[i];
        const aRes = await client.query(
          `INSERT INTO answers (question_id, text, is_correct, position)
           VALUES ($1, $2, $3, $4)
           RETURNING answer_id, question_id, text, is_correct, position`,
          [question.question_id, a.text, !!a.is_correct, i + 1]
        );
        createdAnswers.push(aRes.rows[0]);
      }
    }

    await client.query("COMMIT");

    return res.json({ success: true, question: { ...question, answers: createdAnswers } });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("addQuestion error:", err);
    return res.status(500).json({ error: "Could not add question", detail: err?.message ?? null });
  } finally {
    client.release();
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  const questionId = Number(req.params.questionId);
  const { text, position, points } = req.body;
  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin required" });

  try {
    const qRes = await pool.query(
      `UPDATE questions
       SET text = COALESCE($1, text),
           position = COALESCE($2, position),
           points = COALESCE($3, points)
       WHERE question_id = $4
       RETURNING question_id, quiz_id, text, position, points`,
      [text ?? null, position ?? null, points ?? null, questionId]
    );

    const aRes = await pool.query(
      `SELECT answer_id, question_id, text, is_correct, position
       FROM answers WHERE question_id = $1 ORDER BY position ASC`,
      [questionId]
    );

    return res.json({ success: true, question: { ...qRes.rows[0], answers: aRes.rows } });
  } catch (err: any) {
    console.error("updateQuestion error:", err);
    return res.status(500).json({ error: "Could not update question", detail: err?.message ?? null });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  const questionId = Number(req.params.questionId);
  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin required" });

  try {
    await pool.query(`DELETE FROM questions WHERE question_id = $1`, [questionId]);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("deleteQuestion error:", err);
    return res.status(500).json({ error: "Could not delete question", detail: err?.message ?? null });
  }
};

export const addAnswer = async (req: AuthRequest, res: Response) => {
  const questionId = Number(req.params.questionId);
  const { text, is_correct, position } = req.body;
  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin required" });
  if (!text) return res.status(400).json({ error: "Answer text required" });

  try {
    const aRes = await pool.query(
      `INSERT INTO answers (question_id, text, is_correct, position)
       VALUES ($1, $2, $3, COALESCE($4, (SELECT COALESCE(MAX(position),0)+1 FROM answers WHERE question_id = $1)))
       RETURNING answer_id, question_id, text, is_correct, position`,
      [questionId, text, !!is_correct, position || null]
    );
    return res.json({ success: true, answer: aRes.rows[0] });
  } catch (err: any) {
    console.error("addAnswer error:", err);
    return res.status(500).json({ error: "Could not add answer", detail: err?.message ?? null });
  }
};

export const updateAnswer = async (req: AuthRequest, res: Response) => {
  const answerId = Number(req.params.answerId);
  const { text, is_correct, position } = req.body;
  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin required" });

  try {
    const aRes = await pool.query(
      `UPDATE answers
       SET text = COALESCE($1, text),
           is_correct = COALESCE($2, is_correct),
           position = COALESCE($3, position)
       WHERE answer_id = $4
       RETURNING answer_id, question_id, text, is_correct, position`,
      [text ?? null, typeof is_correct === "boolean" ? is_correct : null, position ?? null, answerId]
    );
    return res.json({ success: true, answer: aRes.rows[0] });
  } catch (err: any) {
    console.error("updateAnswer error:", err);
    return res.status(500).json({ error: "Could not update answer", detail: err?.message ?? null });
  }
};

export const deleteAnswer = async (req: AuthRequest, res: Response) => {
  const answerId = Number(req.params.answerId);
  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin required" });

  try {
    await pool.query(`DELETE FROM answers WHERE answer_id = $1`, [answerId]);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("deleteAnswer error:", err);
    return res.status(500).json({ error: "Could not delete answer", detail: err?.message ?? null });
  }
};
