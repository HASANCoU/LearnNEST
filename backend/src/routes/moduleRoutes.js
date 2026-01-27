import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
    createModule,
    listModulesByBatch,
    updateModule,
    deleteModule
} from "../controllers/moduleController.js";

const router = express.Router();

router.get("/batch/:batchId", requireAuth, listModulesByBatch);
router.post("/batch/:batchId", requireAuth, createModule);
router.patch("/:id", requireAuth, updateModule);
router.delete("/:id", requireAuth, deleteModule);

export default router;
