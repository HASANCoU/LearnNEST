import { Router } from "express";
import {
  createMaterial,
  deleteMaterial,
  listMaterialsByBatch,
  updateMaterial,
  viewMaterial,
  downloadMaterial,
} from "../controllers/materialController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireEnrolledOrTeacher } from "../middlewares/enrollmentGuard.js";
import { uploadMaterial, setUploadType } from "../middlewares/upload.js";

const router = Router();

// List materials (student needs enrollment)
router.get("/batch/:batchId", requireAuth, requireEnrolledOrTeacher, listMaterialsByBatch);

// Teacher creates material with optional file upload
router.post(
  "/batch/:batchId",
  requireAuth,
  requireRole("teacher", "admin"),
  setUploadType("materials"),
  uploadMaterial.single("file"),
  createMaterial
);

// View material inline (for PDF viewer, video player)
router.get("/:id/view", requireAuth, viewMaterial);

// Download material file
router.get("/:id/download", requireAuth, downloadMaterial);

// Teacher/admin manage material by id
router.patch(
  "/:id",
  requireAuth,
  requireRole("teacher", "admin"),
  setUploadType("materials"),
  uploadMaterial.single("file"),
  updateMaterial
);
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteMaterial);

export default router;
