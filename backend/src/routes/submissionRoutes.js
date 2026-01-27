import { Router } from "express";
import {
    createSubmission,
    gradeSubmission,
    listSubmissionsByAssignment,
    mySubmissions,
    getSubmissionFile,
} from "../controllers/submissionController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledForAssignment } from "../middlewares/requireEnrolledForAssignment.js";
import { uploadMaterial, setUploadType } from "../middlewares/upload.js";
const router = Router();

// student creates submission (must be enrolled in assignment batch)
// We pass batchId in body indirectly via assignmentId; enrollment guard needs batchId,
// so we do enrollment check inside later (Phase upgrade). For now: only allow students,
// and rely on assignment batch being in their enrollments in later check.
// We'll add a strict guard function below.

router.post("/",
    requireAuth,
    requireRole("student"),
    setUploadType("submissions"),
    uploadMaterial.single("file"),
    requireEnrolledForAssignment,
    createSubmission
);

router.get("/me", requireAuth, requireRole("student"), mySubmissions);

// teacher/admin views submissions for assignment
router.get("/", requireAuth, requireRole("teacher", "admin"), listSubmissionsByAssignment);

// grade
router.patch("/:id/grade", requireAuth, requireRole("teacher", "admin"), gradeSubmission);

// view file
router.get("/:id/file", requireAuth, getSubmissionFile);

export default router;
