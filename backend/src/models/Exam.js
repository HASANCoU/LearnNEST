import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },

    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
    description: { type: String, default: "", maxlength: 2000 },

    // Exam type: mcq (multiple choice) or pdf (upload questions PDF, students submit answers)
    examType: { type: String, enum: ["mcq", "pdf"], default: "mcq" },
    questionPdfUrl: { type: String, default: "" }, // For PDF type exams

    durationMinutes: { type: Number, default: 30, min: 1, max: 300 },
    totalMarks: { type: Number, default: 0, min: 0 }, // will be updated from questions

    startAt: { type: Date }, // optional
    endAt: { type: Date },   // optional (deadline for PDF submissions)

    isPublished: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

examSchema.index({ batch: 1, createdAt: -1 });

export default mongoose.model("Exam", examSchema);
