// backend/src/app.ts

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

// Routes
import authRoutes from "./routes/authRoutes";
import courseRoutes from "./routes/courseRoutes";
import quizRoutes from "./routes/quizRoutes";
import adminRoutes from "./routes/adminRoutes";
import certificatesRoutes from "./routes/certificatesRoutes";
import statsRoutes from "./routes/statsRoutes";
import contentRoutes from "./routes/contentRoutes";
import progressRoutes from "./routes/progressRoutes";
import videosRoutes from "./routes/videosRoutes";
import userRoutes from "./routes/userRoutes";
import companyRoutes from "./routes/companyRoutes";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8080",
      ...(process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : []),
    ],
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/certificates", certificatesRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/videos", videosRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);

// Health Check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "BizTrack Learning Hub API",
    uptime: process.uptime(),
  });
});

export default app;