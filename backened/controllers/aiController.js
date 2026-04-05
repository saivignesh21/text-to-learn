// backend/controllers/aiController.js - FIXED VERSION 2

const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const { generateCourse, generateLesson } = require("../services/aiService");
const {
  validateCourse,
  validateLesson,
  sanitizeLesson,
} = require("../services/validator");

/**
 * Generate a full course from a topic prompt
 * POST /api/ai/generate-course
 */
async function generateCourseHandler(req, res, next) {
  try {
    const { topic } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        message: "Topic is required",
        error: "MISSING_TOPIC",
      });
    }

    console.log("\n🧠 ========== GENERATING COURSE ==========");
    console.log("📚 Topic:", topic);

    const data = await generateCourse(topic.trim());

    if (!validateCourse(data)) {
      console.error("❌ Course validation failed");
      return res.status(422).json({
        message: "Failed to generate valid course structure",
        error: "INVALID_COURSE_JSON",
      });
    }

    const creatorSub = req.user?.sub || req.auth?.payload?.sub || "anonymous";

    const course = await Course.create({
      title: data.title || "Untitled Course",
      description: data.description || "AI-generated course",
      tags: data.tags || [],
      creator: creatorSub,
    });

    console.log("📚 Course created in DB:", course._id);

    // Generate modules concurrently
    const modulePromises = (data.modules || []).map(async (m, mi) => {
      const mod = await Module.create({
        title: m.title || `Module ${mi + 1}`,
        course: course._id,
        order: mi,
      });

      console.log(`📖 Module ${mi + 1} created:`, mod._id);

      // Generate lessons concurrently
      const lessonPromises = (m.lessons || []).map(async (lessonTitle, li) => {
        try {
          console.log(
            `  📝 Generating lesson ${li + 1}/${
              m.lessons.length
            }: "${lessonTitle}"`
          );

          const lessonData = await generateLesson(
            data.title,
            m.title,
            lessonTitle
          );

          if (!validateLesson(lessonData)) {
            console.warn(`  ⚠️  Lesson validation failed for "${lessonTitle}"`);
            throw new Error("Generated lesson failed validation");
          }

          // 🔧 CRITICAL: Sanitize before saving
          const sanitized = sanitizeLesson(lessonData);

          const blockStats = {
            total: sanitized.content?.length || 0,
            mcq: sanitized.content?.filter((b) => b.type === "mcq").length || 0,
            code:
              sanitized.content?.filter((b) => b.type === "code").length || 0,
            video:
              sanitized.content?.filter((b) => b.type === "video").length || 0,
          };

          console.log(
            `  ✅ Content validated [${blockStats.total}]:`,
            blockStats
          );

          // 🔧 CRITICAL FIX: Explicitly set content array
          const lessonPayload = {
            title: sanitized.title || lessonTitle,
            objectives: sanitized.objectives || [],
            content: sanitized.content || [], // 🔧 ENSURE THIS IS SET
            module: mod._id,
            order: li,
          };

          console.log(`  💾 Saving lesson with payload:`, {
            title: lessonPayload.title,
            contentBlocks: lessonPayload.content.length,
            mcqs: lessonPayload.content.filter((b) => b.type === "mcq").length,
            codes: lessonPayload.content.filter((b) => b.type === "code")
              .length,
          });

          // 🔧 Use Lesson.create() instead of insertMany() for better control
          const lesson = await Lesson.create(lessonPayload);

          // 🔧 Verify what was actually saved
          const saved = await Lesson.findById(lesson._id);
          const savedStats = {
            contentBlocks: saved.content?.length || 0,
            mcqs: saved.content?.filter((b) => b.type === "mcq").length || 0,
            codes: saved.content?.filter((b) => b.type === "code").length || 0,
          };

          console.log(`  ✅ Lesson saved to DB: ${lesson._id}`);
          console.log(`  📊 Verified save stats:`, savedStats);

          if (savedStats.contentBlocks === 0) {
            console.error(`  ❌ WARNING: Lesson saved but content is empty!`);
          }

          return lesson;
        } catch (lessonErr) {
          console.error(
            `  ❌ Error generating lesson "${lessonTitle}":`,
            lessonErr.message
          );

          // Fallback: create lesson with error message
          const fallbackLesson = await Lesson.create({
            title: lessonTitle,
            objectives: ["Error during generation"],
            content: [
              {
                type: "paragraph",
                text: `Error: ${lessonErr.message}. Please regenerate this lesson.`,
              },
            ],
            module: mod._id,
            order: li,
          });

          console.log(`  📝 Fallback lesson created: ${fallbackLesson._id}`);
          return fallbackLesson;
        }
      });

      const lessons = await Promise.all(lessonPromises);
      mod.lessons = lessons.map((l) => l._id);
      await mod.save();

      console.log(
        `📖 Module ${mi + 1} complete: ${lessons.length} lessons saved`
      );
      return mod;
    });

    const modules = await Promise.all(modulePromises);
    course.modules = modules.map((m) => m._id);
    await course.save();

    // Populate and return
    const populatedCourse = await Course.findById(course._id).populate({
      path: "modules",
      populate: { path: "lessons" },
    });

    console.log("\n✅ COURSE GENERATION COMPLETE");
    console.log("📊 Summary:");
    console.log("  - Course ID:", populatedCourse._id);
    console.log("  - Modules:", populatedCourse.modules.length);
    populatedCourse.modules.forEach((mod, idx) => {
      const totalBlocks = mod.lessons.reduce(
        (sum, lesson) => sum + (lesson.content?.length || 0),
        0
      );
      console.log(
        `    - Module ${idx + 1}: ${
          mod.lessons.length
        } lessons (${totalBlocks} content blocks)`
      );
    });
    console.log("==========================================\n");

    res.status(201).json({
      success: true,
      message: "Course generated successfully",
      data: populatedCourse,
    });
  } catch (err) {
    console.error("\n🔥 ERROR in generateCourseHandler:", err);
    console.error("==========================================\n");
    next(err);
  }
}

