// backend/src/controllers/quizController.ts
import { Request, Response } from "express";
import { pool } from "../services/db";
import { AuthRequest } from "../middleware/authMiddleware";
import updateCourseProgress from "../utils/updateProgress";

/**
 * GET /api/quiz/:quizId
 * Return quiz with questions + answers (do not expose is_correct flags)
 */
export const getQuiz = async (req: Request, res: Response) => {
  const quizId = Number(req.params.quizId);
  if (!quizId) return res.status(400).json({ error: "Invalid quiz id" });

  try {
    const quizRes = await pool.query(
      `SELECT quiz_id, video_id, title, passing_score
       FROM quizzes
       WHERE quiz_id = $1
       LIMIT 1`,
      [quizId]
    );

    const quiz = quizRes.rows[0];
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const qRes = await pool.query(
      `SELECT question_id, quiz_id, text, position, points
       FROM questions
       WHERE quiz_id = $1
       ORDER BY position ASC`,
      [quizId]
    );

    const questions = qRes.rows;
    const questionIds = questions.map((q) => q.question_id);

    let answers: any[] = [];
    if (questionIds.length > 0) {
      const aRes = await pool.query(
        `SELECT answer_id, question_id, text, position
         FROM answers
         WHERE question_id = ANY($1)
         ORDER BY position ASC`,
        [questionIds]
      );
      answers = aRes.rows;
    }

    const questionsWithAnswers = questions.map((q) => ({
      ...q,
      answers: answers.filter((a) => a.question_id === q.question_id),
    }));

    return res.json({
      success: true,
      quiz: { ...quiz, questions: questionsWithAnswers },
    });
  } catch (err) {
    console.error("getQuiz error:", err);
    return res.status(500).json({ error: "Could not fetch quiz" });
  }
};

/**
 * GET /api/quiz/:quizId/attempt/latest
 * Return the user's latest attempt for this quiz (with question-level answers)
 */
