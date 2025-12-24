import Batch from "../models/Batch.js";
import Exam from "../models/Exam.js";
import Question from "../models/Question.js";

function isWithinWindow(exam) {
  const now = new Date();
  if (exam.startAt && now < new Date(exam.startAt)) return false;
  if (exam.endAt && now > new Date(exam.endAt)) return false;
  return true;
}

export async function createExam(req, res) {
  const { batchId } = req.params;
  const body = req.body || {};
  const { title, description, durationMinutes, startAt, endAt, isPublished } = body;

  if (!title) return res.status(400).json({ message: "title is required" });

  const batch = await Batch.findById(batchId).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const exam = await Exam.create({
    batch: batchId,
    title,
    description: description || "",
    durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : 30,
    startAt: startAt ? new Date(startAt) : undefined,
    endAt: endAt ? new Date(endAt) : undefined,
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    createdBy: req.user.id,
  });

  res.status(201).json({ message: "Exam created", exam });
}

export async function listExamsByBatch(req, res) {
  const { batchId } = req.params;

  const filter = { batch: batchId };
  if (req.user.role === "student") filter.isPublished = true;

  const exams = await Exam.find(filter).sort({ createdAt: -1 });
  res.json({ exams });
}

export async function getExam(req, res) {
  const { id } = req.params;
  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  // students only see published + within window (optional)
  if (req.user.role === "student") {
    if (!exam.isPublished) return res.status(403).json({ message: "Exam not published" });
    if (!isWithinWindow(exam)) return res.status(400).json({ message: "Exam not active now" });
  }

  res.json({ exam });
}

export async function updateExam(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const batch = await Batch.findById(exam.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const allowed = ["title", "description", "durationMinutes", "startAt", "endAt", "isPublished"];
  for (const key of allowed) {
    if (body[key] !== undefined) exam[key] = body[key];
  }
  if (body.durationMinutes !== undefined) exam.durationMinutes = Number(body.durationMinutes);
  if (body.startAt !== undefined) exam.startAt = body.startAt ? new Date(body.startAt) : null;
  if (body.endAt !== undefined) exam.endAt = body.endAt ? new Date(body.endAt) : null;

  await exam.save();
  res.json({ message: "Exam updated", exam });
}

export async function deleteExam(req, res) {
  const { id } = req.params;

  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const batch = await Batch.findById(exam.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  await Question.deleteMany({ exam: id });
  await Exam.deleteOne({ _id: id });

  res.json({ message: "Exam deleted (questions removed too)" });
}
