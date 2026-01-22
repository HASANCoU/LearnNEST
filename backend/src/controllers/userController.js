import User from "../models/User.js";

export async function updateMe(req, res) {
  const body = req.body || {}; // ✅ prevents "undefined"

  const allowed = ["name", "phone", "avatarUrl"];
  const updates = {};

  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      message: "No valid fields to update. Allowed: name, phone, avatarUrl",
    });
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ message: "Profile updated", user });
}
