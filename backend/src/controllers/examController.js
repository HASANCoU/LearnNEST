import Batch from "../models/Batch.js";
import Exam from "../models/Exam.js";
import Question from "../models/Question.js";
import ExamSubmission from "../models/ExamSubmission.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isWithinWindow(exam) {
  const now = new Date();
  if (exam.startAt && now < new Date(exam.startAt)) return false;
  if (exam.endAt && now > new Date(exam.endAt)) return false;
  return true;
}

async function notifyStudents({ batchId, creatorId, title, message, link, type }) {
  const enrolls = await Enrollment.find({ batch: batchId, status: "approved" }).select("student").lean();
  const userIds = enrolls.map((e) => String(e.student)).filter((id) => id !== String(creatorId));
  if (!userIds.length) return;

  const docs = userIds.map((uid) => ({
    user: uid,
    type: type || "info",
    title,
    message: message.slice(0, 240),
    link: link || "",
  }));
  await Notification.insertMany(docs, { ordered: false });
}

export async function createExam(req, res) {
  const { batchId } = req.params;
  const body = req.body || {};
  const { title, description, durationMinutes, startAt, endAt, isPublished, examType, totalMarks } = body;

  if (!title) return res.status(400).json({ message: "title is required" });

  const batch = await Batch.findById(batchId).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  // Handle PDF upload if present
  let questionPdfUrl = "";
  if (req.file) {
    questionPdfUrl = `/uploads/exams/${req.file.filename}`;
  }

  const exam = await Exam.create({
    batch: batchId,
    title,
    description: description || "",
    examType: examType || "mcq",
    questionPdfUrl,
    durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : 30,
    totalMarks: totalMarks !== undefined ? Number(totalMarks) : 0,
    startAt: startAt ? new Date(startAt) : undefined,
    endAt: endAt ? new Date(endAt) : undefined,
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    createdBy: req.user.id,
  });

  if (exam.isPublished) {
    await notifyStudents({
      batchId,
      creatorId: req.user.id,
      title: `New Exam: ${exam.title}`,
      message: `A new exam "${exam.title}" has been posted in your batch.`,
      link: `/student/batch/${batchId}?tab=exams`,
      type: "exam",
    });
  }

  res.status(201).json({ message: "Exam created", exam });
}

export async function listExamsByBatch(req, res) {
  const { batchId } = req.params;

  const filter = { batch: batchId };
  if (req.user.role === "student") filter.isPublished = true;

  const exams = await Exam.find(filter).sort({ createdAt: -1 });
  res.json({ exams });
}

export async function getExam(req, res) {
  const { id } = req.params;
  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  // students only see published + within window (optional)
  if (req.user.role === "student") {
    if (!exam.isPublished) return res.status(403).json({ message: "Exam not published" });
    if (!isWithinWindow(exam)) return res.status(400).json({ message: "Exam not active now" });
  }

  res.json({ exam });
}

