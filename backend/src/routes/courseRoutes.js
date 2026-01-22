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
} from "../controllers/courseController.js";

import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

/** Public */
router.get("/", listPublicCourses); // /api/courses?q=
router.get("/slug/:slug", getPublicCourseBySlug);

/** Teacher */
router.post("/", requireAuth, requireRole("teacher", "admin"), createCourse);
router.get("/me", requireAuth, requireRole("teacher", "admin"), listMyCourses);
router.get("/:id", requireAuth, requireRole("teacher", "admin"), getCourseById);
router.patch("/:id", requireAuth, requireRole("teacher", "admin"), updateCourse);

/** Admin */
router.patch("/:id/status", requireAuth, requireRole("admin"), adminSetCourseStatus);
router.patch("/:id/publish", requireAuth, requireRole("admin"), adminPublishCourse);

export default router;
