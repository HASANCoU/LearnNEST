import { Router } from "express";
import {
    createMaterial,
    deleteMaterial,
    listMaterialsByBatch,
    updateMaterial,
} from "../controllers/materialController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledOrTeacher } from "../middlewares/enrollmentGuard.js";

const router = Router();

// List materials (student needs enrollment)
router.get("/batch/:batchId", requireAuth, requireEnrolledOrTeacher, listMaterialsByBatch);

// Teacher creates material
router.post(
  "/batch/:batchId",
  requireAuth,
  requireRole("teacher", "admin"),
  createMaterial
);

// Teacher/admin manage material by id
router.patch("/:id", requireAuth, requireRole("teacher", "admin"), updateMaterial);
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteMaterial);

export default router;
