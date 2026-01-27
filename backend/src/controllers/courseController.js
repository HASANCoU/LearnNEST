import Course from "../models/Course.js";
import { slugify } from "../utils/slugify.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Teacher creates course (default pending)
 * Supports thumbnail file upload
 */
export async function createCourse(req, res) {
  const { title, description, category, level, language, price, thumbnailUrl } = req.body || {};

  if (!title) return res.status(400).json({ message: "title is required" });

  const baseSlug = slugify(title);
  if (!baseSlug) return res.status(400).json({ message: "Invalid title" });

  // ensure unique slug
  let slug = baseSlug;
  let i = 1;
  while (await Course.exists({ slug })) {
    slug = `${baseSlug}-${i++}`;
  }



  // Handle thumbnail file upload
  let finalThumbnailUrl = thumbnailUrl || "";
  if (req.file) {
    finalThumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;
  }

  const course = await Course.create({
    title,
    slug,
    description: description || "",
    category: category || "General",
    level: level || "beginner",
    language: language || "Bangla",
    price: Number(price || 0),
    thumbnailUrl: finalThumbnailUrl,
    teacher: req.user.id,
    status: "pending",
    isPublished: false,
  });

  res.status(201).json({ message: "Course created (pending approval)", course });
}

/**
 * Public list: only approved + published
 */
export async function listPublicCourses(req, res) {
  const q = (req.query.q || "").trim();
  const filter = { status: "approved", isPublished: true };

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
    ];
  }

  const courses = await Course.find(filter)
    .populate("teacher", "name email avatarUrl")
    .sort({ publishedAt: -1, createdAt: -1 });

  res.json({ courses });
}

/**
 * Public single
 */
export async function getPublicCourseBySlug(req, res) {
  const { slug } = req.params;

  const course = await Course.findOne({
    slug,
    status: "approved",
    isPublished: true,
  }).populate("teacher", "name email avatarUrl");

  if (!course) return res.status(404).json({ message: "Course not found" });

  res.json({ course });
}


/**
 * Teacher/Admin internal: get course by id (including pending)
 */
export async function getCourseById(req, res) {
  const { id } = req.params;

  const course = await Course.findById(id).populate("teacher", "name email avatarUrl role");
  if (!course) return res.status(404).json({ message: "Course not found" });

  // Teacher can only read own course; admin can read any
  if (req.user.role !== "admin" && String(course.teacher?._id || course.teacher) !== String(req.user.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.json({ course });
}

/**
 * Teacher: my courses (all statuses)
 */
export async function listMyCourses(req, res) {
  const courses = await Course.find({ teacher: req.user.id }).sort({ createdAt: -1 });
  res.json({ courses });
}

/**
 * Teacher update (only own course). If approved/published, we set pending again (simple workflow).
 * Supports thumbnail file upload
 */
export async function updateCourse(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  const course = await Course.findById(id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  if (req.user.role !== "admin" && course.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your course" });
  }

  // Handle thumbnail file upload
  if (req.file) {
    if (course.thumbnailUrl) {
      const oldPath = path.join(__dirname, "../../uploads/thumbnails", path.basename(course.thumbnailUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    course.thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;
  }

  const allowed = ["title", "description", "category", "level", "language", "price", "thumbnailUrl"];

  // Allow admin to reassign teacher
  if (req.user.role === "admin") allowed.push("teacher");

  for (const key of allowed) {
    if (body[key] !== undefined) course[key] = body[key];
  }

  // if title changed, update slug uniquely
  if (body.title && body.title !== course.title) {
    const baseSlug = slugify(body.title);
    let slug = baseSlug;
    let i = 1;
    while (await Course.exists({ slug, _id: { $ne: course._id } })) {
      slug = `${baseSlug}-${i++}`;
    }
    course.slug = slug;
  }

  // workflow rule: editing requires re-approval
  course.status = "pending";
  course.isPublished = false;
  course.publishedAt = null;

  await course.save();
  res.json({ message: "Course updated and set to pending approval", course });
}

export async function deleteCourse(req, res) {
  const { id } = req.params;

  const course = await Course.findById(id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  if (req.user.role !== "admin" && course.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your course" });
  }

  if (course.thumbnailUrl) {
    const oldPath = path.join(__dirname, "../../uploads/thumbnails", path.basename(course.thumbnailUrl));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  await Course.deleteOne({ _id: id });
  res.json({ message: "Course deleted" });
}



/**
 * Admin: approve/reject
 */
export async function adminSetCourseStatus(req, res) {
  const { id } = req.params;
  const { status, adminNote } = req.body || {};

  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ message: "status must be approved/rejected/pending" });
  }

  const course = await Course.findByIdAndUpdate(
    id,
    { status, adminNote: adminNote || "" },
    { new: true }
  ).populate("teacher", "name email");

  if (!course) return res.status(404).json({ message: "Course not found" });

  // if rejected/pending => unpublish
  if (status !== "approved") {
    course.isPublished = false;
    course.publishedAt = null;
    await course.save();
  }

  res.json({ message: "Course status updated", course });
}

/**
 * Admin: publish/unpublish (only if approved)
 */
export async function adminPublishCourse(req, res) {
  const { id } = req.params;
  const { isPublished } = req.body || {};

  const course = await Course.findById(id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  if (course.status !== "approved") {
    return res.status(400).json({ message: "Only approved courses can be published" });
  }

  course.isPublished = Boolean(isPublished);
  course.publishedAt = course.isPublished ? new Date() : null;

  await course.save();
  res.json({ message: "Publish state updated", course });
}
