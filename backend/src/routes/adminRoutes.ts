// backend/src/routes/adminRoutes.ts
import express from "express";
import {
  listUsers,
  toggleAdmin,
  getAllUsers,
  getCompanyAnalytics,
  unlockUserQuiz,
} from "../controllers/adminController";
import { authRequired, adminRequired } from "../middleware/authMiddleware";
import { pool } from "../services/db";

const router = express.Router();

// All admin routes require both auth + admin role
router.get("/users", authRequired, adminRequired, listUsers);
router.patch("/users/:userId/toggle-admin", authRequired, adminRequired, toggleAdmin);
router.patch("/users/:userId", authRequired, adminRequired, toggleAdmin); // alternate
router.get("/all-users", authRequired, adminRequired, getAllUsers);

// Admin statistics (basic counts) - kept for compatibility
router.get("/stats", async (req, res) => {
  try {
    const [usersResult, coursesResult, enrollmentsResult, completedResult] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM courses"),
      pool.query("SELECT COUNT(*) FROM enrolled_courses"),
      pool.query("SELECT COUNT(*) FROM enrolled_courses WHERE progress_percent = 100"),
    ]);

    const stats = {
      totalUsers: parseInt(usersResult.rows[0].count),
      totalCourses: parseInt(coursesResult.rows[0].count),
      totalEnrollments: parseInt(enrollmentsResult.rows[0].count),
      completedCourses: parseInt(completedResult.rows[0].count),
    };

    res.json({ success: true, stats });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// === NEW / UPDATED ROUTES ===
// Get analytics (company-scoped unless super admin)
// Returns:
// { success: true, analytics: <deep>, analyticsLive: <summary> }
router.get("/analytics", authRequired, adminRequired, getCompanyAnalytics);

// Unlock (delete) a user's quiz attempts (body: { quiz_id, user_id })
router.post("/analytics/unlock", authRequired, adminRequired, unlockUserQuiz);

export default router;
