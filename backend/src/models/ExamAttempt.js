import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },

    // For MCQ answers: [{questionId, selectedIndex}]
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
        selectedIndex: { type: Number, required: true, min: 0, max: 5 },
      },
    ],

    score: { type: Number, default: 0, min: 0 },
    correctCount: { type: Number, default: 0, min: 0 },
    wrongCount: { type: Number, default: 0, min: 0 },

    status: { type: String, enum: ["started", "submitted"], default: "started" },
  },
  { timestamps: true }
);

// one attempt per student per exam (simple rule)
attemptSchema.index({ exam: 1, student: 1 }, { unique: true });

export default mongoose.model("ExamAttempt", attemptSchema);
