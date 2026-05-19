// backend/src/controllers/certificatesController.ts
import { Request, Response } from "express";
import { pool } from "../services/db";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../middleware/authMiddleware";
import { certBucket, buildPublicUrl } from "../services/supabase";
import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";

const TEMPLATE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "resources",
  "newCertificate.html"
);

// Convert local absolute path to file:// URL (works on Windows + *nix)
function toFileUrl(absPath: string) {
  // Normalize and use forward slashes
  let normalized = path.resolve(absPath).replace(/\\/g, "/");
  // Ensure leading slash for Windows drive letters (file:///C:/...)
// Ensure leading slash for Windows drive letters (file:///C:/...)
  if (!normalized.startsWith("/")) normalized = "/" + normalized;
  return `file://${normalized}`;
}

export const generateCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({ success: false, message: "Auth required" });

    const courseId = Number(req.params.courseId);
    if (isNaN(courseId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid course" });

    const client = await pool.connect();

    try {
      // Fetch course + admin creator
      const courseQuery = await client.query(
        `
        SELECT 
          c.*, 
          u.first_name AS admin_first,
          u.last_name AS admin_last
        FROM courses c
        LEFT JOIN users u ON u.user_id = c.created_by
        WHERE c.course_id = $1
        `,
        [courseId]
      );

      if (!courseQuery.rows.length) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      const course = courseQuery.rows[0];
      const adminName =
        course.admin_first && course.admin_last
          ? `${course.admin_first} ${course.admin_last}`
          : "BizTrack Training Manager";

      const quizzes = await client.query(
        `SELECT quiz_id, attempts_allowed FROM quizzes WHERE course_id = $1`,
        [courseId]
      );

      if (!quizzes.rows.length) {
        return res.json({
          success: false,
          message: "No quizzes exist in this course.",
        });
      }

      // Check if user has passed all quizzes
      const passed = await client.query(
        `SELECT COUNT(*)::int as passed_count
         FROM quiz_attempts qa
         JOIN quizzes q ON qa.quiz_id = q.quiz_id
         WHERE qa.user_id = $1 AND qa.passed = true AND q.course_id = $2`,
        [user.user_id, courseId]
      );

      const passedCount = Number(passed.rows[0].passed_count || 0);
      const totalQuizzes = quizzes.rows.length;

      // NEW: check for any locked quizzes (exhausted attempts without passing)
      for (const q of quizzes.rows) {
        const attemptsAllowed = q.attempts_allowed && q.attempts_allowed > 0 ? Number(q.attempts_allowed) : 3;
        const attemptsRes = await client.query(
          `SELECT COUNT(*)::int AS cnt,
                  COUNT(*) FILTER (WHERE passed = true) AS passed_cnt
           FROM quiz_attempts
           WHERE quiz_id = $1 AND user_id = $2`,
          [q.quiz_id, user.user_id]
        );
        const cnt = Number(attemptsRes.rows[0]?.cnt ?? 0);
        const passed_cnt = Number(attemptsRes.rows[0]?.passed_cnt ?? 0);
        const locked = passed_cnt === 0 && cnt >= attemptsAllowed;
        if (locked) {
          return res.json({
            success: false,
            message:
              "Certificate unavailable: one or more quizzes are locked due to exhausted attempts. Contact an admin to reset attempts.",
          });
        }
      }

      if (passedCount !== totalQuizzes) {
        return res.json({
          success: false,
          message: `You passed ${passedCount}/${totalQuizzes} quizzes — complete them all to unlock your certificate.`,
        });
      }

      const existingCert = await client.query(
        `SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2`,
        [user.user_id, courseId]
      );

      if (existingCert.rows.length) {
        return res.json({
          success: true,
          certificate: existingCert.rows[0],
        });
      }

      const certificateNum = `BT-${new Date().getFullYear()}-${uuidv4().slice(
        0,
        8
      )}`;

      let tpl = await fs.readFile(TEMPLATE_PATH, "utf8");

      const scoreValue = 100;

      const logoPath = path.join(
        __dirname,
        "..",
        "..",
        "resources",
        "branding",
        "Biztrack - Logo resized ( Full - BT ) - Copy.png"
      );
      const logoFileUrl = toFileUrl(logoPath);

      const html = tpl
        .replace(/{{USER_NAME}}/g, `${user.first_name} ${user.last_name}`)
        .replace(/{{COURSE_TITLE}}/g, course.title)
        .replace(/{{DATE}}/g, new Date().toLocaleDateString())
        .replace(/{{SCORE}}/g, String(scoreValue))
        .replace(/{{CERT_ID}}/g, certificateNum)
        .replace(/{{LOGO_PATH}}/g, logoFileUrl)
        .replace(/{{ADMIN_NAME}}/g, adminName);

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.emulateMediaType("screen");
      await page.setViewport({ width: 1200, height: 850 });
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
        pageRanges: "1",
      });

      await browser.close();

      const filename = `${certificateNum}.pdf`;

      const { error: uploadErr } = await certBucket.upload(
        filename,
        pdfBuffer,
        {
          contentType: "application/pdf",
          upsert: true,
        }
      );

      if (uploadErr) {
        console.error("generateCertificate: upload failed:", uploadErr);
        return res
          .status(500)
          .json({ success: false, message: "Could not upload certificate" });
      }

      const publicUrl = buildPublicUrl(
        process.env.SUPABASE_CERT_BUCKET || "certificates",
        filename
      );

      const inserted = await client.query(
        `INSERT INTO certificates (user_id, course_id, certificate_number, pdf_url, score)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user.user_id, courseId, certificateNum, publicUrl, scoreValue]
      );

      return res.json({
        success: true,
        certificate: inserted.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ generateCertificate error:", err);
    return res.status(500).json({
      success: false,
      message: "Could not create certificate",
    });
  }
};

/**
 * GET /api/certificates/download/:filename
 * (Not used for direct download - Supabase public URLs are returned instead.)
 */
export const downloadCertificate = async (_req: Request, res: Response) => {
  return res.json({
    success: false,
    message: "Direct download now handled by Supabase public URLs.",
  });
};
