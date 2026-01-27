import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different file types
const subDirs = ["avatars", "thumbnails", "materials", "exams", "submissions", "lessons"];
subDirs.forEach((dir) => {
    const dirPath = path.join(uploadsDir, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Default to general uploads, specific routes will override
        let uploadPath = uploadsDir;

        if (req.uploadType) {
            uploadPath = path.join(uploadsDir, req.uploadType);
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
});

// File filter for images
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
};

// File filter for PDFs
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        return cb(null, true);
    }
    cb(new Error("Only PDF files are allowed"));
};

// File filter for materials (PDF, video, etc.)
const materialFilter = (req, file, cb) => {
    const allowedTypes = /pdf|mp4|webm|mov|avi|mkv|doc|docx|ppt|pptx/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);

    if (allowedTypes.test(ext)) {
        return cb(null, true);
    }
    cb(new Error("File type not allowed. Allowed: pdf, mp4, webm, mov, avi, mkv, doc, docx, ppt, pptx"));
};

// Multer instances for different use cases
export const uploadAvatar = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export const uploadThumbnail = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadMaterial = multer({
    storage,
    fileFilter: materialFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

export const uploadLesson = multer({
    storage,
    fileFilter: materialFilter,
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB for video lessons
});

export const uploadExamPdf = multer({
    storage,
    fileFilter: pdfFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// File filter for submissions (allow most types: pdf, img, doc, zip)
const submissionFilter = (req, file, cb) => {
    // block executables/scripts for basic sanity
    const blocked = /exe|sh|bat|js|php|pl|py|rb|asp|aspx|jsp|jar|war/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);

    if (blocked.test(ext)) {
        return cb(new Error("File type not allowed (executables/scripts blocked)"));
    }
    cb(null, true);
};

export const uploadSubmission = multer({
    storage,
    fileFilter: submissionFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Middleware to set upload type
export const setUploadType = (type) => (req, res, next) => {
    req.uploadType = type;
    next();
};

// Get the uploads directory path
export const getUploadsDir = () => uploadsDir;
