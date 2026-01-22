import mongoose from "mongoose";

const CompletionSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    certificateSerial: { type: String, default: "" },
  },
  { timestamps: true }
);

CompletionSchema.index({ batch: 1, student: 1 }, { unique: true });

export default mongoose.model("Completion", CompletionSchema);
