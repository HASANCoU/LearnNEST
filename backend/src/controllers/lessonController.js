import Batch from "../models/Batch.js";
import Lesson from "../models/Lesson.js";

/**
 * Teacher/Admin: create lesson for a batch
 * Only batch teacher or admin can create
 */
export async function createLesson(req, res) {
  const { batchId } = req.params;
  const body = req.body || {};

  const { title, description, order, scheduledAt, isPublished } = body;
  if (!title) return res.status(400).json({ message: "title is required" });

  const batch = await Batch.findById(batchId).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const lesson = await Lesson.create({
    batch: batchId,
    title,
    description: description || "",
    order: Number(order || 1),
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
  });

  res.status(201).json({ message: "Lesson created", lesson });
}

/**
 * Enrolled/Teacher/Admin: list lessons of a batch
 * Students see only published lessons
 */
export async function listLessonsByBatch(req, res) {
  const { batchId } = req.params;

  const filter = { batch: batchId };
  if (req.user.role === "student") filter.isPublished = true;

  const lessons = await Lesson.find(filter).sort({ order: 1, createdAt: 1 });
  res.json({ lessons });
}

/**
 * Teacher/Admin: update lesson
 */
export async function updateLesson(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  const lesson = await Lesson.findById(id);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  const batch = await Batch.findById(lesson.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const allowed = ["title", "description", "order", "scheduledAt", "isPublished"];
  for (const key of allowed) {
    if (body[key] !== undefined) lesson[key] = body[key];
  }
  if (body.order !== undefined) lesson.order = Number(body.order);
  if (body.scheduledAt !== undefined) {
    lesson.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  }

  await lesson.save();
  res.json({ message: "Lesson updated", lesson });
}

/**
 * Teacher/Admin: delete lesson
 */
export async function deleteLesson(req, res) {
  const { id } = req.params;

  const lesson = await Lesson.findById(id);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  const batch = await Batch.findById(lesson.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  await Lesson.deleteOne({ _id: id });
  res.json({ message: "Lesson deleted" });
}
