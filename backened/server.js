const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

// Load environment variables BEFORE anything else
dotenv.config();

// Import Routes
const courseRoutes = require("./routes/courseRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const aiRoutes = require("./routes/aiRoutes");
const enrichmentRoutes = require("./routes/enrichment"); // NEW: Milestones 9, 10, 11
const debugRoutes = require("./routes/debugRoutes"); // 🆕 DEBUG ROUTES
const quizRoutes = require("./routes/quizRoutes");
// Connect to MongoDB
connectDB();

const app = express();

// ==================== MIDDLEWARE ====================

// ✅ UPDATED: Dynamic CORS Configuration (Production-Ready)
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || "http://localhost:3000",
  "http://localhost:3000", // Create React App default
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://text-to-learn-5v9z.vercel.app",
];

// ✅ ADD: Your Vercel frontend URL when deployed
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

// ✅ ADD: Your frontend production URL (if different from Vercel)
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

console.log("📋 CORS Origins Allowed:", allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Parse JSON requests
app.use(express.json());

// Parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

// ==================== HEALTH CHECK ====================

app.get("/", (req, res) => {
  res.json({
    message: "🚀 Text-to-Learn Backend API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: "connected", // You could add actual DB health check here
  });
});

// ==================== API ROUTES ====================

// Mount all API routes
app.use("/api/ai", aiRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/enrichment", enrichmentRoutes); // NEW: Milestones 9, 10, 11
app.use("/api/debug", debugRoutes); // 🆕 DEBUG ROUTES - FOR TESTING ONLY
app.use("/api/quiz", quizRoutes); // 🆕 QUIZ ROUTES 
app.use("/api/quiz", quizRoutes);
// ==================== DEBUG INFO ====================

console.log("📋 Configuration loaded:");
console.log("  - Environment:", process.env.NODE_ENV || "development");
console.log("  - Auth0 Domain:", process.env.AUTH0_DOMAIN || "NOT SET");
console.log("  - Auth0 Audience:", process.env.AUTH0_AUDIENCE || "NOT SET");
console.log("  - MongoDB:", process.env.MONGO_URI ? "CONFIGURED" : "NOT SET");
console.log(
  "  - OpenAI API:",
  process.env.OPENAI_API_KEY ? "CONFIGURED" : "NOT SET"
);
console.log(
  "  - Gemini API:",
  process.env.GEMINI_API_KEY ? "CONFIGURED" : "NOT SET"
);
console.log(
  "  - YouTube API:",
  process.env.YOUTUBE_API_KEY ? "CONFIGURED" : "NOT SET"
);
console.log("  - Client Origins: Configured (see above)");
console.log("  - Debug Routes: ENABLED at /api/debug");

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
    ╔════════════════════════════════════════╗
    ║  ✅ Backend Server Running             ║
    ║  🌐 Port: ${PORT}                      ║
    ║  📍 Environment: ${process.env.NODE_ENV || "development"} ║
    ║  🔧 API: http://localhost:${PORT}/api  ║
    ║                                         ║
    ║  📚 Features:                          ║
    ║  🎬 YouTube: /api/enrichment/videos    ║
    ║  🌐 Hinglish: /api/enrichment/translate ║
    ║  📄 PDF: /api/enrichment/export         ║
    ║  🐛 Debug: /api/debug (DEV ONLY)        ║
    ╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

module.exports = app;