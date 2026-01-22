import { Router } from "express";
import {
    listEnrollmentsByBatch,
    myEnrollments,
    requestEnrollment,
    updateEnrollmentStatus,
} from "../controllers/enrollmentController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Student
router.post("/", requireAuth, requireRole("student", "admin", "teacher"), requestEnrollment);
router.get("/me", requireAuth, myEnrollments);

// Teacher/Admin
router.get("/", requireAuth, requireRole("teacher", "admin"), listEnrollmentsByBatch);
router.patch("/:id/status", requireAuth, requireRole("teacher", "admin"), updateEnrollmentStatus);

export default router;
