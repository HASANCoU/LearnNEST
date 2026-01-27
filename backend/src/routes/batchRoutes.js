import { Router } from "express";
import { createBatch, listBatchesByCourse, listMyBatches, updateBatch, deleteBatch } from "../controllers/batchController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Public-ish (used by course details page)
router.get("/", listBatchesByCourse); // /api/batches?courseId=

// Teacher/Admin
router.get("/me", requireAuth, requireRole("teacher", "admin"), listMyBatches);

// Admin only
router.post("/", requireAuth, requireRole("admin"), createBatch);
router.patch("/:id", requireAuth, requireRole("admin"), updateBatch);
router.delete("/:id", requireAuth, requireRole("admin"), deleteBatch);

export default router;