export const getLatestAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const quizId = Number(req.params.quizId);
    if (!quizId) return res.status(400).json({ success: false, message: "Invalid quiz id" });
    if (!req.user) return res.status(401).json({ success: false, message: "Auth required" });

    // Fetch latest attempt for this user + quiz
    const attemptRes = await pool.query(
      `SELECT attempt_id, score, passed, started_at, completed_at, attempt_number
       FROM quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2
       ORDER BY completed_at DESC NULLS LAST, started_at DESC
       LIMIT 1`,
      [quizId, req.user.user_id]
    );

    if (!attemptRes.rows.length) {
      return res.json({ success: true, attempt: null });
    }

    const attempt = attemptRes.rows[0];

    // fetch attempt answers, join to answers to get answer text & correct flag
    const answersRes = await pool.query(
      `SELECT qaa.attempt_id, qaa.question_id, qaa.selected_answer_id, qaa.is_correct,
              COALESCE(a.text, '') AS answer_text, a.is_correct AS answer_is_correct
       FROM quiz_attempt_answers qaa
       LEFT JOIN answers a ON qaa.selected_answer_id = a.answer_id
       WHERE qaa.attempt_id = $1
       ORDER BY qaa.question_id`,
      [attempt.attempt_id]
    );

    const results = answersRes.rows.map((r: any) => ({
      question_id: r.question_id,
      user_answer_id: r.selected_answer_id,
      user_answer_text: r.answer_text || null,
      correct: !!r.is_correct,
      correct_answer_text: r.answer_is_correct ? r.answer_text : null, // if selected answer is marked correct, text is correct; else we'll fetch canonical below
    }));

    // For canonical correct answers where result.correct === false, fetch correct answer text per question
    const questionIds = results.map((r) => r.question_id);
    if (questionIds.length > 0) {
      const correctTextRes = await pool.query(
        `SELECT question_id, text FROM answers WHERE question_id = ANY($1) AND is_correct = true`,
        [questionIds]
      );
      const correctByQ: Record<number, string> = {};
      correctTextRes.rows.forEach((r: any) => {
        if (!correctByQ[r.question_id]) correctByQ[r.question_id] = r.text;
      });

      // attach canonical correct text if missing
      results.forEach((r) => {
        if (!r.correct_answer_text) {
          r.correct_answer_text = correctByQ[r.question_id] ?? null;
        }
      });
    }

    // determine certificateReady for this user's course (same logic used elsewhere)
    let certificateReady = false;
    try {
      const courseQ = await pool.query(
        `SELECT v.course_id
         FROM quizzes q
         JOIN videos v ON q.video_id = v.video_id
         WHERE q.quiz_id = $1
         LIMIT 1`,
        [quizId]
      );
      const courseId = courseQ.rows?.[0]?.course_id ?? null;

      if (courseId) {
        const totalQuizzesRes = await pool.query(
          `SELECT COUNT(*)::int AS total_quizzes FROM quizzes WHERE course_id = $1`,
          [courseId]
        );
        const passedRes = await pool.query(
          `SELECT COUNT(DISTINCT qa.quiz_id)::int AS passed_quizzes
           FROM quiz_attempts qa
           JOIN quizzes q ON qa.quiz_id = q.quiz_id
           WHERE qa.user_id = $1 AND qa.passed = true AND q.course_id = $2`,
          [req.user.user_id, courseId]
        );

        const totalQuizzes = Number(totalQuizzesRes.rows?.[0]?.total_quizzes ?? 0);
        const passedQuizzes = Number(passedRes.rows?.[0]?.passed_quizzes ?? 0);

        if (totalQuizzes > 0 && passedQuizzes >= totalQuizzes) {
          certificateReady = true;
        }
      }
    } catch (cerr) {
      console.error("getLatestAttempt: certificateReady check failed:", cerr);
    }

    return res.json({
      success: true,
      attempt: {
        attempt_id: attempt.attempt_id,
        score: Number(attempt.score),
        passed: !!attempt.passed,
        started_at: attempt.started_at,
        completed_at: attempt.completed_at,
        attempt_number: attempt.attempt_number,
        results,
        certificateReady,
      },
    });
  } catch (err) {
    console.error("getLatestAttempt error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * POST /api/quiz/:quizId/attempt
 * Body: { answers: [{ question_id, selected_answer_id }, ...] }
 * Returns: { passed, score, results: [...], certificateReady, locked, attemptsUsed, attemptsAllowed }
 */
export const submitQuizAttempt = async (req: AuthRequest, res: Response) => {
  const quizId = Number(req.params.quizId);
  if (!quizId) return res.status(400).json({ error: "Invalid quiz id" });
  if (!req.user) return res.status(401).json({ error: "Authentication required" });

  try {
    // 1️⃣ Load questions and correct answers
    const qRes = await pool.query(
      `SELECT question_id, text
       FROM questions
       WHERE quiz_id = $1`,
      [quizId]
    );

    const questions = qRes.rows;
    if (questions.length === 0)
      return res.status(400).json({ error: "Quiz has no questions" });

    const questionIds = questions.map((q) => q.question_id);

    const aRes = await pool.query(
      `SELECT question_id, answer_id, text, is_correct
       FROM answers
       WHERE question_id = ANY($1)`,
      [questionIds]
    );

    const correctMap: Record<number, number[]> = {};
    const answersByQuestion: Record<number, any[]> = {};
    for (const r of aRes.rows) {
      if (!answersByQuestion[r.question_id]) answersByQuestion[r.question_id] = [];
      answersByQuestion[r.question_id].push(r);
      if (r.is_correct) {
        if (!correctMap[r.question_id]) correctMap[r.question_id] = [];
        correctMap[r.question_id].push(r.answer_id);
      }
    }

    // 2️⃣ Evaluate submission
    const submitted = (req.body.answers || []) as Array<{
      question_id: number;
      selected_answer_id: number | null;
    }>;

    let correctCount = 0;
    const total = questionIds.length;
    const results: Array<{
      question_id: number;
      correct: boolean;
      user_answer_text: string | null;
      correct_answer_text: string | null;
    }> = [];

    for (const q of questions) {
      const s = submitted.find((x) => x.question_id === q.question_id);
      const selected = s ? s.selected_answer_id : null;
      const correctIds = correctMap[q.question_id] || [];
      const isCorrect = selected != null && correctIds.includes(selected);
      if (isCorrect) correctCount++;

      // fetch answer texts
      const answerList = answersByQuestion[q.question_id] || [];
      const userAnswer = answerList.find((a) => a.answer_id === selected);
      const correctAnswer = answerList.find((a) => a.is_correct);

      results.push({
        question_id: q.question_id,
        correct: isCorrect,
        user_answer_text: userAnswer ? userAnswer.text : null,
        correct_answer_text: correctAnswer ? correctAnswer.text : null,
      });
    }

    const score = total > 0 ? (correctCount / total) * 100 : 0;

    // Determine passing score and video id
    const passRes = await pool.query(
      `SELECT passing_score, attempts_allowed, video_id FROM quizzes WHERE quiz_id = $1 LIMIT 1`,
      [quizId]
    );
    const passingScore = passRes.rows[0] ? Number(passRes.rows[0].passing_score ?? 80) : 80;
    const attemptsAllowed = passRes.rows[0] && passRes.rows[0].attempts_allowed > 0 ? Number(passRes.rows[0].attempts_allowed) : 3;
    const videoId = passRes.rows[0] ? Number(passRes.rows[0].video_id) : null;

    const passed = score >= passingScore;

    // 3️⃣ Record attempt
    const prev = await pool.query(
      `SELECT COUNT(*)::int AS cnt,
              COUNT(*) FILTER (WHERE passed = true) AS passed_cnt
       FROM quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2`,
      [quizId, req.user.user_id]
    );

    const prevCount = prev.rows[0]?.cnt || 0;
    const attemptNumber = prevCount + 1;

    // If user already passed before this submission, disallow (protect against race)
    if (prev.rows[0]?.passed_cnt > 0) {
      return res.status(400).json({ success: false, message: "Quiz already passed." });
    }

    const attemptRes = await pool.query(
      `INSERT INTO quiz_attempts (quiz_id, user_id, score, passed, started_at, completed_at, duration_seconds, attempt_number)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6)
       RETURNING attempt_id`,
      [quizId, req.user.user_id, Math.round(score * 100) / 100, passed, 0, attemptNumber]
    );

    const attemptId = attemptRes.rows[0].attempt_id;

    const insertValues: any[] = [];
    const params: any[] = [];
    let i = 1;

    for (const r of results) {
      const selected = submitted.find((a) => a.question_id === r.question_id)?.selected_answer_id;
      insertValues.push(`($${i++}, $${i++}, $${i++}, $${i++})`);
      params.push(attemptId, r.question_id, selected, r.correct);
    }

    if (insertValues.length) {
      await pool.query(
        `INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_answer_id, is_correct)
         VALUES ${insertValues.join(", ")}`,
        params
      );
    }

    // 4️⃣ Update course progress (if possible)
    try {
      // fetch course_id for this quiz
      const courseQ = await pool.query(
        `SELECT v.course_id
         FROM quizzes q
         JOIN videos v ON q.video_id = v.video_id
         WHERE q.quiz_id = $1
         LIMIT 1`,
        [quizId]
      );
      const courseId = courseQ.rows?.[0]?.course_id ?? null;
      if (courseId) {
        // keep the enrolled_courses.progress_percent accurate
        await updateCourseProgress(req.user.user_id, courseId);
      }
    } catch (uerr) {
      console.error("submitQuizAttempt: updateCourseProgress failed:", uerr);
    }

    // 5️⃣ Attempts / locked logic
    const attemptsRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt,
              COUNT(*) FILTER (WHERE passed = true) AS passed_cnt
       FROM quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2`,
      [quizId, req.user.user_id]
    );

    const attemptsUsed = Number(attemptsRes.rows[0]?.cnt ?? 0);
    const userPassedCount = Number(attemptsRes.rows[0]?.passed_cnt ?? 0);
    const locked = userPassedCount === 0 && attemptsUsed >= attemptsAllowed;

    // If locked due to exhausting attempts without passing: reset video completion & recompute progress
    if (locked && videoId) {
      try {
        await pool.query(
          `UPDATE user_video_progress
           SET completed = FALSE, completed_at = NULL
           WHERE user_id = $1 AND video_id = $2`,
          [req.user.user_id, videoId]
        );

        // Recompute course progress (since we removed completed flag)
        const courseQ2 = await pool.query(
          `SELECT v.course_id
           FROM videos v
           WHERE v.video_id = $1
           LIMIT 1`,
          [videoId]
        );
        const courseId2 = courseQ2.rows?.[0]?.course_id ?? null;
        if (courseId2) {
          await updateCourseProgress(req.user.user_id, courseId2);
        }
      } catch (err) {
        console.error("submitQuizAttempt: failed to reset video completion after lock:", err);
      }
    }

    // 6️⃣ Determine if certificate is now unlocked (passed all quizzes in course)
    let certificateReady = false;
    try {
      const courseQ = await pool.query(
        `SELECT v.course_id
         FROM quizzes q
         JOIN videos v ON q.video_id = v.video_id
         WHERE q.quiz_id = $1
         LIMIT 1`,
        [quizId]
      );
      const courseId = courseQ.rows?.[0]?.course_id ?? null;

      if (courseId) {
        const totalQuizzesRes = await pool.query(
          `SELECT COUNT(*)::int AS total_quizzes FROM quizzes WHERE course_id = $1`,
          [courseId]
        );
        const passedRes = await pool.query(
          `SELECT COUNT(DISTINCT qa.quiz_id)::int AS passed_quizzes
           FROM quiz_attempts qa
           JOIN quizzes q ON qa.quiz_id = q.quiz_id
           WHERE qa.user_id = $1 AND qa.passed = true AND q.course_id = $2`,
          [req.user.user_id, courseId]
        );

        const totalQuizzes = Number(totalQuizzesRes.rows?.[0]?.total_quizzes ?? 0);
        const passedQuizzes = Number(passedRes.rows?.[0]?.passed_quizzes ?? 0);

        if (totalQuizzes > 0 && passedQuizzes >= totalQuizzes) {
          certificateReady = true;
        }
      }
    } catch (cerr) {
      console.error("submitQuizAttempt: certificateReady check failed:", cerr);
    }

    // 7️⃣ Respond with detailed results
    return res.json({
      success: true,
      passed,
      score: Math.round(score * 100) / 100,
      correctCount,
      total,
      attempt_number: attemptNumber,
      results,
      certificateReady,
      attemptsUsed,
      attemptsAllowed,
      locked,
    });
  } catch (err) {
    console.error("submitQuizAttempt error:", err);
    return res.status(500).json({ error: "Could not submit attempt" });
  }
};
