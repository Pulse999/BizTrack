// backend/src/routes/courseRoutes.ts
import express from "express";
import multer from "multer";
import { authRequired, adminRequired } from "../middleware/authMiddleware";
import {
  listCourses,
  getCourse,
  createCourse,
  deleteCourse,
  updateCourse,
  uploadCourseImage,
  addBookmark,
  removeBookmark,
  listBookmarkedCourses,
  rateCourse,
  toggleCourseActive,  // ✅ ADD THIS
} from "../controllers/courseController";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ---------------------------------------------------------
// STATIC ROUTES FIRST
// ---------------------------------------------------------

router.get("/", authRequired, listCourses);

router.get("/bookmarks", authRequired, listBookmarkedCourses);

router.post(
  "/upload",
  authRequired,
  adminRequired,
  upload.single("file"),
  uploadCourseImage
);

router.post("/:id/rate", authRequired, rateCourse);

router.post("/:id/bookmark", authRequired, addBookmark);
router.delete("/:id/bookmark", authRequired, removeBookmark);

// ---------------------------------------------------------
// DYNAMIC ROUTES
// ---------------------------------------------------------

router.get("/:id", authRequired, getCourse);

router.post("/", authRequired, adminRequired, createCourse);
router.patch("/:id/toggle", authRequired, adminRequired, toggleCourseActive);  // <-- ADD THIS
router.patch("/:id", authRequired, adminRequired, updateCourse);
router.delete("/:id", authRequired, adminRequired, deleteCourse);

export default router;
