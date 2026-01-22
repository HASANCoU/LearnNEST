import express from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledOrTeacher } from "../middlewares/enrollmentGuard.js";
import { getMyCompletion, listBatchCompletions, markCompletion } from "../controllers/completionController.js";

const router = express.Router();

// student view
router.get("/me", requireAuth, requireRole("student"), getMyCompletion);

// teacher/admin view for a batch
router.get(
  "/batch/:batchId",
  requireAuth,
  requireEnrolledOrTeacher,
  requireRole("teacher", "admin"),
  listBatchCompletions
);

router.post(
  "/batch/:batchId/mark",
  requireAuth,
  requireEnrolledOrTeacher,
  requireRole("teacher", "admin"),
  markCompletion
);

export default router;
