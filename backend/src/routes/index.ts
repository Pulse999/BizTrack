import express from "express";
import { authRequired, adminRequired } from "../middleware/authMiddleware";
import { getAllUsers } from "../controllers/adminController";
import { login } from "../controllers/authController";
import contentRoutes from "./contentRoutes";
import userRoutes from "./userRoutes";
import { supabase } from "../services/supabase";
import companyRoutes from "./companyRoutes";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const router = express.Router();

// Public Routes (NO /api prefix)
router.post("/auth/login", login);

// Protected profile route
router.get("/user/profile", authRequired, (req, res) => {
  res.json({ user: req.user });
});

// Admin-only
router.get("/admin/users", authRequired, adminRequired, getAllUsers);

// API routes with prefix
router.use("/api/content", contentRoutes);
router.use("/api/users", userRoutes);
router.use("/companies", companyRoutes);

// Test route
router.post("/test-storage", async (_req, res) => {
  try {
    const fileData = Buffer.from("Hello Supabase Storage!", "utf8");

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_CERT_BUCKET!)
      .upload("test-file.txt", fileData, {
        contentType: "text/plain",
        upsert: true,
      });

    if (error) throw error;

    const publicUrl = supabase.storage
      .from(process.env.SUPABASE_CERT_BUCKET!)
      .getPublicUrl("test-file.txt").data.publicUrl;

    return res.json({
      success: true,
      file: "test-file.txt",
      public_url: publicUrl,
    });
  } catch (err: any) {
    console.error("Storage Test Error:", err.message);
    return res
      .status(500)
      .json({ success: false, error: err.message });
  }
});

export default router;
