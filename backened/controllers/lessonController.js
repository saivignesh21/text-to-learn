// backend/controllers/lessonController.js - COMPLETE UPDATED VERSION

const Lesson = require("../models/Lesson");
const Module = require("../models/Module");

/**
 * 🔧 NEW: POST /api/lessons/save
 * Save a lesson from course to user's collection
 * Called when student clicks "Save" button in lesson renderer
 *
 * Body: {
 *   title: string,
 *   objectives: string[],
 *   content: object[],
 *   courseTitle: string,
 *   moduleName: string
 * }
 */
exports.saveLesson = async (req, res, next) => {
  try {
    const {
      title,
      objectives = [],
      content = [],
      courseTitle,
      moduleName,
    } = req.body;
    const userId = req.user?.sub || req.auth?.payload?.sub;

    console.log("💾 SAVE LESSON - Creating new saved lesson:", {
      title,
      courseTitle,
      moduleName,
      userId,
      contentBlocks: content?.length || 0,
      objectivesCount: objectives?.length || 0,
    });

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Lesson title is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Create a NEW independent lesson (not tied to module in course)
    const lesson = new Lesson({
      title,
      objectives: objectives || [],
      content: content || [],
      module: null, // 🔧 CRITICAL: null = saved lesson, not in any module
      order: 0,
      isEnriched: false,
    });

    // Add metadata for saved lessons
    lesson.savedBy = userId;
    lesson.isSaved = true;
    lesson.courseTitle = courseTitle || "Untitled Course";
    lesson.moduleName = moduleName || "Untitled Module";

    const saved = await lesson.save();

    console.log("✅ Lesson saved successfully:", {
      lessonId: saved._id,
      title: saved.title,
      savedBy: saved.savedBy,
      isSaved: saved.isSaved,
    });

    // Return minimal response matching frontend expectations
    res.status(201).json({
      _id: saved._id,
      title: saved.title,
      objectives: saved.objectives,
      content: saved.content,
      courseTitle: saved.courseTitle,
      moduleName: saved.moduleName,
      isSaved: saved.isSaved,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.error("❌ Error saving lesson:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save lesson",
      error: err.message,
    });
  }
};

/**
 * GET /api/lessons/user/saved
 * Fetch all lessons saved by current user
 * Returns: Lesson[]
 */
exports.getUserSavedLessons = async (req, res, next) => {
  try {
    const userId = req.user?.sub || req.auth?.payload?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    console.log("📚 Fetching saved lessons for user:", userId);

    const savedLessons = await Lesson.find({
      savedBy: userId,
      isSaved: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${savedLessons.length} saved lessons`);

    // Return array directly (not wrapped in object)
    res.json(savedLessons);
  } catch (err) {
    console.error("❌ Error fetching saved lessons:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch saved lessons",
      error: err.message,
    });
  }
};

/**
 * 🟢 EXISTING: POST /api/lessons/:moduleId
 * Add lesson to a module (for lessons in course structure)
 */
exports.addLesson = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { title, objectives = [], content = [] } = req.body;

    console.log("📝 Adding lesson to module:", {
      moduleId,
      title,
      contentBlocks: content?.length || 0,
    });

    if (!title) {
      return res.status(400).json({ message: "Lesson title required" });
    }

    const mod = await Module.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ message: "Module not found" });
    }

    const lesson = new Lesson({
      title,
      objectives,
      content,
      module: mod._id,
      order: mod.lessons.length,
      isEnriched: false,
    });

    await lesson.save();

    mod.lessons.push(lesson._id);
    await mod.save();

    console.log("✅ Lesson added to module:", lesson._id);

    res.status(201).json(lesson);
  } catch (err) {
    console.error("❌ Error adding lesson:", err);
    next(err);
  }
};

/**
 * 🟢 EXISTING: GET /api/lessons/:lessonId
 * Get lesson by ID (can be saved lesson or course lesson)
 */
exports.getLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    console.log("📖 Fetching lesson:", lessonId);

    const lesson = await Lesson.findById(lessonId)
      .populate({
        path: "module",
        select: "title course order",
        populate: {
          path: "course",
          select: "title",
        },
      })
      .lean();

    if (!lesson) {
      console.warn("❌ Lesson not found:", lessonId);
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    console.log("✅ Lesson retrieved:", {
      title: lesson.title,
      contentBlocks: lesson.content?.length || 0,
      isSaved: lesson.isSaved,
    });

    res.json(lesson);
  } catch (err) {
    console.error("❌ Error fetching lesson:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lesson",
      error: err.message,
    });
  }
};

/**
 * 🟢 EXISTING: DELETE /api/lessons/:lessonId
 * Delete lesson (both saved and course lessons)
 * Checks ownership for saved lessons
 */
exports.deleteLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user?.sub || req.auth?.payload?.sub;

    console.log("🗑️  Deleting lesson:", lessonId);

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // If it's a saved lesson, verify ownership
    if (lesson.isSaved && lesson.savedBy !== userId) {
      return res.status(403).json({
        message: "Not authorized to delete this lesson",
      });
    }

    // If it's a course lesson, verify user owns the course
    if (lesson.module) {
      const mod = await Module.findById(lesson.module).populate("course");
      if (mod?.course?.creator !== userId) {
        return res.status(403).json({
          message: "Not authorized to delete this lesson",
        });
      }
    }

    await Lesson.findByIdAndDelete(lessonId);

    // Remove from module if it exists
    if (lesson.module) {
      await Module.updateOne(
        { _id: lesson.module },
        { $pull: { lessons: lesson._id } }
      );
    }

    console.log("✅ Lesson deleted successfully");

    res.json({
      success: true,
      message: "Lesson deleted",
    });
  } catch (err) {
    console.error("❌ Error deleting lesson:", err);
    next(err);
  }
};

// Export all functions
module.exports = {
  saveLesson: exports.saveLesson,
  getUserSavedLessons: exports.getUserSavedLessons,
  addLesson: exports.addLesson,
  getLesson: exports.getLesson,
  deleteLesson: exports.deleteLesson,
};
