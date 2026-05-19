// backend/src/routes/authRoutes.ts
import express from "express";
import { login, register } from "../controllers/authController";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);

// optional health-check
router.get("/status", (_req, res) => res.json({ status: "ok", timestamp: new Date() }));

export default router;
