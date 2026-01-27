import User from "../models/User.js";

// Get current user profile
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to get profile" });
  }
}

// Update current user profile
export async function updateMe(req, res) {
  const body = req.body || {};

  const allowed = ["name", "phone", "avatarUrl", "bio", "address", "dateOfBirth", "gender"];
  const updates = {};

  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      message: "No valid fields to update. Allowed: name, phone, avatarUrl, bio, address, dateOfBirth, gender",
    });
  }

  try {
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
}

// Upload avatar
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Find user to get old avatar
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, "../../uploads/avatars", path.basename(user.avatarUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    user.avatarUrl = avatarUrl;
    await user.save();

    res.json({ message: "Avatar uploaded", user, avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
}

// List all teachers (Admin usage mainly)
export async function listTeachers(req, res) {
  try {
    const teachers = await User.find({ role: "teacher" }).select("name email avatarUrl");
    res.json({ teachers });
  } catch (err) {
    res.status(500).json({ message: "Failed to load teachers" });
  }
}
