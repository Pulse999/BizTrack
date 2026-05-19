// backend/src/controllers/authController.ts
import { Request, Response } from "express";
import axios from "axios";
import { pool } from "../services/db";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { BiztrackUser } from "../types";

dotenv.config();

const BIZTRACK_URL = process.env.BIZTRACK_API_URL!;
const BIZTRACK_KEY = process.env.BIZTRACK_API_KEY!;
const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    // --------------------------------------------------------
    // 1. AUTHENTICATE AGAINST BIZTRACK API
    // --------------------------------------------------------
    const response = await axios.post(
      BIZTRACK_URL,
      new URLSearchParams({
        Email: email,
        Password: password,
        DeviceType: "1",
        DeviceID: "",
        Key: BIZTRACK_KEY + "#WebAPI",
        FirebaseToken: "",
        BuildVersion: "2.0",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    const data = response.data;
    if (!data || data.code !== 200 || !data.tblUser)
      return res.status(401).json({ error: data?.message || "Invalid credentials" });

    const userFromBiz: BiztrackUser = data.tblUser;
    const company = data.tblCompany || null;

    // --------------------------------------------------------
    // 2. UPSERT USER INTO POSTGRES
    // --------------------------------------------------------
    const client = await pool.connect();
    try {
      await client.query(
        `
        INSERT INTO users (biztrack_user_id, company_id, email, first_name, last_name, last_login)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (biztrack_user_id) 
        DO UPDATE SET
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          company_id = EXCLUDED.company_id,
          last_login = NOW();
        `,
        [
          userFromBiz.UserID,
          company ? company.CompanyID : null,
          userFromBiz.Email,
          userFromBiz.Firstname,
          userFromBiz.Lastname,
        ]
      );

      // --------------------------------------------------------
      // 3. FETCH USER RECORD FROM POSTGRES (INCLUDES PROFILE IMAGE)
      // --------------------------------------------------------
      const result = await client.query(
        `SELECT 
            user_id, 
            biztrack_user_id, 
            company_id, 
            email, 
            first_name, 
            last_name, 
            is_admin, 
            is_super_admin, 
            profile_image_url
         FROM users
         WHERE biztrack_user_id = $1
         LIMIT 1`,
        [userFromBiz.UserID]
      );

      const dbUser = result.rows[0];
      if (!dbUser) {
        return res
          .status(404)
          .json({ error: "User not found after login synchronization" });
      }

      // --------------------------------------------------------
      // 4. BUILD JWT PAYLOAD WITH LATEST profile_image_url
      // --------------------------------------------------------
      const tokenPayload = {
        user_id: dbUser.user_id,
        biztrack_user_id: dbUser.biztrack_user_id,
        company_id: dbUser.company_id,
        email: dbUser.email,
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        is_admin: !!dbUser.is_admin,
        is_super_admin: !!dbUser.is_super_admin,
        profile_image_url: dbUser.profile_image_url || null,
      };

      // --------------------------------------------------------
      // 5. SIGN JWT AND RETURN USER + TOKEN
      // --------------------------------------------------------
      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "8h",
      });

      return res.json({ success: true, token, user: tokenPayload });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Auth login error:", error?.response?.data || error.message || error);
    return res.status(500).json({ error: "Login failed" });
  }
};

// ------------------------------------------------------------
// REGISTRATION DISABLED — BIZTRACK ONLY
// ------------------------------------------------------------
export const register = async (_req: Request, res: Response) =>
  res.status(400).json({
    error: "Registration not needed - use BizTrack credentials.",
  });
