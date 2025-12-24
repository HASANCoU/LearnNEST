import { Router } from "express";
import {
    createExam,
    deleteExam,
    getExam,
    listExamsByBatch,
    updateExam,
} from "../controllers/examController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledOrTeacher } from "../middlewares/enrollmentGuard.js";

const router = Router();

// list exams for batch (enrolled/teacher/admin)
router.get("/batch/:batchId", requireAuth, requireEnrolledOrTeacher, listExamsByBatch);

// create exam (teacher/admin)
router.post("/batch/:batchId", requireAuth, requireRole("teacher", "admin"), createExam);

// get single exam (enrolled/teacher/admin will be checked later by frontend path; keep requireAuth)
router.get("/:id", requireAuth, getExam);

// update/delete (teacher/admin)
router.patch("/:id", requireAuth, requireRole("teacher", "admin"), updateExam);
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteExam);

export default router;
