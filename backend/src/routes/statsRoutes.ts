// backend/src/routes/statsRoutes.ts
import express from "express";
import { adminGetStats, userGetStats } from "../controllers/statsController";
import { authRequired, adminRequired } from "../middleware/authMiddleware";
import { pool } from "../services/db";

const router = express.Router();

/* ----------------------------------------
   ADMIN STATS (your advanced dashboard)
---------------------------------------- */
router.get("/", authRequired, adminRequired, adminGetStats);

/* ----------------------------------------
   USER PERSONAL STATS (dashboard)
---------------------------------------- */
router.get("/me", authRequired, userGetStats);

/* ----------------------------------------
   SUPER ADMIN: list companies for dropdown
---------------------------------------- */
router.get("/companies", authRequired, adminRequired, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.is_super_admin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const q = await pool.query(
      "SELECT company_id, name FROM company WHERE is_active = true ORDER BY name ASC"
    );

    return res.json({ success: true, companies: q.rows });
  } catch (err) {
    console.error("companies error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
