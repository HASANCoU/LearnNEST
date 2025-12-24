import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },

    text: { type: String, required: true, trim: true, minlength: 3, maxlength: 1500 },

    options: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2 && arr.length <= 6,
        message: "options must be 2 to 6 items",
      },
    },

    correctIndex: { type: Number, required: true, min: 0, max: 5 },
    marks: { type: Number, default: 1, min: 0 },
    negativeMarks: { type: Number, default: 0, min: 0 },

    order: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

questionSchema.index({ exam: 1, order: 1 });

export default mongoose.model("Question", questionSchema);
