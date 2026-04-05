const express = require("express");
const {
  addModule,
  deleteModule,
  getModulesByCourse,
  getLessonsByModule,
} = require("../controllers/moduleController");
const checkJwt = require("../middlewares/authMiddleware");
const attachUser = require("../middlewares/attachUser");

const router = express.Router();

// Add module to a course (protected)
router.post("/:courseId/modules", checkJwt, attachUser, addModule);

// Get all modules for a course (public)
router.get("/:courseId/modules", getModulesByCourse);

// Delete a module (protected)
router.delete("/:moduleId", checkJwt, attachUser, deleteModule);

// Get all lessons for a module (public)
router.get("/:moduleId/lessons", getLessonsByModule);

module.exports = router;
