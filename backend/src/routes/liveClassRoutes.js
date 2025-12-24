import { Router } from "express";
import {
    createLiveClass,
    deleteLiveClass,
    listLiveClassesByBatch,
    updateLiveClass,
} from "../controllers/liveClassController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledOrTeacher } from "../middlewares/enrollmentGuard.js";

const router = Router();

// Enrolled/Teacher/Admin list
router.get("/batch/:batchId", requireAuth, requireEnrolledOrTeacher, listLiveClassesByBatch);

// Teacher/Admin create
router.post("/batch/:batchId", requireAuth, requireRole("teacher", "admin"), createLiveClass);

// Teacher/Admin manage
router.patch("/:id", requireAuth, requireRole("teacher", "admin"), updateLiveClass);
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteLiveClass);

export default router;
