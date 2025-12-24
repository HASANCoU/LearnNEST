import { Router } from "express";
import { attendanceByDate, markAttendance, myAttendance } from "../controllers/attendanceController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Teacher/Admin marks attendance for a batch
router.post("/batch/:batchId/mark", requireAuth, requireRole("teacher", "admin"), markAttendance);

// Student view own attendance
router.get("/me", requireAuth, requireRole("student"), myAttendance);

// Teacher/Admin view attendance for a date
router.get("/batch/:batchId", requireAuth, requireRole("teacher", "admin"), attendanceByDate);

export default router;
