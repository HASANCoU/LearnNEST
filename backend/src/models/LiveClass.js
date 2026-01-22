import mongoose from "mongoose";

const liveClassSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },

    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60, min: 5, max: 600 },

    meetingUrl: { type: String, required: true, trim: true },
    note: { type: String, default: "", maxlength: 800 },

    recordingUrl: { type: String, default: "", trim: true },

    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

liveClassSchema.index({ batch: 1, scheduledAt: -1 });

export default mongoose.model("LiveClass", liveClassSchema);
