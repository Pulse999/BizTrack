// backend/src/routes/quizRoutes.ts
import express from "express";
import { getQuiz, submitQuizAttempt, getLatestAttempt } from "../controllers/quizController";
import { authRequired } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:quizId", authRequired, getQuiz);
router.get("/:quizId/attempt/latest", authRequired, getLatestAttempt);
router.post("/:quizId/attempt", authRequired, submitQuizAttempt);

export default router;
