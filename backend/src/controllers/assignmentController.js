import Assignment from "../models/Assignment.js";
import Batch from "../models/Batch.js";
import Lesson from "../models/Lesson.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";

async function notifyStudents({ batchId, creatorId, title, message, link, type }) {
  const enrolls = await Enrollment.find({ batch: batchId, status: "approved" }).select("student").lean();
  const userIds = enrolls.map((e) => String(e.student)).filter((id) => id !== String(creatorId));
  if (!userIds.length) return;

  const docs = userIds.map((uid) => ({
    user: uid,
    type: type || "info",
    title,
    message: message.slice(0, 240),
    link: link || "",
  }));
  await Notification.insertMany(docs, { ordered: false });
}

/**
 * Teacher/Admin creates assignment for a batch
 */
export async function createAssignment(req, res) {
  const { batchId } = req.params;
  const body = req.body || {};
  const { title, description, dueDate, totalMarks, lessonId, isPublished } = body;

  if (!title) return res.status(400).json({ message: "title is required" });

  const batch = await Batch.findById(batchId).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  // optional lesson link validation
  let lesson = null;
  if (lessonId) {
    lesson = await Lesson.findOne({ _id: lessonId, batch: batchId }).select("_id");
    if (!lesson) return res.status(400).json({ message: "Invalid lessonId for this batch" });
  }

  const assignment = await Assignment.create({
    batch: batchId,
    lesson: lesson ? lesson._id : undefined,
    title,
    description: description || "",
    dueDate: dueDate ? new Date(dueDate) : undefined,
    totalMarks: totalMarks !== undefined ? Number(totalMarks) : 100,
    createdBy: req.user.id,
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
  });

  if (assignment.isPublished) {
    await notifyStudents({
      batchId,
      creatorId: req.user.id,
      title: `New Assignment: ${assignment.title}`,
      message: `A new assignment "${assignment.title}" has been posted.`,
      link: `/student/batch/${batchId}?tab=assignments`,
      type: "assignment",
    });
  }

  res.status(201).json({ message: "Assignment created", assignment });
}

/**
 * Enrolled/Teacher/Admin list assignments of a batch
 * Students see only published assignments
 */
export async function listAssignmentsByBatch(req, res) {
  const { batchId } = req.params;

  const filter = { batch: batchId };
  if (req.user.role === "student") filter.isPublished = true;

  const assignments = await Assignment.find(filter)
    .populate("lesson", "title order")
    .sort({ createdAt: -1 });

  res.json({ assignments });
}

/**
 * Teacher/Admin update assignment (only batch teacher or admin)
 */
export async function updateAssignment(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  const assignment = await Assignment.findById(id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });

  const batch = await Batch.findById(assignment.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const allowed = ["title", "description", "dueDate", "totalMarks", "isPublished"];
  for (const key of allowed) {
    if (body[key] !== undefined) assignment[key] = body[key];
  }

  if (body.dueDate !== undefined) assignment.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.totalMarks !== undefined) assignment.totalMarks = Number(body.totalMarks);

  if (body.totalMarks !== undefined) assignment.totalMarks = Number(body.totalMarks);

  const wasPublished = !!assignment.isPublished;
  await assignment.save();

  if (!wasPublished && assignment.isPublished) {
    await notifyStudents({
      batchId: assignment.batch,
      creatorId: req.user.id,
      title: `New Assignment Published: ${assignment.title}`,
      message: `The assignment "${assignment.title}" is now available.`,
      link: `/student/batch/${assignment.batch}?tab=assignments`,
      type: "assignment",
    });
  }

  res.json({ message: "Assignment updated", assignment });
}

/**
 * Teacher/Admin delete assignment
 */
export async function deleteAssignment(req, res) {
  const { id } = req.params;

  const assignment = await Assignment.findById(id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });

  const batch = await Batch.findById(assignment.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  await Assignment.deleteOne({ _id: id });
  res.json({ message: "Assignment deleted" });
}
