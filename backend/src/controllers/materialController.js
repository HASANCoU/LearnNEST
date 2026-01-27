import Batch from "../models/Batch.js";
import Lesson from "../models/Lesson.js";
import Material from "../models/Material.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Teacher/Admin: create material for a batch (optionally attach to a lesson)
 * Supports both URL and file upload
 */
export async function createMaterial(req, res) {
  const { batchId } = req.params;
  const body = req.body || {};

  const { title, type, url, note, lessonId, isPublished } = body;
  if (!title) return res.status(400).json({ message: "title is required" });

  // Either URL or file is required
  if (!url && !req.file) {
    return res.status(400).json({ message: "Either url or file is required" });
  }

  const batch = await Batch.findById(batchId).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  let lesson = null;
  if (lessonId) {
    lesson = await Lesson.findOne({ _id: lessonId, batch: batchId }).select("_id");
    if (!lesson) return res.status(400).json({ message: "Invalid lessonId for this batch" });
  }

  // Handle file upload
  let fileUrl = "";
  if (req.file) {
    fileUrl = `/uploads/materials/${req.file.filename}`;
  }

  const material = await Material.create({
    batch: batchId,
    lesson: lesson ? lesson._id : undefined,
    title,
    type: type || (req.file ? getFileType(req.file.originalname) : "link"),
    url: url || "",
    fileUrl,
    note: note || "",
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
  });

  res.status(201).json({ message: "Material created", material });
}

// Helper to determine file type from extension
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase().slice(1);
  if (["pdf"].includes(ext)) return "pdf";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
  if (["ppt", "pptx"].includes(ext)) return "slide";
  return "other";
}

/**
 * Enrolled/Teacher/Admin: list materials of a batch
 * Students see only published materials
 */
export async function listMaterialsByBatch(req, res) {
  const { batchId } = req.params;

  const filter = { batch: batchId };
  if (req.user.role === "student") filter.isPublished = true;

  const materials = await Material.find(filter)
    .populate("lesson", "title order")
    .sort({ createdAt: -1 });

  res.json({ materials });
}

/**
 * Teacher/Admin: update material
 */
export async function updateMaterial(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  const material = await Material.findById(id);
  if (!material) return res.status(404).json({ message: "Material not found" });

  const batch = await Batch.findById(material.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  // Handle file upload
  if (req.file) {
    if (material.fileUrl) {
      const oldPath = path.join(__dirname, "../../uploads/materials", path.basename(material.fileUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    material.fileUrl = `/uploads/materials/${req.file.filename}`;
    material.type = getFileType(req.file.originalname);
  }

  const allowed = ["title", "type", "url", "note", "isPublished"];
  for (const key of allowed) {
    if (body[key] !== undefined) material[key] = body[key];
  }

  await material.save();
  res.json({ message: "Material updated", material });
}

/**
 * Teacher/Admin: delete material
 */
export async function deleteMaterial(req, res) {
  const { id } = req.params;

  const material = await Material.findById(id);
  if (!material) return res.status(404).json({ message: "Material not found" });

  const batch = await Batch.findById(material.batch).select("teacher");
  if (!batch) return res.status(404).json({ message: "Batch not found" });

  if (req.user.role !== "admin" && batch.teacher.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden: not your batch" });
  }

  if (material.fileUrl) {
    const filePath = path.join(__dirname, "../../uploads/materials", path.basename(material.fileUrl));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await Material.deleteOne({ _id: id });
  res.json({ message: "Material deleted" });
}

/**
 * Stream/View file content without forcing download
 */
export async function viewMaterial(req, res) {
  const { id } = req.params;

  const material = await Material.findById(id);
  if (!material) return res.status(404).json({ message: "Material not found" });

  if (!material.fileUrl) {
    return res.status(400).json({ message: "No file attached to this material" });
  }

  const filePath = path.join(__dirname, "../../uploads/materials", path.basename(material.fileUrl));

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found on server" });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };

  const contentType = mimeTypes[ext] || "application/octet-stream";

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range && (contentType.startsWith("video/") || contentType === "application/pdf")) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send("Requested range not satisfiable\n" + start + " >= " + fileSize);
      return;
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${path.basename(material.fileUrl)}"`,
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
}

/**
 * Download file with proper download headers
 */
export async function downloadMaterial(req, res) {
  const { id } = req.params;

  const material = await Material.findById(id);
  if (!material) return res.status(404).json({ message: "Material not found" });

  if (!material.fileUrl) {
    return res.status(400).json({ message: "No file attached to this material" });
  }

  const filePath = path.join(__dirname, "../../uploads/materials", path.basename(material.fileUrl));

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found on server" });
  }

  res.download(filePath, material.title + path.extname(filePath));
}
