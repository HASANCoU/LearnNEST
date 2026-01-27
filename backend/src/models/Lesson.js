import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },

    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
    description: { type: String, default: "", maxlength: 2000 },

    // Direct video content for the lesson
    videoUrl: { type: String, default: "" },
    fileUrl: { type: String, default: "" }, // local path if uploaded

    order: { type: Number, default: 1, min: 1 },
    scheduledAt: { type: Date },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

lessonSchema.index({ batch: 1, module: 1, order: 1 });

export default mongoose.model("Lesson", lessonSchema);
