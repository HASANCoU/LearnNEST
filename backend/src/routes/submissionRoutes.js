import { Router } from "express";
import {
    createSubmission,
    gradeSubmission,
    listSubmissionsByAssignment,
    mySubmissions,
} from "../controllers/submissionController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledForAssignment } from "../middlewares/requireEnrolledForAssignment.js";
const router = Router();

// student creates submission (must be enrolled in assignment batch)
// We pass batchId in body indirectly via assignmentId; enrollment guard needs batchId,
// so we do enrollment check inside later (Phase upgrade). For now: only allow students,
// and rely on assignment batch being in their enrollments in later check.
// We'll add a strict guard function below.

router.post("/", requireAuth, requireRole("student"), createSubmission);
router.get("/me", requireAuth, requireRole("student"), mySubmissions);

// teacher/admin views submissions for assignment
router.get("/", requireAuth, requireRole("teacher", "admin"), listSubmissionsByAssignment);

// grade
router.patch("/:id/grade", requireAuth, requireRole("teacher", "admin"), gradeSubmission);

router.post("/", requireAuth, requireRole("student"), requireEnrolledForAssignment, createSubmission);
export default router;
