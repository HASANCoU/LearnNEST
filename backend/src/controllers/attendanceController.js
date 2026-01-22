import Attendance from "../models/Attendance.js";
import Batch from "../models/Batch.js";
import Enrollment from "../models/Enrollment.js";

function normalizeDateOnly(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  return new Date(Date.UTC(y, m, day, 0, 0, 0));
}

/**
 * Teacher/Admin marks attendance in bulk for a date.
 * Body:
 * {
 *   "date": "2025-12-24",
 *   "records": [
 *     {"studentId":"...", "status":"present", "note":""},
 *     {"studentId":"...", "status":"absent"}
 *   ]
 * }
 */
export async function markAttendance(req, res) {
  const { batchId } = req.params;
  const body = req.body || {};
  const { date, records } = body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "records array is required" });
  }

  const batch = await Batch.findById(batchId).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const day = normalizeDateOnly(date);

  // Only allow marking approved enrolled students
  const approved = await Enrollment.find({ batch: batchId, status: "approved" }).select("student");
  const approvedSet = new Set(approved.map((e) => e.student.toString()));

  const ops = [];
  for (const r of records) {
    const studentId = r.studentId;
    const status = r.status;

    if (!studentId || !["present", "absent"].includes(status)) continue;
    if (!approvedSet.has(String(studentId))) continue;

    ops.push({
      updateOne: {
        filter: { batch: batchId, student: studentId, date: day },
        update: {
          $set: {
            status,
            note: r.note || "",
            markedBy: req.user.id,
          },
        },
        upsert: true,
      },
    });
  }

  if (ops.length === 0) {
    return res.status(400).json({ message: "No valid records (must be approved students)" });
  }

  await Attendance.bulkWrite(ops);
  res.json({ message: "Attendance marked", date: day.toISOString().slice(0, 10), count: ops.length });
}

/**
 * Student: my attendance for a batch
 * GET /api/attendance/me?batchId=...
 */
export async function myAttendance(req, res) {
  const { batchId } = req.query;
  if (!batchId) return res.status(400).json({ message: "batchId query is required" });

  const ok = await Enrollment.exists({ batch: batchId, student: req.user.id, status: "approved" });
  if (!ok) return res.status(403).json({ message: "Forbidden: not enrolled in this batch" });

  const records = await Attendance.find({ batch: batchId, student: req.user.id })
    .sort({ date: -1 })
    .select("date status note");

  res.json({ records });
}

/**
 * Teacher/Admin: attendance list for a date
 * GET /api/attendance/batch/:batchId?date=YYYY-MM-DD
 */
export async function attendanceByDate(req, res) {
  const { batchId } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: "date query is required (YYYY-MM-DD)" });

  const batch = await Batch.findById(batchId).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  const day = normalizeDateOnly(date);

  const records = await Attendance.find({ batch: batchId, date: day })
    .populate("student", "name email")
    .sort({ "student.name": 1 });

  res.json({ date, records });
}
