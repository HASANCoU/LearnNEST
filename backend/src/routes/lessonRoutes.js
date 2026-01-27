import { Router } from "express";
import {
  createLesson,
  deleteLesson,
  listLessonsByBatch,
  updateLesson,
  viewLessonFile,
  downloadLessonFile,
} from "../controllers/lessonController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledOrTeacher } from "../middlewares/enrollmentGuard.js";
import { uploadLesson, setUploadType } from "../middlewares/upload.js";

const router = Router();

// List lessons (student needs enrollment)
router.get("/batch/:batchId", requireAuth, requireEnrolledOrTeacher, listLessonsByBatch);

// View lesson file inline
router.get("/:id/view", requireAuth, viewLessonFile);

// Download lesson file
router.get("/:id/download", requireAuth, downloadLessonFile);

// Teacher creates lesson with optional video upload
router.post(
  "/batch/:batchId",
  requireAuth,
  requireRole("teacher", "admin"),
  setUploadType("lessons"),
  uploadLesson.single("file"),
  createLesson
);

// Teacher/admin manage lesson by id
router.patch(
  "/:id",
  requireAuth,
  requireRole("teacher", "admin"),
  setUploadType("lessons"),
  uploadLesson.single("file"),
  updateLesson
);

router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteLesson);

export default router;
