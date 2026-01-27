import Milestone from "../models/Milestone.js";
import Batch from "../models/Batch.js";

export async function createMilestone(req, res) {
    const { batchId } = req.params;
    const { title, description, order, isPublished } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const batch = await Batch.findById(batchId).select("teacher");
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    if (req.user.role !== "admin" && String(batch.teacher) !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const milestone = await Milestone.create({
        batch: batchId,
        title,
        description: description || "",
        order: Number(order || 1),
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    });

    res.status(201).json({ milestone });
}

export async function listMilestonesByBatch(req, res) {
    const { batchId } = req.params;
    const filter = { batch: batchId };
    if (req.user.role === "student") filter.isPublished = true;

    const milestones = await Milestone.find(filter).sort({ order: 1 });
    res.json({ milestones });
}

export async function updateMilestone(req, res) {
    const { id } = req.params;
    const body = req.body;

    const milestone = await Milestone.findById(id);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    const batch = await Batch.findById(milestone.batch).select("teacher");
    if (req.user.role !== "admin" && String(batch?.teacher) !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const allowed = ["title", "description", "order", "isPublished"];
    allowed.forEach(k => {
        if (body[k] !== undefined) milestone[k] = body[k];
    });

    await milestone.save();
    res.json({ milestone });
}

export async function deleteMilestone(req, res) {
    const { id } = req.params;

    const milestone = await Milestone.findById(id);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    const batch = await Batch.findById(milestone.batch).select("teacher");
    if (req.user.role !== "admin" && String(batch?.teacher) !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
    }

    await Milestone.deleteOne({ _id: id });
    res.json({ message: "Milestone deleted" });
}
