import Batch from "../models/Batch.js";
import LiveClass from "../models/LiveClass.js";

export async function createLiveClass(req, res) {
  const { batchId } = req.params;
  const body = req.body || {};
  const { title, scheduledAt, durationMinutes, meetingUrl, note, isPublished } = body;

  if (!title || !scheduledAt || !meetingUrl) {
    return res.status(400).json({ message: "title, scheduledAt, meetingUrl are required" });
  }

  const batch = await Batch.findById(batchId).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const liveClass = await LiveClass.create({
    batch: batchId,
    title,
    scheduledAt: new Date(scheduledAt),
    durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : 60,
    meetingUrl,
    note: note || "",
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    createdBy: req.user.id,
  });

  res.status(201).json({ message: "Live class created", liveClass });
}

export async function listLiveClassesByBatch(req, res) {
  const { batchId } = req.params;

  const filter = { batch: batchId };
  if (req.user.role === "student") filter.isPublished = true;

  const liveClasses = await LiveClass.find(filter).sort({ scheduledAt: -1 });
  res.json({ liveClasses });
}

export async function updateLiveClass(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  const liveClass = await LiveClass.findById(id);
  if (!liveClass) return res.status(404).json({ message: "Live class not found" });

  const batch = await Batch.findById(liveClass.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const allowed = ["title", "scheduledAt", "durationMinutes", "meetingUrl", "note", "isPublished", "recordingUrl"];
  for (const key of allowed) {
    if (body[key] !== undefined) liveClass[key] = body[key];
  }
  if (body.scheduledAt !== undefined) liveClass.scheduledAt = new Date(body.scheduledAt);
  if (body.durationMinutes !== undefined) liveClass.durationMinutes = Number(body.durationMinutes);

  await liveClass.save();
  res.json({ message: "Live class updated", liveClass });
}

export async function deleteLiveClass(req, res) {
  const { id } = req.params;

  const liveClass = await LiveClass.findById(id);
  if (!liveClass) return res.status(404).json({ message: "Live class not found" });

  const batch = await Batch.findById(liveClass.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  await LiveClass.deleteOne({ _id: id });
  res.json({ message: "Live class deleted" });
}
