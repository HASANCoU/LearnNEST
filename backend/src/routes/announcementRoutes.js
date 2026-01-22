import express from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledOrTeacher } from "../middlewares/enrollmentGuard.js";
import {
  listAnnouncementsForBatch,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";

const router = express.Router();

// list for batch: enrolled students, teacher of batch, or admin
router.get("/batch/:batchId", requireAuth, requireEnrolledOrTeacher, listAnnouncementsForBatch);

// create: teacher of batch or admin (enrollmentGuard allows teacher/admin)
router.post(
  "/batch/:batchId",
  requireAuth,
  requireEnrolledOrTeacher,
  requireRole("teacher", "admin"),
  createAnnouncement
);

router.patch("/:id", requireAuth, requireRole("teacher", "admin"), updateAnnouncement);
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteAnnouncement);

export default router;
