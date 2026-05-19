// backend/src/controllers/userController.ts
import { Response } from "express";
import { pool } from "../services/db";
import { supabase } from "../services/supabase";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * PATCH /api/users/profile-image
 *
 * Expected body: { image_url: string }
 *
 * Behavior:
 * - If the user has an existing profile_image_url stored in the DB and it's different
 *   from the incoming image_url, attempt to delete the old file from the Supabase
 *   "profile-pictures" bucket (if we can extract a path).
 * - Update the users.profile_image_url column to the new image_url.
 * - Return the updated user object.
 *
 * Notes:
 * - Frontend currently uploads to Supabase directly and sends the public URL to this endpoint.
 *   We therefore only attempt to delete the previous file here (to avoid orphaned files).
 * - We do not perform any extra validation on image_url beyond presence.
 */
export const updateProfileImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { image_url } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Missing authenticated user" });
    }

    if (!image_url || typeof image_url !== "string") {
      return res.status(400).json({ success: false, error: "Missing image_url" });
    }

    // Fetch current profile image (if any)
    const currentRes = await pool.query(
      `SELECT profile_image_url FROM users WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    const currentUrl: string | null = currentRes.rows?.[0]?.profile_image_url ?? null;

    // If there's an existing URL and it's different from the new one, attempt delete
    if (currentUrl && currentUrl !== image_url) {
      try {
        // Attempt to extract the path relative to the bucket.
        // Typical Supabase public URL format:
        // https://<project>.supabase.co/storage/v1/object/public/<bucket-name>/<filePath>
        // We'll try to capture everything after "<bucket-name>/".
        const match = currentUrl.match(/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
        if (match && match[1] && match[2]) {
          const bucket = match[1]; // e.g., "profile-pictures"
          const filePath = match[2]; // the path inside the bucket

          // Attempt deletion
          const { error } = await supabase.storage.from(bucket).remove([filePath]);
          if (error) {
            // Log but don't fail the whole request — deletion is best-effort.
            console.error("Failed to remove old profile image from Supabase:", error);
          } else {
            console.log(`Removed old profile image from bucket "${bucket}": ${filePath}`);
          }
        } else {
          // Fallback: try to match just after bucket name 'profile-pictures/'
          const altMatch = currentUrl.match(/profile-pictures\/(.+)$/);
          if (altMatch && altMatch[1]) {
            const filePath = altMatch[1];
            const { error } = await supabase.storage.from("profile-pictures").remove([filePath]);
            if (error) {
              console.error("Failed to remove old profile image (alt) from Supabase:", error);
            } else {
              console.log(`Removed old profile image from "profile-pictures": ${filePath}`);
            }
          } else {
            console.warn("Could not determine bucket/path for existing profile image; skipping delete.");
          }
        }
      } catch (err) {
        // Deletion error should not block updating DB
        console.error("Error while attempting to delete previous profile image:", err);
      }
    }

    // Update DB with the new public URL
    const updateRes = await pool.query(
      `UPDATE users
       SET profile_image_url = $1
       WHERE user_id = $2
       RETURNING user_id, biztrack_user_id, company_id, email, first_name, last_name, is_admin, is_super_admin, profile_image_url`,
      [image_url, userId]
    );

    return res.json({ success: true, user: updateRes.rows[0] });
  } catch (err) {
    console.error("Error updating profile picture:", err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
};
