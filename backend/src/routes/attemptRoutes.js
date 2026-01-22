import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  startExam,
  submitExam,
  myExamResults,
  resultsByExam,
} from "../controllers/attemptController.js";

const router = Router();

// student
router.post("/exam/:examId/start", requireAuth, requireRole("student"), startExam);
router.post("/exam/:examId/submit", requireAuth, requireRole("student"), submitExam);
router.get("/me", requireAuth, requireRole("student"), myExamResults);

// teacher/admin leaderboard/results
router.get("/", requireAuth, requireRole("teacher", "admin"), resultsByExam);

export default router;
