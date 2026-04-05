// backend/routes/debugRoutes.js - FIXED WITH CORRECT IMPORTS

const express = require("express");
const router = express.Router();
const Lesson = require("../models/Lesson"); // ✅ Capital L
const Course = require("../models/Course"); // ✅ Capital C
const Module = require("../models/Module"); // ✅ Capital M

// ==================== EXISTING ENDPOINTS ====================

/**
 * GET /api/debug/lesson/:lessonId
 * Check what's actually in the database
 */
router.get("/lesson/:lessonId", async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const analysis = {
      title: lesson.title,
      isSaved: lesson.isSaved,
      savedBy: lesson.savedBy,
      courseTitle: lesson.courseTitle,
      moduleName: lesson.moduleName,
      objectivesCount: lesson.objectives?.length || 0,
      contentBlocksCount: lesson.content?.length || 0,
      contentBlocks: lesson.content?.map((block, idx) => ({
        index: idx,
        type: block.type,
        hasData: {
          question: !!block.question,
          questionLength: block.question?.length || 0,
          options: block.options?.length || 0,
          code: !!block.code,
          codeLength: block.code?.length || 0,
          text: !!block.text,
          textLength: block.text?.length || 0,
        },
        preview:
          block.question?.substring(0, 50) ||
          block.code?.substring(0, 50) ||
          block.text?.substring(0, 50) ||
          "(empty)",
      })),
    };

    res.json(analysis);
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/debug/course/:courseId
 * Check course structure with all modules and lessons
 */
router.get("/course/:courseId", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const analysis = {
      courseTitle: course.title,
      courseId: course._id,
      description: course.description,
      tags: course.tags,
      creator: course.creator,
      modulesCount: course.modules?.length || 0,
      modules:
        course.modules?.map((mod) => ({
          title: mod.title,
          description: mod.description,
          lessonsCount: mod.lessons?.length || 0,
          lessons:
            mod.lessons?.map((lesson) => ({
              title: lesson.title,
              objectivesCount: lesson.objectives?.length || 0,
              contentBlocks: lesson.content?.length || 0,
              mcqs: lesson.content?.filter((b) => b.type === "mcq").length || 0,
              codes:
                lesson.content?.filter((b) => b.type === "code").length || 0,
              firstBlockType: lesson.content?.[0]?.type || "none",
            })) || [],
        })) || [],
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    res.json(analysis);
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/debug/lesson/:lessonId/raw
 * Get raw JSON for debugging
 */
router.get("/lesson/:lessonId/raw", async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.json({
      title: lesson.title,
      objectives: lesson.objectives,
      content: lesson.content,
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEBUGGING SAVED ITEMS ====================

/**
 * 🔧 NEW: GET /api/debug/saved-lessons
 * List all SAVED lessons in database (not module lessons)
 */
router.get("/saved-lessons", async (req, res) => {
  try {
    const savedLessons = await Lesson.find({ isSaved: true }).limit(20);

    const analysis = {
      totalSavedLessons: await Lesson.countDocuments({ isSaved: true }),
      sampleSize: savedLessons.length,
      samples: savedLessons.map((lesson) => ({
        _id: lesson._id,
        title: lesson.title,
        savedBy: lesson.savedBy,
        courseTitle: lesson.courseTitle,
        moduleName: lesson.moduleName,
        objectivesCount: lesson.objectives?.length || 0,
        contentBlocksCount: lesson.content?.length || 0,
        createdAt: lesson.createdAt,
      })),
    };

    res.json(analysis);
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔧 NEW: GET /api/debug/saved-lessons/:userId
 * Get all SAVED lessons by specific user
 */
router.get("/saved-lessons/by-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("🔍 Fetching saved lessons for user:", userId);

    const savedLessons = await Lesson.find({
      savedBy: userId,
      isSaved: true,
    }).sort({ createdAt: -1 });

    const analysis = {
      userId,
      count: savedLessons.length,
      lessons: savedLessons.map((lesson) => ({
        _id: lesson._id,
        title: lesson.title,
        courseTitle: lesson.courseTitle,
        moduleName: lesson.moduleName,
        objectivesCount: lesson.objectives?.length || 0,
        contentBlocksCount: lesson.content?.length || 0,
        createdAt: lesson.createdAt,
      })),
    };

    res.json(analysis);
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔧 NEW: GET /api/debug/saved-courses
 * List all SAVED courses in database
 */
router.get("/saved-courses", async (req, res) => {
  try {
    const courses = await Course.find().limit(20);

    const analysis = {
      totalSavedCourses: await Course.countDocuments(),
      sampleSize: courses.length,
      samples: courses.map((course) => ({
        _id: course._id,
        title: course.title,
        creator: course.creator,
        modulesCount: course.modules?.length || 0,
        totalLessons:
          course.modules?.reduce(
            (sum, m) => sum + (m.lessons?.length || 0),
            0
          ) || 0,
        tags: course.tags || [],
        createdAt: course.createdAt,
      })),
    };

    res.json(analysis);
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔧 NEW: GET /api/debug/saved-courses/:userId
 * Get all courses saved by specific user
 */
router.get("/saved-courses/by-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("🔍 Fetching saved courses for user:", userId);

    const courses = await Course.find({ creator: userId }).sort({
      createdAt: -1,
    });

    const analysis = {
      userId,
      count: courses.length,
      courses: courses.map((course) => ({
        _id: course._id,
        title: course.title,
        description: course.description,
        modulesCount: course.modules?.length || 0,
        totalLessons:
          course.modules?.reduce(
            (sum, m) => sum + (m.lessons?.length || 0),
            0
          ) || 0,
        tags: course.tags || [],
        createdAt: course.createdAt,
      })),
    };

    res.json(analysis);
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔧 NEW: GET /api/debug/saved-lessons/:lessonId
 * Get details of a specific saved lesson
 */
router.get("/saved-lesson-detail/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const analysis = {
      _id: lesson._id,
      title: lesson.title,
      isSaved: lesson.isSaved,
      savedBy: lesson.savedBy,
      courseTitle: lesson.courseTitle,
      moduleName: lesson.moduleName,
      objectivesCount: lesson.objectives?.length || 0,
      objectives: lesson.objectives,
      contentBlocksCount: lesson.content?.length || 0,
      contentBlocks: lesson.content?.map((block, idx) => ({
        index: idx,
        type: block.type,
      })),
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };

    res.json(analysis);
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔧 NEW: GET /api/debug/saved-courses/:courseId/full
 * Get complete course structure with all nested data
 */
router.get("/saved-course-detail/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const analysis = {
      _id: course._id,
      title: course.title,
      description: course.description,
      creator: course.creator,
      tags: course.tags,
      modulesCount: course.modules?.length || 0,
      modules: course.modules?.map((mod) => ({
        title: mod.title,
        lessonsCount: mod.lessons?.length || 0,
        lessons: mod.lessons?.map((lesson) => ({
          title: lesson.title,
          objectivesCount: lesson.objectives?.length || 0,
          contentBlocksCount: lesson.content?.length || 0,
        })),
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    res.json(analysis);
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== COURSE DEBUGGING ====================

/**
 * GET /api/debug/courses
 * List all courses in database (admin/debug only)
 */
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find().limit(10);

    const analysis = {
      totalCount: await Course.countDocuments(),
      sampleSize: courses.length,
      samples: courses.map((course) => ({
        _id: course._id,
        title: course.title,
        creator: course.creator,
        modulesCount: course.modules?.length || 0,
        totalLessons:
          course.modules?.reduce(
            (sum, m) => sum + (m.lessons?.length || 0),
            0
          ) || 0,
        tags: course.tags || [],
        createdAt: course.createdAt,
      })),
    };

    res.json(analysis);
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/debug/course/:courseId/full
 * Get complete course structure with all nested data
 */
router.get("/course/:courseId/full", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({
      _id: course._id,
      title: course.title,
      description: course.description,
      creator: course.creator,
      tags: course.tags,
      modules: course.modules,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/debug/test-course
 * Test creating a complete course with modules and lessons
 */
router.post("/test-course", async (req, res) => {
  try {
    const testCourse = new Course({
      title: "Test Course: Web Development Basics",
      description: "A test course to verify the course schema structure",
      creator: "test-user-" + Date.now(),
      tags: ["web", "development", "test"],
      modules: [
        {
          title: "Module 1: HTML Basics",
          description: "Learn the fundamentals of HTML",
          lessons: [
            {
              title: "What is HTML?",
              objectives: ["Understand HTML purpose", "Learn basic tags"],
              content: [
                {
                  type: "heading",
                  text: "What is HTML?",
                },
                {
                  type: "paragraph",
                  text: "HTML is the standard markup language for creating web pages.",
                },
                {
                  type: "code",
                  language: "html",
                  code: "<h1>Hello World</h1>",
                },
                {
                  type: "mcq",
                  question: "What does HTML stand for?",
                  options: [
                    "Hyper Text Markup Language",
                    "High Tech Modern Language",
                    "Home Tool Markup Language",
                  ],
                  answer: 0,
                },
              ],
              isEnriched: false,
            },
          ],
        },
      ],
    });

    const saved = await testCourse.save();

    res.status(201).json({
      success: true,
      message: "Test course created successfully",
      course: saved,
      debugUrl: `/api/debug/saved-course-detail/${saved._id}`,
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

/**
 * DELETE /api/debug/course/:courseId
 * Delete a test course (for cleanup)
 */
router.delete("/course/:courseId", async (req, res) => {
  try {
    const deleted = await Course.findByIdAndDelete(req.params.courseId);

    if (!deleted) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json({
      success: true,
      message: "Test course deleted",
      deletedId: req.params.courseId,
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/debug/health
 * Quick health check for debug endpoints and database connection
 */
router.get("/health", async (req, res) => {
  try {
    const coursesCount = await Course.countDocuments();
    const lessonsCount = await Lesson.countDocuments();
    const savedLessonsCount = await Lesson.countDocuments({ isSaved: true });
    const savedCoursesCount = await Course.countDocuments();
    const modulesCount = await Module.countDocuments();

    res.json({
      status: "healthy",
      database: {
        total_courses: coursesCount,
        total_lessons: lessonsCount,
        saved_lessons: savedLessonsCount,
        saved_courses: savedCoursesCount,
        modules: modulesCount,
      },
      endpoints: {
        health: "GET /api/debug/health",

        // Saved Items Endpoints
        all_saved_lessons: "GET /api/debug/saved-lessons",
        saved_lessons_by_user: "GET /api/debug/saved-lessons/by-user/:userId",
        saved_lesson_detail: "GET /api/debug/saved-lesson-detail/:lessonId",
        all_saved_courses: "GET /api/debug/saved-courses",
        saved_courses_by_user: "GET /api/debug/saved-courses/by-user/:userId",
        saved_course_detail: "GET /api/debug/saved-course-detail/:courseId",

        // Other Endpoints
        allCourses: "GET /api/debug/courses",
        courseStructure: "GET /api/debug/course/:courseId",
        courseFullData: "GET /api/debug/course/:courseId/full",
        lessonDetails: "GET /api/debug/lesson/:lessonId",
        lessonRaw: "GET /api/debug/lesson/:lessonId/raw",
        testCourse: "POST /api/debug/test-course",
        deleteCourse: "DELETE /api/debug/course/:courseId",
      },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
});

module.exports = router;
