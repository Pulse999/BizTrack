// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { pool } from "../services/db";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export interface AuthRequest extends Request {
  user?: any;
}

export function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid authorization format" });
  }

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

export function adminRequired(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Auth required" });

  // Super admins implicitly have admin rights
  if (req.user.is_super_admin) return next();

  // Company admins (unified course + company admin role)
  if (req.user.is_admin) return next();

  return res.status(403).json({ error: "Admin privileges required" });
}

/**
 * Helper: check if a user can manage a specific course
 * Role Model:
 * - super_admin: full access everywhere
 * - admin: full access inside their company only
 * - normal user: no editing permissions
 */
// ------------------------------------------------------------
// CAN MANAGE COURSE
// ------------------------------------------------------------

export async function canManageCourse(user: any, courseId: number) {
  if (!user) return false;

  // ⭐ SUPER ADMIN CAN MANAGE ANY COURSE
  if (user.is_super_admin) return true;

  // ⭐ NORMAL ADMIN / USER MUST MATCH COMPANY
  try {
    const r = await pool.query(
      `SELECT company_id FROM courses WHERE course_id = $1 LIMIT 1`,
      [courseId]
    );

    if (r.rows.length === 0) return false;

    const courseCompanyId = r.rows[0].company_id;

    return user.company_id === courseCompanyId;
  } catch (err) {
    console.error("canManageCourse error:", err);
    return false;
  }
}