export async function updateExam(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const batch = await Batch.findById(exam.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  // Handle PDF upload for update
  if (req.file) {
    if (exam.questionPdfUrl) {
      const oldPath = path.join(__dirname, "../../uploads/exams", path.basename(exam.questionPdfUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    exam.questionPdfUrl = `/uploads/exams/${req.file.filename}`;
  }

  const allowed = ["title", "description", "durationMinutes", "startAt", "endAt", "isPublished", "examType", "totalMarks"];
  for (const key of allowed) {
    if (body[key] !== undefined) exam[key] = body[key];
  }
  if (body.durationMinutes !== undefined) exam.durationMinutes = Number(body.durationMinutes);
  if (body.totalMarks !== undefined) exam.totalMarks = Number(body.totalMarks);
  if (body.startAt !== undefined) exam.startAt = body.startAt ? new Date(body.startAt) : null;
  if (body.endAt !== undefined) exam.endAt = body.endAt ? new Date(body.endAt) : null;

  if (body.endAt !== undefined) exam.endAt = body.endAt ? new Date(body.endAt) : null;

  const wasPublished = exam.isPublished;
  await exam.save();

  if (!wasPublished && exam.isPublished) {
    await notifyStudents({
      batchId: exam.batch,
      creatorId: req.user.id,
      title: `New Exam Published: ${exam.title}`,
      message: `The exam "${exam.title}" is now available.`,
      link: `/student/batch/${exam.batch}?tab=exams`,
      type: "exam",
    });
  }

  res.json({ message: "Exam updated", exam });
}

export async function deleteExam(req, res) {
  const { id } = req.params;

  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const batch = await Batch.findById(exam.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  if (exam.questionPdfUrl) {
    const qPath = path.join(__dirname, "../../uploads/exams", path.basename(exam.questionPdfUrl));
    if (fs.existsSync(qPath)) fs.unlinkSync(qPath);
  }

  // Delete all submission files
  const submissions = await ExamSubmission.find({ exam: id });
  for (const sub of submissions) {
    if (sub.submissionPdfUrl) {
      const sPath = path.join(__dirname, "../../uploads/submissions", path.basename(sub.submissionPdfUrl));
      if (fs.existsSync(sPath)) fs.unlinkSync(sPath);
    }
  }

  await Question.deleteMany({ exam: id });
  await ExamSubmission.deleteMany({ exam: id });
  await Exam.deleteOne({ _id: id });

  res.json({ message: "Exam deleted (questions and submissions removed too)" });
}

// PDF Exam Submissions
export async function submitPdfExam(req, res) {
  const { examId } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const exam = await Exam.findById(examId);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  if (exam.examType !== "pdf") {
    return res.status(400).json({ message: "This is not a PDF exam" });
  }

  if (!exam.isPublished) {
    return res.status(403).json({ message: "Exam not published" });
  }

  // Check deadline
  if (exam.endAt && new Date() > new Date(exam.endAt)) {
    return res.status(400).json({ message: "Submission deadline has passed" });
  }

  const submissionPdfUrl = `/uploads/submissions/${req.file.filename}`;

  // Check if already submitted
  const existing = await ExamSubmission.findOne({ exam: examId, student: req.user.id });
  if (existing) {
    // Delete old file
    if (existing.submissionPdfUrl) {
      const oldPath = path.join(__dirname, "../../uploads/submissions", path.basename(existing.submissionPdfUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Update existing submission
    existing.submissionPdfUrl = submissionPdfUrl;
    existing.submittedAt = new Date();
    await existing.save();
    return res.json({ message: "Submission updated", submission: existing });
  }

  const submission = await ExamSubmission.create({
    exam: examId,
    student: req.user.id,
    submissionPdfUrl,
  });

  res.status(201).json({ message: "Submission received", submission });
}

export async function getExamSubmissions(req, res) {
  const { examId } = req.params;

  const exam = await Exam.findById(examId);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const batch = await Batch.findById(exam.batch).select("teacher");
  if (req.user.role !== "admin" && batch?.teacher?.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const submissions = await ExamSubmission.find({ exam: examId })
    .populate("student", "name email")
    .sort({ submittedAt: -1 });

  res.json({ submissions });
}

export async function gradeSubmission(req, res) {
  const { submissionId } = req.params;
  const { marks, feedback } = req.body || {};

  const submission = await ExamSubmission.findById(submissionId);
  if (!submission) return res.status(404).json({ message: "Submission not found" });

  const exam = await Exam.findById(submission.exam);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const batch = await Batch.findById(exam.batch).select("teacher");
  if (req.user.role !== "admin" && batch?.teacher?.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (marks !== undefined) submission.marks = Number(marks);
  if (feedback !== undefined) submission.feedback = feedback;
  submission.gradedAt = new Date();
  submission.gradedBy = req.user.id;

  await submission.save();

  res.json({ message: "Submission graded", submission });
}

export async function getMySubmission(req, res) {
  const { examId } = req.params;

  const submission = await ExamSubmission.findOne({
    exam: examId,
    student: req.user.id,
  });

  res.json({ submission: submission || null });
}

export async function viewQuestionPaper(req, res) {
  const { id } = req.params;

  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  if (!exam.questionPdfUrl) {
    return res.status(400).json({ message: "No question paper attached" });
  }

  const filePath = path.join(__dirname, "../../uploads/exams", path.basename(exam.questionPdfUrl));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found on server" });
  }

  res.setHeader("Content-Type", "application/pdf");
  // res.setHeader("Content-Disposition", `inline; filename="QuestionPaper.pdf"`);
  fs.createReadStream(filePath).pipe(res);
}

export async function viewSubmissionFile(req, res) {
  const { id } = req.params; // submission id

  const submission = await ExamSubmission.findById(id);
  if (!submission) return res.status(404).json({ message: "Submission not found" });

  if (!submission.submissionPdfUrl) {
    return res.status(400).json({ message: "No file attached" });
  }

  // Auth check: student owner OR teacher of batch
  if (submission.student.toString() !== req.user.id) {
    const exam = await Exam.findById(submission.exam);
    const batch = await Batch.findById(exam.batch);
    if (batch.teacher.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  const filePath = path.join(__dirname, "../../uploads/submissions", path.basename(submission.submissionPdfUrl));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found on server" });
  }

  res.setHeader("Content-Type", "application/pdf");
  fs.createReadStream(filePath).pipe(res);
}
