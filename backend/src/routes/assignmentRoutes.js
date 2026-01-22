import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledOrTeacher } from "../middlewares/enrollmentGuard.js";
import {
  createAssignment,
  listAssignmentsByBatch,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignmentController.js";

const router = Router();

// list assignments (student must be enrolled/teacher/admin)
router.get("/batch/:batchId", requireAuth, requireEnrolledOrTeacher, listAssignmentsByBatch);

// create assignment (teacher/admin)
router.post("/batch/:batchId", requireAuth, requireRole("teacher", "admin"), createAssignment);

// update/delete (teacher/admin)
router.patch("/:id", requireAuth, requireRole("teacher", "admin"), updateAssignment);
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteAssignment);

export default router;
