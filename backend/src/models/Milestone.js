import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
    {
        batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, default: "", maxlength: 1000 },
        order: { type: Number, default: 1, min: 1 },
        isPublished: { type: Boolean, default: true },
    },
    { timestamps: true }
);

milestoneSchema.index({ batch: 1, order: 1 });

export default mongoose.model("Milestone", milestoneSchema);
