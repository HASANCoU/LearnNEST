import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
    createMilestone,
    listMilestonesByBatch,
    updateMilestone,
    deleteMilestone
} from "../controllers/milestoneController.js";

const router = express.Router();

router.get("/batch/:batchId", requireAuth, listMilestonesByBatch);
router.post("/batch/:batchId", requireAuth, createMilestone);
router.patch("/:id", requireAuth, updateMilestone);
router.delete("/:id", requireAuth, deleteMilestone);

export default router;
