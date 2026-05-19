// backend/src/routes/progressRoutes.ts
import express from "express";
import {
  getVideoStatus,
  completeVideo,
  getQuizStatus,
  resetQuizAttempts,
} from "../controllers/progressController";
import { authRequired, adminRequired } from "../middleware/authMiddleware";

const router = express.Router();

// --- VIDEO PROGRESS ---
router.get("/video/:videoId/status", authRequired, getVideoStatus);
router.post("/video/:videoId/complete", authRequired, completeVideo);

// --- QUIZ STATUS (Attempts info, lock/unlock, etc.) ---
router.get("/quiz/:quizId/status", authRequired, getQuizStatus);

// --- ADMIN RESET ONLY ---
router.post("/quiz/:quizId/reset", authRequired, adminRequired, resetQuizAttempts);

// IMPORTANT:
// Quiz submission endpoint lives in quizRoutes.ts as POST /api/quiz/:quizId/attempt

export default router;
