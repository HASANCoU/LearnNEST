import Batch from "../models/Batch.js";
import Enrollment from "../models/Enrollment.js";

/**
 * Allows access if:
 * - user is admin
 * - user is the batch teacher
 * - user is an approved student in that batch
 *
 * Requires: req.user set by requireAuth
 * Expects: batch id in req.params.batchId OR req.query.batchId OR req.body.batchId
 */
export async function requireEnrolledOrTeacher(req, res, next) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (role === "admin") return next();

    const batchId = req.params.batchId || req.query.batchId || req.body.batchId;
    if (!batchId) return res.status(400).json({ message: "batchId is required" });

    const batch = await Batch.findById(batchId).select("teacher");
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    if (batch.teacher.toString() === userId) return next();

    const ok = await Enrollment.exists({ batch: batchId, student: userId, status: "approved" });
    if (!ok) return res.status(403).json({ message: "Forbidden: not enrolled in this batch" });

    next();
  } catch (err) {
    next(err);
  }
}
