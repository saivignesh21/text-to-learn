// backend/routes/aiRoutes.js - UPDATED

const express = require("express");
const router = express.Router();
const {
  generateCourseHandler,
  generateLessonHandler,
  studyBuddyHandler,
  feynmanHandler,
  generatePathsHandler,
} = require("../controllers/aiController");

/**
 * POST /api/ai/generate-course
 * Generate a complete course from a topic
 */
router.post("/generate-course", async (req, res, next) => {
  console.log("\n🔵 [AI Routes] POST /api/ai/generate-course");
  await generateCourseHandler(req, res, next);
});

/**
 * POST /api/ai/generate-lesson
 * Generate a single lesson with content blocks
 */
router.post("/generate-lesson", async (req, res, next) => {
  console.log("\n🔵 [AI Routes] POST /api/ai/generate-lesson");
  await generateLessonHandler(req, res, next);
});

/**
 * POST /api/ai/study-buddy
 * Interact with the context-aware Study Buddy chatbot
 */
router.post("/study-buddy", async (req, res, next) => {
  await studyBuddyHandler(req, res, next);
});

/**
 * POST /api/ai/feynman
 * Evaluate user's explanation via the Feynman technique simulator
 */
router.post("/feynman", async (req, res, next) => {
  await feynmanHandler(req, res, next);
});

/**
 * POST /api/ai/generate-paths
 * Generate adaptive paths for what to learn next
 */
router.post("/generate-paths", async (req, res, next) => {
  await generatePathsHandler(req, res, next);
});

module.exports = router;
