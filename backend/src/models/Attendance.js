import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    date: { type: Date, required: true }, // normalized to YYYY-MM-DD 00:00:00
    status: { type: String, enum: ["present", "absent"], required: true },

    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: true }
);

// One record per student per batch per date
attendanceSchema.index({ batch: 1, student: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
