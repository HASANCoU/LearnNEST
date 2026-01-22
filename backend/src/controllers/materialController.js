import Batch from "../models/Batch.js";
import Lesson from "../models/Lesson.js";
import Material from "../models/Material.js";

/**
 * Teacher/Admin: create material for a batch (optionally attach to a lesson)
 * For now we accept a URL.
 */
export async function createMaterial(req, res) {
  const { batchId } = req.params;
  const body = req.body || {};

  const { title, type, url, note, lessonId, isPublished } = body;
  if (!title || !url) return res.status(400).json({ message: "title and url are required" });

  const batch = await Batch.findById(batchId).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  let lesson = null;
  if (lessonId) {
    lesson = await Lesson.findOne({ _id: lessonId, batch: batchId }).select("_id");
    if (!lesson) return res.status(400).json({ message: "Invalid lessonId for this batch" });
  }

  const material = await Material.create({
    batch: batchId,
    lesson: lesson ? lesson._id : undefined,
    title,
    type: type || "link",
    url,
    note: note || "",
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
  });

  res.status(201).json({ message: "Material created", material });
}

/**
 * Enrolled/Teacher/Admin: list materials of a batch
 * Students see only published materials
 */
export async function listMaterialsByBatch(req, res) {
  const { batchId } = req.params;

  const filter = { batch: batchId };
  if (req.user.role === "student") filter.isPublished = true;

  const materials = await Material.find(filter)
    .populate("lesson", "title order")
    .sort({ createdAt: -1 });

  res.json({ materials });
}

/**
 * Teacher/Admin: update material
 */
export async function updateMaterial(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  const material = await Material.findById(id);
  if (!material) return res.status(404).json({ message: "Material not found" });

  const batch = await Batch.findById(material.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const allowed = ["title", "type", "url", "note", "isPublished"];
  for (const key of allowed) {
    if (body[key] !== undefined) material[key] = body[key];
  }

  await material.save();
  res.json({ message: "Material updated", material });
}

/**
 * Teacher/Admin: delete material
 */
export async function deleteMaterial(req, res) {
  const { id } = req.params;

  const material = await Material.findById(id);
  if (!material) return res.status(404).json({ message: "Material not found" });

  const batch = await Batch.findById(material.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  await Material.deleteOne({ _id: id });
  res.json({ message: "Material deleted" });
}
