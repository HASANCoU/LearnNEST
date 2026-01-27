import Module from "../models/Module.js";
import Batch from "../models/Batch.js";

/**
 * Helper to verify if the user is the teacher of the batch or an admin.
 */
async function checkBatchAccess(batchId, userId, role) {
    if (role === "admin") return true;
    const batch = await Batch.findById(batchId).select("teacher");
    return batch && String(batch.teacher) === String(userId);
}

export async function createModule(req, res) {
    const { batchId } = req.params;
    const { title, description, order, isPublished } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const hasAccess = await checkBatchAccess(batchId, req.user.id, req.user.role);
    if (!hasAccess) {
        return res.status(403).json({ message: "Forbidden: You are not the assigned teacher of this batch" });
    }

    const moduleDoc = await Module.create({
        batch: batchId,
        title,
        description: description || "",
        order: Number(order || 1),
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    });

    res.status(201).json({ module: moduleDoc });
}

export async function listModulesByBatch(req, res) {
    const { batchId } = req.params;
    const filter = { batch: batchId };

    // Students only see published modules
    if (req.user.role === "student") {
        filter.isPublished = true;
    }

    const modules = await Module.find(filter).sort({ order: 1 });
    res.json({ modules });
}

export async function updateModule(req, res) {
    const { id } = req.params;
    const body = req.body;

    const moduleDoc = await Module.findById(id);
    if (!moduleDoc) return res.status(404).json({ message: "Module not found" });

    const hasAccess = await checkBatchAccess(moduleDoc.batch, req.user.id, req.user.role);
    if (!hasAccess) {
        return res.status(403).json({ message: "Forbidden: You are not the assigned teacher of this batch" });
    }

    const allowed = ["title", "description", "order", "isPublished"];
    allowed.forEach(k => {
        if (body[k] !== undefined) moduleDoc[k] = body[k];
    });

    await moduleDoc.save();
    res.json({ module: moduleDoc });
}

export async function deleteModule(req, res) {
    const { id } = req.params;

    const moduleDoc = await Module.findById(id);
    if (!moduleDoc) return res.status(404).json({ message: "Module not found" });

    const hasAccess = await checkBatchAccess(moduleDoc.batch, req.user.id, req.user.role);
    if (!hasAccess) {
        return res.status(403).json({ message: "Forbidden: You are not the assigned teacher of this batch" });
    }

    // Optional: Check if there are lessons inside this module before deleting
    // For now, we allow deletion (cascading or orphaned lessons should be handled by logic or UX)

    await Module.deleteOne({ _id: id });
    res.json({ message: "Module deleted" });
}