/**
 * Generate a single lesson
 * POST /api/ai/generate-lesson
 */
async function generateLessonHandler(req, res, next) {
  try {
    const { courseTitle, moduleTitle, lessonTitle } = req.body;

    if (!courseTitle || !moduleTitle || !lessonTitle) {
      return res.status(400).json({
        message: "courseTitle, moduleTitle, and lessonTitle are required",
        error: "MISSING_FIELDS",
      });
    }

    console.log("\n🧠 ========== GENERATING LESSON ==========");
    console.log("📚 Course:", courseTitle);
    console.log("📖 Module:", moduleTitle);
    console.log("📝 Lesson:", lessonTitle);

    const lessonData = await generateLesson(
      courseTitle,
      moduleTitle,
      lessonTitle
    );

    if (!validateLesson(lessonData)) {
      console.error("❌ Lesson validation failed");
      return res.status(422).json({
        message: "Failed to generate valid lesson",
        error: "INVALID_LESSON_JSON",
      });
    }

    const sanitized = sanitizeLesson(lessonData);

    const blockStats = {
      mcq: sanitized.content.filter((b) => b.type === "mcq").length,
      code: sanitized.content.filter((b) => b.type === "code").length,
      video: sanitized.content.filter((b) => b.type === "video").length,
      total: sanitized.content.length,
    };

    console.log("✅ LESSON GENERATION COMPLETE");
    console.log("📊 Content blocks:", blockStats);
    console.log("==========================================\n");

    res.status(201).json({
      success: true,
      message: "Lesson generated successfully",
      data: sanitized,
      blockStats,
    });
  } catch (err) {
    console.error("\n🔥 ERROR in generateLessonHandler:", err);
    console.error("==========================================\n");
    res.status(500).json({
      success: false,
      message: "Error generating lesson",
      error: err.message,
    });
  }
}

module.exports = {
  generateCourseHandler,
  generateLessonHandler,
};
