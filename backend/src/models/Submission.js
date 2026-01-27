import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Phase-5: URL based submission (Drive/GitHub/Link). Later: file upload.
    // Phase-5: URL based submission (Drive/GitHub/Link). Later: file upload.
    submissionUrl: { type: String, trim: true },
    fileUrl: { type: String, trim: true },
    note: { type: String, default: "", maxlength: 800 },

    status: { type: String, enum: ["submitted", "graded"], default: "submitted" },

    marks: { type: Number, default: null, min: 0 },
    feedback: { type: String, default: "", maxlength: 1200 },
    gradedAt: { type: Date },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// One submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
