// backend/routes/lessonRoutes.js - UPDATED

const express = require("express");
const {
  addLesson,
  getLesson,
  deleteLesson,
  saveLesson,
  getUserSavedLessons,
} = require("../controllers/lessonController");
const checkJwt = require("../middlewares/authMiddleware");
const attachUser = require("../middlewares/attachUser");

const router = express.Router();

/**
 * 🔧 CRITICAL: SPECIFIC ROUTES BEFORE GENERIC :id ROUTES
 * Order matters! More specific paths must come before generic patterns
 */

// 🟢 SAVE LESSON: POST /api/lessons/save
// Save a lesson from course to user's collection
router.post("/save", checkJwt, attachUser, saveLesson);

// 🟢 GET USER'S SAVED LESSONS: GET /api/lessons/user/saved
// Fetch all lessons saved by current user
router.get("/user/saved", checkJwt, attachUser, getUserSavedLessons);

/**
 * Generic :id routes AFTER specific routes
 * These handle both course lessons and saved lessons
 */

// 🟢 ADD LESSON TO MODULE: POST /api/lessons/:moduleId
// Add a lesson to a module (for building courses)
router.post("/:moduleId", checkJwt, attachUser, addLesson);

// 🟢 DELETE LESSON: DELETE /api/lessons/:lessonId
// Delete a lesson (checks ownership if saved)
router.delete("/:lessonId", checkJwt, attachUser, deleteLesson);

// 🔓 GET LESSON: GET /api/lessons/:lessonId
// Get lesson by ID (public, but can be saved or course lesson)
router.get("/:lessonId", getLesson);

module.exports = router;
