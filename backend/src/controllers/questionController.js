import Batch from "../models/Batch.js";
import Exam from "../models/Exam.js";
import Question from "../models/Question.js";

async function teacherOwnsExam(req, examId) {
  const exam = await Exam.findById(examId);
  if (!exam) return { ok: false, status: 404, message: "Exam not found" };

  const batch = await Batch.findById(exam.batch).select("teacher");
  if (!batch) return { ok: false, status: 404, message: "Batch not found" };

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return { ok: false, status: 403, message: "Forbidden: not your batch" };
  }

  return { ok: true, exam };
}

export async function addQuestion(req, res) {
  const { examId } = req.params;
  const body = req.body || {};
  const { text, options, correctIndex, marks, negativeMarks, order } = body;

  if (!text || !Array.isArray(options)) {
    return res.status(400).json({ message: "text and options are required" });
  }

  const check = await teacherOwnsExam(req, examId);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  if (correctIndex === undefined || correctIndex < 0 || correctIndex >= options.length) {
    return res.status(400).json({ message: "correctIndex is invalid for options length" });
  }

  const q = await Question.create({
    exam: examId,
    text,
    options,
    correctIndex: Number(correctIndex),
    marks: marks !== undefined ? Number(marks) : 1,
    negativeMarks: negativeMarks !== undefined ? Number(negativeMarks) : 0,
    order: order !== undefined ? Number(order) : 1,
  });

  // update exam totalMarks
  const sum = await Question.aggregate([
    { $match: { exam: q.exam } },
    { $group: { _id: "$exam", total: { $sum: "$marks" } } },
  ]);
  const total = sum?.[0]?.total || 0;
  await Exam.findByIdAndUpdate(examId, { totalMarks: total });

  res.status(201).json({ message: "Question added", question: q });
}

export async function listQuestions(req, res) {
  const { examId } = req.params;

  const exam = await Exam.findById(examId);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  // Students: do NOT send correctIndex
  const questions = await Question.find({ exam: examId }).sort({ order: 1, createdAt: 1 });

  if (req.user.role === "student") {
    const safe = questions.map((q) => ({
      _id: q._id,
      exam: q.exam,
      text: q.text,
      options: q.options,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      order: q.order,
    }));
    return res.json({ questions: safe });
  }

  // teacher/admin sees full
  res.json({ questions });
}

export async function deleteQuestion(req, res) {
  const { id } = req.params; // question id

  const q = await Question.findById(id);
  if (!q) return res.status(404).json({ message: "Question not found" });

  const check = await teacherOwnsExam(req, q.exam);
  if (!check.ok) return res.status(check.status).json({ message: check.message });

  await Question.deleteOne({ _id: id });

  // update exam totalMarks
  const sum = await Question.aggregate([
    { $match: { exam: q.exam } },
    { $group: { _id: "$exam", total: { $sum: "$marks" } } },
  ]);
  const total = sum?.[0]?.total || 0;
  await Exam.findByIdAndUpdate(q.exam, { totalMarks: total });

  res.json({ message: "Question deleted" });
}
