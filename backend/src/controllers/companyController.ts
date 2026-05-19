// backend/src/controllers/companyController.ts
import { Request, Response } from "express";
import { pool } from "../services/db"; // <- required
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * GET /api/companies/:id/name
 * Returns: { success: true, name: "Biztrack" } or { success: false, name: null }
 */
export const getCompanyName = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    if (!companyId || Number.isNaN(companyId)) {
      return res.status(400).json({ success: false, name: null });
    }

    const r = await pool.query(
      `SELECT name FROM company WHERE company_id = $1 LIMIT 1`,
      [companyId]
    );

    if (!r.rows.length) {
      return res.json({ success: false, name: null });
    }

    return res.json({ success: true, name: r.rows[0].name });
  } catch (err) {
    console.error("getCompanyName error:", err);
    return res.status(500).json({ success: false, name: null });
  }
};
export const getAllCompanies = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT company_id, name FROM companies ORDER BY name ASC`
    );

    return res.json({ success: true, companies: r.rows });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

