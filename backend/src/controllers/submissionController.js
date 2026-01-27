import Assignment from "../models/Assignment.js";
import Batch from "../models/Batch.js";
import Submission from "../models/Submission.js";

/**
 * Student submits assignment (URL)
 * Requires enrollment guard at route level
 */
export async function createSubmission(req, res) {
  const body = req.body || {};
  const { assignmentId, submissionUrl, note } = body;

  if (!assignmentId) {
    return res.status(400).json({ message: "assignmentId is required" });
  }

  // Either URL or file is required
  if (!submissionUrl && !req.file) {
    return res.status(400).json({ message: "Either submissionUrl or file is required" });
  }

  const assignment = await Assignment.findById(assignmentId).select("batch dueDate isPublished");
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });

  if (!assignment.isPublished) {
    return res.status(403).json({ message: "Assignment is not published" });
  }

  // due date check (optional strict)
  if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
    return res.status(400).json({ message: "Deadline passed" });
  }

  // Handle file upload
  let fileUrl = "";
  if (req.file) {
    fileUrl = `/uploads/submissions/${req.file.filename}`;
  }

  try {
    const submission = await Submission.create({
      assignment: assignmentId,
      batch: assignment.batch,
      student: req.user.id,
      submissionUrl: submissionUrl || "",
      fileUrl,
      note: note || "",
    });

    res.status(201).json({ message: "Submitted", submission });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You already submitted this assignment" });
    }
    throw err;
  }
}

/**
 * Student: my submissions (optional filter by batch/assignment)
 */
export async function mySubmissions(req, res) {
  const { batchId, assignmentId } = req.query;

  const filter = { student: req.user.id };
  if (batchId) filter.batch = batchId;
  if (assignmentId) filter.assignment = assignmentId;

  const submissions = await Submission.find(filter)
    .populate("assignment", "title totalMarks dueDate")
    .sort({ createdAt: -1 });

  res.json({ submissions });
}

/**
 * Teacher/Admin: list submissions for an assignment
 * Teacher must own the batch
 */
export async function listSubmissionsByAssignment(req, res) {
  const { assignmentId } = req.query;
  if (!assignmentId) return res.status(400).json({ message: "assignmentId query is required" });

  const assignment = await Assignment.findById(assignmentId).select("batch");
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });

  const batch = await Batch.findById(assignment.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const submissions = await Submission.find({ assignment: assignmentId })
    .populate("student", "name email avatarUrl")
    .sort({ createdAt: -1 });

  res.json({ submissions });
}

/**
 * Teacher/Admin: grade a submission
 */
export async function gradeSubmission(req, res) {
  const { id } = req.params; // submission id
  const body = req.body || {};
  const { marks, feedback } = body;

  const submission = await Submission.findById(id).populate("assignment", "totalMarks batch");
  if (!submission) return res.status(404).json({ message: "Submission not found" });

  const batch = await Batch.findById(submission.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const total = submission.assignment.totalMarks ?? 100;

  const nMarks = Number(marks);
  if (Number.isNaN(nMarks) || nMarks < 0 || nMarks > total) {
    return res.status(400).json({ message: `marks must be between 0 and ${total}` });
  }

  submission.marks = nMarks;
  submission.feedback = feedback || "";
  submission.status = "graded";
  submission.gradedAt = new Date();
  submission.gradedBy = req.user.id;

  await submission.save();
  res.json({ message: "Graded", submission });
}

/**
 * Serve submission file securely.
 * Access: Owner (student), Batch Teacher, or Admin.
 */
import path from "path";
import fs from "fs";

export async function getSubmissionFile(req, res) {
  const { id } = req.params;

  const submission = await Submission.findById(id).populate({
    path: "batch",
    select: "teacher"
  });

  if (!submission) return res.status(404).json({ message: "Submission not found" });

  // Access check
  const isStudentOwner = submission.student.toString() === req.user.id;
  const isTeacher = submission.batch?.teacher?.toString() === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isStudentOwner && !isTeacher && !isAdmin) {
    return res.status(403).json({ message: "Forbidden: You cannot view this file" });
  }

  if (!submission.fileUrl) {
    return res.status(404).json({ message: "No file attached to this submission" });
  }

  // submission.fileUrl is like "/uploads/submissions/filename.ext"
  // Request is running from root of backend, so process.cwd() is usually the root.
  // We need to resolve the path correctly.

  // Clean the fileUrl to prevent traversal attacks slightly (though express sendFile handles relative weirdness, better safe)
  const relativePath = submission.fileUrl.startsWith("/") ? submission.fileUrl.slice(1) : submission.fileUrl;
  const absolutePath = path.resolve(process.cwd(), relativePath);

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ message: "File not found on server" });
  }

  res.sendFile(absolutePath);
}
