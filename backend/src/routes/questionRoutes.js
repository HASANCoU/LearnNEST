import { Router } from "express";
import { addQuestion, deleteQuestion, listQuestions } from "../controllers/questionController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// list questions: student sees safe version
router.get("/exam/:examId", requireAuth, listQuestions);

// teacher/admin add
router.post("/exam/:examId", requireAuth, requireRole("teacher", "admin"), addQuestion);

// teacher/admin delete
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), deleteQuestion);

export default router;
