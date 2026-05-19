// backend/src/routes/contentRoutes.ts
import express from "express";
import { authRequired, adminRequired } from "../middleware/authMiddleware";

import {
  addVideo,
  updateVideo,
  deleteVideo,

  addQuizToVideo,
  updateQuiz,
  deleteQuiz,

  addQuestion,
  updateQuestion,
  deleteQuestion,

  addAnswer,
  updateAnswer,
  deleteAnswer
} from "../controllers/contentController";

const router = express.Router();

/* -------------------- VIDEOS -------------------- */
router.post("/courses/:courseId/videos", authRequired, adminRequired, addVideo);
router.patch("/videos/:videoId", authRequired, adminRequired, updateVideo);
router.delete("/videos/:videoId", authRequired, adminRequired, deleteVideo);

/* -------------------- QUIZZES -------------------- */
router.post("/videos/:videoId/quiz", authRequired, adminRequired, addQuizToVideo);
router.patch("/quizzes/:quizId", authRequired, adminRequired, updateQuiz);
router.delete("/quizzes/:quizId", authRequired, adminRequired, deleteQuiz);

/* -------------------- QUESTIONS -------------------- */
router.post("/quizzes/:quizId/questions", authRequired, adminRequired, addQuestion);
router.patch("/questions/:questionId", authRequired, adminRequired, updateQuestion);
router.delete("/questions/:questionId", authRequired, adminRequired, deleteQuestion);

/* -------------------- ANSWERS -------------------- */
router.post("/questions/:questionId/answers", authRequired, adminRequired, addAnswer);
router.patch("/answers/:answerId", authRequired, adminRequired, updateAnswer);
router.delete("/answers/:answerId", authRequired, adminRequired, deleteAnswer);

export default router;
