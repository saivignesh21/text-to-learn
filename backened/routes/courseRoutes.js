// backend/routes/courseRoutes.js - UPDATED

const express = require("express");
const {
  createCourse,
  getCourse,
  getUserCourses,
  getAllCourses,
  deleteCourse,
  saveCourse, // 🔧 NEW
} = require("../controllers/courseController");

const {
  generateCourseHandler,
  generateLessonHandler,
} = require("../controllers/aiController");

const checkJwt = require("../middlewares/authMiddleware");
const attachUser = require("../middlewares/attachUser");

const router = express.Router();

/**
 * 🔧 CRITICAL: SPECIFIC ROUTES BEFORE GENERIC /id ROUTES
 */

// 🟢 Protected routes (specific paths first)
router.get("/my", checkJwt, attachUser, getUserCourses); // ✅ before /:id
router.post("/", checkJwt, attachUser, saveCourse); // 🔧 Main save endpoint

// 🧠 AI Course generation routes (protected)
router.post("/generate", checkJwt, attachUser, generateCourseHandler);
router.post("/generate-lesson", checkJwt, attachUser, generateLessonHandler);

/**
 * Generic :id routes AFTER specific routes
 */

router.delete("/:id", checkJwt, attachUser, deleteCourse); // Delete course

// 🌍 Public routes
router.get("/", getAllCourses);
router.get("/:id", getCourse); // Get single course

module.exports = router;
