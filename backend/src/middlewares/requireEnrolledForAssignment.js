import Assignment from "../models/Assignment.js";
import Batch from "../models/Batch.js";
import Enrollment from "../models/Enrollment.js";

export async function requireEnrolledForAssignment(req, res, next) {
  const { assignmentId } = req.body || {};
  if (!assignmentId) return res.status(400).json({ message: "assignmentId is required" });

  const assignment = await Assignment.findById(assignmentId).select("batch");
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });

  const batch = await Batch.findById(assignment.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  // Admin or teacher can bypass, but we use this for student submit only.
  const ok = await Enrollment.exists({ batch: assignment.batch, student: req.user.id, status: "approved" });
  if (!ok) return res.status(403).json({ message: "Forbidden: not enrolled in this batch" });

  next();
}
