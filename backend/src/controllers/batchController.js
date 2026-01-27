import Batch from "../models/Batch.js";
import Course from "../models/Course.js";

/**
 * Admin creates batch for an existing course and assigns a teacher
 */
export async function createBatch(req, res) {
  const { courseId, name, code, teacherId, startDate, endDate, seatLimit } = req.body || {};

  if (!courseId || !name || !code || !teacherId) {
    return res
      .status(400)
      .json({ message: "courseId, name, code, teacherId are required" });
  }

  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });

  const batch = await Batch.create({
    course: courseId,
    name,
    code: String(code).toUpperCase().trim(),
    teacher: teacherId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    seatLimit: Number(seatLimit || 0),
  });

  res.status(201).json({ message: "Batch created", batch });
}

/**
 * Public/Student view: list active batches for a course (only for approved/published courses)
 * Keep it simple: return batches (without student list)
 */
export async function listBatchesByCourse(req, res) {
  const { courseId } = req.query;
  if (!courseId) return res.status(400).json({ message: "courseId query is required" });

  const batches = await Batch.find({ course: courseId, isActive: true })
    .populate("teacher", "name email avatarUrl role")
    .sort({ createdAt: -1 });

  res.json({ batches });
}

/**
 * Teacher/Admin: list my batches
 */
export async function listMyBatches(req, res) {
  const role = req.user.role;

  const filter = role === "admin" ? {} : { teacher: req.user.id };
  const batches = await Batch.find(filter)
    .populate("course", "title slug status isPublished")
    .sort({ createdAt: -1 });

  res.json({ batches });
}

/**
 * Admin updates batch (teacher reassignment, dates, active flag)
 */
export async function updateBatch(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  const allowed = ["name", "code", "teacher", "startDate", "endDate", "isActive", "seatLimit"];
  const updates = {};

  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (updates.code) updates.code = String(updates.code).toUpperCase().trim();
  if (updates.startDate) updates.startDate = new Date(updates.startDate);
  if (updates.endDate) updates.endDate = new Date(updates.endDate);

  const batch = await Batch.findByIdAndUpdate(id, updates, { new: true });
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  res.json({ message: "Batch updated", batch });
}

/**
 * Admin: delete batch
 */
export async function deleteBatch(req, res) {
  const { id } = req.params;

  const batch = await Batch.findByIdAndDelete(id);
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  res.json({ message: "Batch deleted", batch });
}

