import { Router } from "express";
import {
  createCourse,
  listPublicCourses,
  getPublicCourseBySlug,
  listMyCourses,
  getCourseById,
  updateCourse,
  adminSetCourseStatus,
  adminPublishCourse,
  deleteCourse,
} from "../controllers/courseController.js";

import { requireAuth, requireRole } from "../middlewares/auth.js";
import { uploadThumbnail, setUploadType } from "../middlewares/upload.js";

const router = Router();

/** Public */
router.get("/", listPublicCourses); // /api/courses?q=
router.get("/slug/:slug", getPublicCourseBySlug);

/** Teacher */
router.post(
  "/",
  requireAuth,
  requireRole("teacher", "admin"),
  setUploadType("thumbnails"),
  uploadThumbnail.single("thumbnail"),
  createCourse
);
router.get("/me", requireAuth, requireRole("teacher", "admin"), listMyCourses);
router.get("/:id", requireAuth, requireRole("teacher", "admin"), getCourseById);
router.patch(
  "/:id",
  requireAuth,
  requireRole("teacher", "admin"),
  setUploadType("thumbnails"),
  uploadThumbnail.single("thumbnail"),
  updateCourse
);
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteCourse);

/** Admin */
router.patch("/:id/status", requireAuth, requireRole("admin"), adminSetCourseStatus);
router.patch("/:id/publish", requireAuth, requireRole("admin"), adminPublishCourse);

export default router;
