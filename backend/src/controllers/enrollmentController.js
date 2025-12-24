import Batch from "../models/Batch.js";
import Enrollment from "../models/Enrollment.js";

/**
 * Student requests enrollment
 */
export async function requestEnrollment(req, res) {
  const { batchId } = req.body || {};
  if (!batchId) return res.status(400).json({ message: "batchId is required" });

  const batch = await Batch.findById(batchId).select("seatLimit isActive");
  if (!batch || !batch.isActive) return res.status(404).json({ message: "Batch not found/active" });

  // optional: seat limit check (only approved counts)
  if (batch.seatLimit > 0) {
    const approvedCount = await Enrollment.countDocuments({ batch: batchId, status: "approved" });
    if (approvedCount >= batch.seatLimit) {
      return res.status(400).json({ message: "Batch seat limit reached" });
    }
  }

  try {
    const enrollment = await Enrollment.create({
      student: req.user.id,
      batch: batchId,
      status: "pending",
    });

    res.status(201).json({ message: "Enrollment requested", enrollment });
  } catch (err) {
    // duplicate unique index -> already requested
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already enrolled/requested for this batch" });
    }
    throw err;
  }
}

/**
 * Student: my enrollments
 */
export async function myEnrollments(req, res) {
  const enrollments = await Enrollment.find({ student: req.user.id })
    .populate({
      path: "batch",
      populate: [
        { path: "course", select: "title slug status isPublished" },
        { path: "teacher", select: "name email avatarUrl" },
      ],
    })
    .sort({ createdAt: -1 });

  res.json({ enrollments });
}

/**
 * Teacher/Admin: view enrollments by batch
 * Teacher can view only own batches, Admin can view all
 */
export async function listEnrollmentsByBatch(req, res) {
  const { batchId } = req.query;
  if (!batchId) return res.status(400).json({ message: "batchId query is required" });

  const batch = await Batch.findById(batchId).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const enrollments = await Enrollment.find({ batch: batchId })
    .populate("student", "name email avatarUrl")
    .sort({ createdAt: -1 });

  res.json({ enrollments });
}

/**
 * Teacher/Admin: approve/reject enrollment
 * Teacher can approve only for own batch
 */
export async function updateEnrollmentStatus(req, res) {
  const { id } = req.params; // enrollment id
  const { status, note } = req.body || {};

  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ message: "status must be approved/rejected/pending" });
  }

  const enrollment = await Enrollment.findById(id).populate("batch", "teacher seatLimit");
  if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

  const batchTeacherId = enrollment.batch.teacher.toString();
  if (req.user.role !== "admin" && batchTeacherId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  // seat limit check when approving
  if (status === "approved" && enrollment.batch.seatLimit > 0) {
    const approvedCount = await Enrollment.countDocuments({
      batch: enrollment.batch._id,
      status: "approved",
      _id: { $ne: enrollment._id },
    });
    if (approvedCount >= enrollment.batch.seatLimit) {
      return res.status(400).json({ message: "Batch seat limit reached" });
    }
  }

  enrollment.status = status;
  enrollment.note = note || enrollment.note;

  if (status === "approved") enrollment.approvedAt = new Date();
  if (status !== "approved") enrollment.approvedAt = null;

  await enrollment.save();
  res.json({ message: "Enrollment updated", enrollment });
}
