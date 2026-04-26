const express = require("express");
const router = express.Router();
const checkJwt = require("../middlewares/authMiddleware");
const attachUser = require("../middlewares/attachUser");
const progressController = require("../controllers/progressController");

// Protect all progress routes
router.use(checkJwt, attachUser);

// GET /api/progress - Get user's progress and stats
router.get("/", progressController.getUserProgress);

// POST /api/progress/lessons/:lessonId/complete - Mark a lesson as complete
router.post("/lessons/:lessonId/complete", progressController.markLessonComplete);

module.exports = router;
