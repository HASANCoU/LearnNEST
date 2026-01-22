//mongodb+srv://mehedihasancou2_db_user:CArmc1XLvOi6w8Tl@cluster0.heg1nnl.mongodb.net/?appName=Cluster0
//CArmc1XLvOi6w8Tl

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { notFound, errorHandler } from "./middlewares/error.js";
import courseRoutes from "./routes/courseRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";

import lessonRoutes from "./routes/lessonRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";

import assignmentRoutes from "./routes/assignmentRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";

import liveClassRoutes from "./routes/liveClassRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

import examRoutes from "./routes/examRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";

import announcementRoutes from "./routes/announcementRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import completionRoutes from "./routes/completionRoutes.js";



const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ message: "LearnNEST API running ✅" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);

app.use("/api/batches", batchRoutes);
app.use("/api/enrollments", enrollmentRoutes);

app.use("/api/lessons", lessonRoutes);
app.use("/api/materials", materialRoutes);

app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);

app.use("/api/live-classes", liveClassRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);

app.use("/api/announcements", announcementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/completions", completionRoutes);


app.use(notFound);
app.use(errorHandler);

export default app;
