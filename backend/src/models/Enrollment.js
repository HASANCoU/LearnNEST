import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // optional later: paymentStatus, transactionId etc.
    note: { type: String, default: "", maxlength: 300 },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

// Prevent duplicate enrollment for same student+batch
enrollmentSchema.index({ student: 1, batch: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);
