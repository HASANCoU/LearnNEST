import User from "../models/User.js";
import { signToken } from "../utils/token.js";

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "name, email, password are required" });

  if (password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email already in use" });

  const user = await User.create({ name, email, password });

  const token = signToken({ id: user._id.toString(), role: user.role });
  res.status(201).json({
    message: "Registered successfully",
    token,
    user,
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "email and password are required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  if (!user.isActive) return res.status(403).json({ message: "Account is disabled" });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user._id.toString(), role: user.role });
  res.json({ message: "Login successful", token, user });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
}

export async function logout(req, res) {
  // header-token auth has no server logout. Frontend deletes token.
  res.json({ message: "Logged out (client should delete token)" });
}
