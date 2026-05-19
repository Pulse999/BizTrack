// backend/src/routes/certificatesRoutes.ts
import express from "express";
import { generateCertificate, downloadCertificate } from "../controllers/certificatesController";
import { authRequired } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/generate/:courseId", authRequired, generateCertificate);
// serve by filename (unsafe if public; consider checking DB/certificate ownership)
router.get("/download/:filename", downloadCertificate);

export default router;
