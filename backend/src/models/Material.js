import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }, // optional

    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },

    // For Phase-4: keep it simple as URL-based.
    // (Later Phase: file upload to Cloudinary and store secure_url here)
    type: {
      type: String,
      enum: ["pdf", "video", "slide", "link", "other"],
      default: "link",
    },

    url: { type: String, required: true, trim: true },
    note: { type: String, default: "", maxlength: 800 },

    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

materialSchema.index({ batch: 1, createdAt: -1 });

export default mongoose.model("Material", materialSchema);
