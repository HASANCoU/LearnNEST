import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },

    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
    description: { type: String, default: "", maxlength: 2000 },

    order: { type: Number, default: 1, min: 1 }, // lesson sequence
    scheduledAt: { type: Date },                 // optional
    isPublished: { type: Boolean, default: true } // teacher can hide later
  },
  { timestamps: true }
);

lessonSchema.index({ batch: 1, order: 1 });

export default mongoose.model("Lesson", lessonSchema);
