import Notification from "../models/Notification.js";

export async function listMyNotifications(req, res) {
  const unreadOnly = String(req.query.unreadOnly || "") === "1";
  const filter = { user: req.user.id };
  if (unreadOnly) filter.isRead = false;

  const items = await Notification.find(filter).sort({ isRead: 1, createdAt: -1 }).limit(200).lean();
  const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

  res.json({ notifications: items, unreadCount });
}

export async function markRead(req, res) {
  const { id } = req.params;
  const doc = await Notification.findOneAndUpdate(
    { _id: id, user: req.user.id },
    { $set: { isRead: true } },
    { new: true }
  ).lean();

  if (!doc) return res.status(404).json({ message: "Notification not found" });
  res.json({ notification: doc });
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { $set: { isRead: true } });
  res.json({ message: "All marked as read" });
}
