import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", maxlength: 2000 },

    category: { type: String, default: "General", trim: true, maxlength: 60 },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    language: { type: String, default: "Bangla", trim: true, maxlength: 40 },

    price: { type: Number, default: 0, min: 0 },
    thumbnailUrl: { type: String, default: "" },

    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // workflow
    status: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "pending" },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },

    // optional admin feedback
    adminNote: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
