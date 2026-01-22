import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }, // optional

    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 180 },
    description: { type: String, default: "", maxlength: 3000 },

    dueDate: { type: Date }, // optional
    totalMarks: { type: Number, default: 100, min: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

assignmentSchema.index({ batch: 1, createdAt: -1 });

export default mongoose.model("Assignment", assignmentSchema);
