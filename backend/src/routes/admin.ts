// backend/src/routes/admin.ts
import express from "express";
import { pool } from "../services/db";

const router = express.Router();

router.get("/stats", async (_req, res) => {
  try {
    const [coursesResult, videosResult, quizzesResult] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM courses WHERE is_active = true"),
      pool.query("SELECT COUNT(*) FROM videos WHERE is_active = true"),
      pool.query("SELECT COUNT(*) FROM quizzes"),
    ]);

    const stats = {
      activeCourses: parseInt(coursesResult.rows[0].count),
      totalModules: parseInt(videosResult.rows[0].count),
      totalQuizzes: parseInt(quizzesResult.rows[0].count),
    };

    res.json({ success: true, stats });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
