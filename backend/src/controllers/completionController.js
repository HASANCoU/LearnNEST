import Completion from "../models/Completion.js";
import Enrollment from "../models/Enrollment.js";
import Attendance from "../models/Attendance.js";
import Submission from "../models/Submission.js";
import ExamAttempt from "../models/ExamAttempt.js";

function makeSerial(batchId, studentId) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const b = String(batchId).slice(-4);
  const s = String(studentId).slice(-4);
  return `LN-${b}-${s}-${y}${m}${day}`;
}

async function computeStats(batchId, studentId) {
  const [attTotal, attPresent, submissions, attempts] = await Promise.all([
    Attendance.countDocuments({ batch: batchId, student: studentId }),
    Attendance.countDocuments({ batch: batchId, student: studentId, status: "present" }),
    Submission.countDocuments({ batch: batchId, student: studentId }),
    ExamAttempt.find({ batch: batchId, student: studentId, status: "submitted" }).select("score").lean(),
  ]);

  const bestScore = (attempts || []).reduce((mx, a) => Math.max(mx, a.score || 0), 0);
  const attendancePct = attTotal ? Math.round((attPresent / attTotal) * 100) : 0;

  return {
    attendanceTotal: attTotal,
    attendancePresent: attPresent,
    attendancePct,
    submissionsCount: submissions,
    attemptsCount: attempts.length,
    bestExamScore: bestScore,
  };
}

export async function getMyCompletion(req, res) {
  const { batchId } = req.query;
  if (!batchId) return res.status(400).json({ message: "batchId is required" });

  // ensure enrolled
  const ok = await Enrollment.exists({ batch: batchId, student: req.user.id, status: "approved" });
  if (!ok) return res.status(403).json({ message: "Forbidden: not enrolled" });

  const [doc, stats] = await Promise.all([
    Completion.findOne({ batch: batchId, student: req.user.id }).lean(),
    computeStats(batchId, req.user.id),
  ]);

  res.json({ completion: doc || null, stats });
}

export async function listBatchCompletions(req, res) {
  const { batchId } = req.params;

  // list approved students
  const enrolls = await Enrollment.find({ batch: batchId, status: "approved" })
    .populate("student", "name email role")
    .select("student")
    .lean();

  const ids = enrolls.map((e) => e.student?._id).filter(Boolean);

  const existing = await Completion.find({ batch: batchId, student: { $in: ids } }).lean();
  const map = new Map(existing.map((c) => [String(c.student), c]));

  const rows = [];
  for (const e of enrolls) {
    const sid = e.student._id;
    const stats = await computeStats(batchId, sid);
    rows.push({
      student: e.student,
      completion: map.get(String(sid)) || null,
      stats,
    });
  }

  res.json({ items: rows });
}

export async function markCompletion(req, res) {
  const { batchId } = req.params;
  const { studentId, isCompleted } = req.body || {};
  if (!studentId) return res.status(400).json({ message: "studentId is required" });

  const ok = await Enrollment.exists({ batch: batchId, student: studentId, status: "approved" });
  if (!ok) return res.status(400).json({ message: "Student is not approved in this batch" });

  const completed = !!isCompleted;

  const update = {
    isCompleted: completed,
    completedAt: completed ? new Date() : null,
  };
  if (completed) update.certificateSerial = makeSerial(batchId, studentId);
  else update.certificateSerial = "";

  const doc = await Completion.findOneAndUpdate(
    { batch: batchId, student: studentId },
    { $set: update },
    { upsert: true, new: true }
  ).lean();

  res.json({ completion: doc });
}
