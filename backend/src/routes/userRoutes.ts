// backend/src/routes/userRoutes.ts
import { Router } from "express";
import { authRequired } from "../middleware/authMiddleware";
import { updateProfileImage } from "../controllers/userController";

const router = Router();

/**
 * PATCH /api/users/profile-image
 *
 * Updates the user's profile image.
 * Frontend uploads the new file to Supabase,
 * then sends the public URL to this endpoint.
 *
 * The controller:
 *  - Deletes old Supabase file (if exists)
 *  - Updates `users.profile_image_url`
 *  - Returns updated user object
 */
router.patch("/profile-image", authRequired, updateProfileImage);

export default router;
