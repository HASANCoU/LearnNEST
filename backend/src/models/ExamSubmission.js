import mongoose from "mongoose";

const examSubmissionSchema = new mongoose.Schema(
    {
        exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        submissionPdfUrl: { type: String, required: true },
        submittedAt: { type: Date, default: Date.now },

        // Grading by teacher
        marks: { type: Number, default: null },
        feedback: { type: String, default: "", maxlength: 1000 },
        gradedAt: { type: Date },
        gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// One submission per student per exam
examSubmissionSchema.index({ exam: 1, student: 1 }, { unique: true });

export default mongoose.model("ExamSubmission", examSubmissionSchema);
