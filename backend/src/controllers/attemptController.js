import Exam from "../models/Exam.js";
import Question from "../models/Question.js";
import ExamAttempt from "../models/ExamAttempt.js";
import Enrollment from "../models/Enrollment.js";

function isWithinWindow(exam) {
  const now = new Date();
  if (exam.startAt && now < new Date(exam.startAt)) return false;
  if (exam.endAt && now > new Date(exam.endAt)) return false;
  return true;
}

export async function startExam(req, res) {
  const { examId } = req.params;

  const exam = await Exam.findById(examId);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  if (!exam.isPublished) return res.status(403).json({ message: "Exam not published" });
  if (!isWithinWindow(exam)) return res.status(400).json({ message: "Exam not active now" });

  const ok = await Enrollment.exists({ batch: exam.batch, student: req.user.id, status: "approved" });
  if (!ok) return res.status(403).json({ message: "Forbidden: not enrolled in this batch" });

  try {
    const attempt = await ExamAttempt.create({
      exam: examId,
      batch: exam.batch,
      student: req.user.id,
      status: "started",
      startedAt: new Date(),
    });

    res.status(201).json({ message: "Exam started", attemptId: attempt._id });
  } catch (err) {
    if (err.code === 11000) {
      const existing = await ExamAttempt.findOne({ exam: examId, student: req.user.id });
      return res.status(409).json({
        message: "You already started/submitted this exam",
        attemptId: existing?._id,
        status: existing?.status,
      });
    }
    throw err;
  }
}

export async function submitExam(req, res) {
  const { examId } = req.params;
  const body = req.body || {};
  const { answers } = body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: "answers array is required" });
  }

  const exam = await Exam.findById(examId);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  if (!exam.isPublished) return res.status(403).json({ message: "Exam not published" });

  const ok = await Enrollment.exists({ batch: exam.batch, student: req.user.id, status: "approved" });
  if (!ok) return res.status(403).json({ message: "Forbidden: not enrolled in this batch" });

  const attempt = await ExamAttempt.findOne({ exam: examId, student: req.user.id });
  if (!attempt) return res.status(400).json({ message: "You must start the exam first" });
  if (attempt.status === "submitted") return res.status(409).json({ message: "Already submitted" });

  // time limit check
  const deadline = new Date(attempt.startedAt);
  deadline.setMinutes(deadline.getMinutes() + (exam.durationMinutes || 30));
  if (new Date() > deadline) {
    // still allow submit but mark late? For simplicity: block.
    return res.status(400).json({ message: "Time is over. Cannot submit now." });
  }

  // load questions
  const questions = await Question.find({ exam: examId }).select("correctIndex marks negativeMarks");
  const qMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;

  // normalize answers (remove duplicates by keeping last)
  const seen = new Map();
  for (const a of answers) {
    if (!a?.questionId) continue;
    seen.set(String(a.questionId), Number(a.selectedIndex));
  }

  const normalized = [];
  for (const [qid, selectedIndex] of seen.entries()) {
    const q = qMap.get(qid);
    if (!q) continue;
    if (Number.isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex > 5) continue;

    normalized.push({ questionId: qid, selectedIndex });

    if (selectedIndex === q.correctIndex) {
      score += q.marks || 0;
      correctCount += 1;
    } else {
      score -= q.negativeMarks || 0;
      wrongCount += 1;
    }
  }

  if (score < 0) score = 0;

  attempt.answers = normalized;
  attempt.score = score;
  attempt.correctCount = correctCount;
  attempt.wrongCount = wrongCount;
  attempt.status = "submitted";
  attempt.submittedAt = new Date();

  await attempt.save();

  res.json({
    message: "Submitted",
    result: {
      score,
      totalMarks: exam.totalMarks,
      correctCount,
      wrongCount,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    },
  });
}

export async function myExamResults(req, res) {
  const { batchId } = req.query;

  const filter = { student: req.user.id };
  if (batchId) filter.batch = batchId;

  const results = await ExamAttempt.find(filter)
    .populate("exam", "title totalMarks durationMinutes")
    .sort({ createdAt: -1 })
    .select("exam score correctCount wrongCount startedAt submittedAt status");

  res.json({ results });
}

export async function resultsByExam(req, res) {
  const { examId } = req.query;
  if (!examId) return res.status(400).json({ message: "examId query is required" });

  // teacher/admin access: validated in route by requireRole("teacher","admin")
  // We still ensure exam exists:
  const exam = await Exam.findById(examId).select("batch");
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const results = await ExamAttempt.find({ exam: examId, status: "submitted" })
    .populate("student", "name email")
    .sort({ score: -1, submittedAt: 1 })
    .select("student score correctCount wrongCount startedAt submittedAt");

  res.json({ results });
}
