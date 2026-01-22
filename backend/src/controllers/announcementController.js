import Announcement from "../models/Announcement.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return false;
}

async function createAnnouncementNotifications({ batchId, creatorId, title, body, link }) {
  // Notify approved students in this batch (excluding creator if they are a student)
  const enrolls = await Enrollment.find({ batch: batchId, status: "approved" }).select("student").lean();
  const userIds = enrolls.map((e) => String(e.student)).filter((id) => id !== String(creatorId));

  if (!userIds.length) return;

  const docs = userIds.map((uid) => ({
    user: uid,
    type: "announcement",
    title: title || "New announcement",
    message: body ? String(body).slice(0, 240) : "A new announcement was posted.",
    link: link || "",
  }));

  await Notification.insertMany(docs, { ordered: false });
}

export async function listAnnouncementsForBatch(req, res) {
  const { batchId } = req.params;
  const role = req.user?.role;

  // students should only see published announcements
  const filter = { batch: batchId };
  if (role === "student") filter.isPublished = true;

  const items = await Announcement.find(filter)
    .populate("createdBy", "name role")
    .sort({ isPinned: -1, createdAt: -1 })
    .lean();

  res.json({ announcements: items });
}

export async function createAnnouncement(req, res) {
  const { batchId } = req.params;
  const { title, body, isPinned, isPublished } = req.body || {};

  if (!title || !body) return res.status(400).json({ message: "title and body are required" });

  const doc = await Announcement.create({
    batch: batchId,
    title,
    body,
    createdBy: req.user.id,
    isPinned: toBool(isPinned),
    isPublished: isPublished === undefined ? true : toBool(isPublished),
  });

  // Notify students only if published
  if (doc.isPublished) {
    await createAnnouncementNotifications({
      batchId,
      creatorId: req.user.id,
      title: doc.title,
      body: doc.body,
      link: `/student/batch/${batchId}?tab=announcements`,
    });
  }

  const full = await Announcement.findById(doc._id).populate("createdBy", "name role").lean();
  res.status(201).json({ announcement: full });
}

export async function updateAnnouncement(req, res) {
  const { id } = req.params;
  const existing = await Announcement.findById(id);
  if (!existing) return res.status(404).json({ message: "Announcement not found" });

  // Only creator or admin can edit
  if (req.user.role !== "admin" && String(existing.createdBy) !== String(req.user.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const prevPublished = !!existing.isPublished;

  const { title, body, isPinned, isPublished } = req.body || {};
  if (title !== undefined) existing.title = title;
  if (body !== undefined) existing.body = body;
  if (isPinned !== undefined) existing.isPinned = toBool(isPinned);
  if (isPublished !== undefined) existing.isPublished = toBool(isPublished);

  await existing.save();

  // If it just became published, notify
  if (!prevPublished && existing.isPublished) {
    await createAnnouncementNotifications({
      batchId: existing.batch,
      creatorId: req.user.id,
      title: existing.title,
      body: existing.body,
      link: `/student/batch/${existing.batch}?tab=announcements`,
    });
  }

  const full = await Announcement.findById(existing._id).populate("createdBy", "name role").lean();
  res.json({ announcement: full });
}

export async function deleteAnnouncement(req, res) {
  const { id } = req.params;
  const existing = await Announcement.findById(id);
  if (!existing) return res.status(404).json({ message: "Announcement not found" });

  // Only creator or admin can delete
  if (req.user.role !== "admin" && String(existing.createdBy) !== String(req.user.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await Announcement.deleteOne({ _id: id });
  res.json({ message: "Deleted" });
}
