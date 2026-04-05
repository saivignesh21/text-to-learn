// backend/routes/aiRoutes.js - UPDATED

const express = require("express");
const router = express.Router();
const {
  generateCourseHandler,
  generateLessonHandler,
} = require("../controllers/aiController");

/**
 * POST /api/ai/generate-course
 * Generate a complete course from a topic
 *
 * Request body:
 * {
 *   "topic": "Python Basics"
 * }
 *
 * Response: Complete course with modules and lessons
 */
router.post("/generate-course", async (req, res, next) => {
  console.log("\n🔵 [AI Routes] POST /api/ai/generate-course");
  console.log("Request body:", req.body);
  await generateCourseHandler(req, res, next);
});

/**
 * POST /api/ai/generate-lesson
 * Generate a single lesson with content blocks
 *
 * Request body:
 * {
 *   "courseTitle": "Python Basics",
 *   "moduleTitle": "Introduction",
 *   "lessonTitle": "Variables and Data Types"
 * }
 *
 * Response: Lesson with objectives and content blocks
 */
router.post("/generate-lesson", async (req, res, next) => {
  console.log("\n🔵 [AI Routes] POST /api/ai/generate-lesson");
  console.log("Request body:", req.body);
  await generateLessonHandler(req, res, next);
});

module.exports = router;
