import User from "../models/User.js";

export async function listUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
}

export async function setUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  const allowed = ["student", "teacher", "admin", "moderator"];
  if (!allowed.includes(role)) return res.status(400).json({ message: "Invalid role" });

  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ message: "Role updated", user });
}

export async function setUserStatus(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ message: "Status updated", user });
}
