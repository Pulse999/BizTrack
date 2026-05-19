// LOAD ENV FIRST — BEFORE ANY OTHER IMPORTS
import dotenv from "dotenv";
dotenv.config();

// Ensure JWT secret exists at startup — fail fast if missing
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error(
    "FATAL: Missing JWT_SECRET. Set JWT_SECRET in .env or your environment.",
  );
  process.exit(1);
}
if (jwtSecret.length < 32) {
  console.warn(
    "Warning: JWT_SECRET is shorter than 32 characters; consider using a longer secret for security.",
  );
}

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import authRoutes from "./routes/authRoutes";
import courseRoutes from "./routes/courseRoutes";
import quizRoutes from "./routes/quizRoutes";
import adminRoutes from "./routes/adminRoutes";
import certificatesRoutes from "./routes/certificatesRoutes";
import statsRoutes from "./routes/statsRoutes";
import contentRoutes from "./routes/contentRoutes";
import progressRoutes from "./routes/progressRoutes";
import videosRoutes from "./routes/videosRoutes";
import userRoutes from "./routes/userRoutes"; // ✅ ADD THIS
import companyRoutes from "./routes/companyRoutes";

const app = express();
const PORT = process.env.PORT || 5000;

// Debug: Remove after confirming it works
console.log("🌍 ENV CHECK:");
console.log("SUPABASE_URL =", process.env.SUPABASE_URL);
console.log("SUPABASE_CERT_BUCKET =", process.env.SUPABASE_CERT_BUCKET);
console.log(
  "SUPABASE_KEY =",
  process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10),
);

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
    //love
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/certificates", certificatesRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/videos", videosRoutes);
app.use("/api/users", userRoutes); // ✅ FIXED — NOW THE PROFILE ROUTE EXISTS
app.use("/api/companies", companyRoutes);

// Health check
app.get("/", (_req, res) =>
  res.json({ message: "Learning Hub API", uptime: process.uptime() }),
);

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT} (Neon database 📊)`);
});
