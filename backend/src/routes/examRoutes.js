import { Router } from "express";
import {
    createExam,
    deleteExam,
    getExam,
    listExamsByBatch,
    updateExam,
    submitPdfExam,
    getExamSubmissions,
    gradeSubmission,
    getMySubmission,
    viewQuestionPaper,
    viewSubmissionFile,
} from "../controllers/examController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledOrTeacher } from "../middlewares/enrollmentGuard.js";
import { uploadExamPdf, uploadSubmission, setUploadType } from "../middlewares/upload.js";

const router = Router();

// list exams for batch (enrolled/teacher/admin)
router.get("/batch/:batchId", requireAuth, requireEnrolledOrTeacher, listExamsByBatch);

// create exam (teacher/admin) - supports PDF upload
router.post(
    "/batch/:batchId",
    requireAuth,
    requireRole("teacher", "admin"),
    setUploadType("exams"),
    uploadExamPdf.single("questionPdf"),
    createExam
);

// get single exam (enrolled/teacher/admin will be checked later by frontend path; keep requireAuth)
router.get("/:id", requireAuth, getExam);
router.get("/:id/question", requireAuth, viewQuestionPaper);

// update/delete (teacher/admin)
router.patch(
    "/:id",
    requireAuth,
    requireRole("teacher", "admin"),
    setUploadType("exams"),
    uploadExamPdf.single("questionPdf"),
    updateExam
);
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteExam);

// PDF Exam Submissions
router.post(
    "/:examId/submit",
    requireAuth,
    requireRole("student"),
    setUploadType("submissions"),
    uploadSubmission.single("submissionPdf"),
    submitPdfExam
);

// Get submissions for an exam (teacher/admin)
router.get("/:examId/submissions", requireAuth, requireRole("teacher", "admin"), getExamSubmissions);

// Grade a submission (teacher/admin)
router.patch("/submissions/:submissionId/grade", requireAuth, requireRole("teacher", "admin"), gradeSubmission);

// Get my submission for an exam (student)
router.get("/:examId/my-submission", requireAuth, getMySubmission);
router.get("/submission/:id/file", requireAuth, viewSubmissionFile);

export default router;
