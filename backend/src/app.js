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


app.use(notFound);
app.use(errorHandler);

export default app;
