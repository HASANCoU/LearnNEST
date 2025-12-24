import { Router } from "express";
import {
    createLesson,
    deleteLesson,
    listLessonsByBatch,
    updateLesson,
} from "../controllers/lessonController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledOrTeacher } from "../middlewares/enrollmentGuard.js";

const router = Router();

// List lessons (student needs enrollment)
router.get("/batch/:batchId", requireAuth, requireEnrolledOrTeacher, listLessonsByBatch);

// Teacher creates lesson
router.post(
  "/batch/:batchId",
  requireAuth,
  requireRole("teacher", "admin"),
  createLesson
);

// Teacher/admin manage lesson by id
router.patch("/:id", requireAuth, requireRole("teacher", "admin"), updateLesson);
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteLesson);

export default router;
