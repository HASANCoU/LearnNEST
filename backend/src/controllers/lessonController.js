import Batch from "../models/Batch.js";
import fs from "fs";
import path from "path";
import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";

/**
 * Helper to verify if the user is the teacher of the batch or an admin.
 */
async function checkBatchAccess(batchId, userId, role) {
  if (role === "admin") return true;
  const batch = await Batch.findById(batchId).select("teacher");
  return batch && String(batch.teacher) === String(userId);
}

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
 * Teacher/Admin: create lesson for a batch
 */
export async function createLesson(req, res) {
  const { batchId } = req.params;
  try {
    const { title, description, order, scheduledAt, isPublished, moduleId, videoUrl } = req.body;
    const fileUrl = req.file ? `/uploads/lessons/${req.file.filename}` : "";

    if (!title) return res.status(400).json({ message: "title is required" });
    if (!moduleId) return res.status(400).json({ message: "moduleId is required" });

    const hasAccess = await checkBatchAccess(batchId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ message: "Forbidden: You are not the assigned teacher of this batch" });
    }

    // Verify module belongs to this batch
    const moduleDoc = await Module.findOne({ _id: moduleId, batch: batchId });
    if (!moduleDoc) return res.status(404).json({ message: "Module not found in this batch" });

    const lesson = await Lesson.create({
      batch: batchId,
      module: moduleId,
      title,
      description: description || "",
      videoUrl: videoUrl || "",
      fileUrl: fileUrl || "",
      order: Number(order || 1),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    });

    if (lesson.isPublished) {
      await notifyStudents({
        batchId,
        creatorId: req.user.id,
        title: `New Lesson: ${lesson.title}`,
        message: `A new lesson "${lesson.title}" has been added to module ${moduleDoc.title}.`,
        link: `/student/batch/${batchId}?tab=lessons`,
        type: "lesson",
      });
    }

    res.status(201).json({ message: "Lesson created", lesson });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Enrolled/Teacher/Admin: list lessons of a batch or module
 */
export async function listLessonsByBatch(req, res) {
  const { batchId } = req.params;
  const { moduleId } = req.query;

  const filter = { batch: batchId };
  if (moduleId) filter.module = moduleId;
  if (req.user.role === "student") filter.isPublished = true;

  const lessons = await Lesson.find(filter).sort({ order: 1, createdAt: 1 });
  res.json({ lessons });
}

/**
 * Teacher/Admin: update lesson
 */
export async function updateLesson(req, res) {
  const { id } = req.params;
  try {
    const lesson = await Lesson.findById(id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const hasAccess = await checkBatchAccess(lesson.batch, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ message: "Forbidden: You are not the assigned teacher of this batch" });
    }

    const updates = req.body;
    if (req.file) {
      // delete old file if exists
      if (lesson.fileUrl) {
        try {
          fs.unlinkSync(path.join(process.cwd(), lesson.fileUrl));
        } catch (e) {
          console.error("Error deleting old lesson file:", e);
        }
      }
      updates.fileUrl = `/uploads/lessons/${req.file.filename}`;
    }

    const wasPublished = !!lesson.isPublished;

    // Apply updates to the lesson object
    const allowed = ["title", "description", "order", "scheduledAt", "isPublished", "module", "videoUrl", "fileUrl"];
    for (const key of allowed) {
      if (updates[key] !== undefined) lesson[key] = updates[key];
    }

    if (updates.order !== undefined) lesson.order = Number(updates.order);
    if (updates.scheduledAt !== undefined) {
      lesson.scheduledAt = updates.scheduledAt ? new Date(updates.scheduledAt) : null;
    }

    await lesson.save();

    if (!wasPublished && lesson.isPublished) {
      await notifyStudents({
        batchId: lesson.batch,
        creatorId: req.user.id,
        title: `New Lesson Published: ${lesson.title}`,
        message: `The lesson "${lesson.title}" is now available.`,
        link: `/student/batch/${lesson.batch}?tab=lessons`,
        type: "lesson",
      });
    }

    res.json({ message: "Lesson updated", lesson });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Teacher/Admin: delete lesson
 */
export async function deleteLesson(req, res) {
  const { id } = req.params;

  const lesson = await Lesson.findById(id);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  const hasAccess = await checkBatchAccess(lesson.batch, req.user.id, req.user.role);
  if (!hasAccess) {
    return res.status(403).json({ message: "Forbidden: You are not the assigned teacher of this batch" });
  }

  // Delete associated file if it exists
  if (lesson.fileUrl) {
    try {
      fs.unlinkSync(path.join(process.cwd(), lesson.fileUrl));
    } catch (e) {
      console.error("Error deleting lesson file:", e);
    }
  }

  await Lesson.deleteOne({ _id: id });
  res.json({ message: "Lesson deleted" });
}

export const viewLessonFile = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson || !lesson.fileUrl) return res.status(404).send("File not found");
    const filePath = path.join(process.cwd(), lesson.fileUrl);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

export const downloadLessonFile = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson || !lesson.fileUrl) return res.status(404).send("File not found");
    const filePath = path.join(process.cwd(), lesson.fileUrl);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");
    res.download(filePath, `${lesson.title}${path.extname(lesson.fileUrl)}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
