import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },

    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 }, // e.g., "Batch-1"
    code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g., "MERN-B1-2025"

    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    startDate: { type: Date },
    endDate: { type: Date },

    isActive: { type: Boolean, default: true },
    seatLimit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
  },
  { timestamps: true }
);

export default mongoose.model("Batch", batchSchema);
