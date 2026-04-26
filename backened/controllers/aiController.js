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
    const { topic, difficulty = "intermediate" } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        message: "Topic is required",
        error: "MISSING_TOPIC",
      });
    }

    console.log("\n🧠 ========== GENERATING COURSE ==========");
    console.log("📚 Topic:", topic, "| Difficulty:", difficulty);

    const data = await generateCourse(topic.trim(), difficulty);

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
            lessonTitle,
            mi,
            li,
            data.modules.length,
            m.lessons.length,
            difficulty
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
    const { courseTitle, moduleTitle, lessonTitle, difficulty = "intermediate" } = req.body;

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
    console.log("🎯 Difficulty:", difficulty);

    const lessonData = await generateLesson(
      courseTitle,
      moduleTitle,
      lessonTitle,
      0, 0, 4, 16,
      difficulty
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

/**
 * Context-Aware Study Buddy Chatbot
 * POST /api/ai/study-buddy
 */
async function studyBuddyHandler(req, res, next) {
  try {
    const { question, courseTitle, moduleTitle, lessonTitle, lessonContent, history = [], mode = "standard" } = req.body;

    if (!question || !lessonContent) {
      return res.status(400).json({
        message: "Question and lessonContent are required",
        error: "MISSING_FIELDS",
      });
    }

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let contentText = "";
    if (typeof lessonContent === "string") {
      contentText = lessonContent;
    } else if (Array.isArray(lessonContent)) {
      contentText = lessonContent.map(b => JSON.stringify(b)).join("\n");
    }
    
    // Truncate if too long to save context window (first ~15000 chars should be enough for a single lesson context)
    if (contentText.length > 15000) contentText = contentText.slice(0, 15000) + "...[truncated]";

    let systemPrompt = `You are a friendly, encouraging, and expert AI Study Buddy helping a student understand their course material. 
Explain things clearly using simple terms unless asked for advanced details. Use relatable analogies when helpful. Format your response in clean Markdown.

LESSON CONTEXT:
Course: ${courseTitle || 'Unknown'}
Module: ${moduleTitle || 'Unknown'}
Lesson: ${lessonTitle || 'Unknown'}
Content:
"""
${contentText}
"""

Instructions:
1. Focus your answers on helping the student understand the specific lesson context provided above.
2. If the user asks something completely unrelated to education or the topic, politely steer them back.
3. Be concise but thorough.`;

    if (mode === "socratic") {
      systemPrompt = `You are a Socratic AI Tutor helping a student understand their course material.
Instead of giving direct answers, you MUST use the Socratic method.
When the user asks a question, guide them to the answer by asking a thought-provoking, clarifying question.
Do NOT give away the final answer immediately. Lead them to it step by step.
Keep your responses extremely concise (1-2 sentences max) as they will be read aloud by a Voice Synthesizer.
Do not use Markdown formatting like ** or \` as it will be read aloud.

LESSON CONTEXT:
Course: ${courseTitle || 'Unknown'}
Module: ${moduleTitle || 'Unknown'}
Lesson: ${lessonTitle || 'Unknown'}
Content:
"""
${contentText}
"""`;
    }

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "I understand. I am ready to be a helpful study buddy based on this context!" }] },
        // Map previous history if any
        ...history.map(msg => ({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        }))
      ],
    });

    const result = await chat.sendMessage(question);
    const responseText = result.response.text();

    res.status(200).json({
      success: true,
      answer: responseText
    });
  } catch (err) {
    console.error("🔥 ERROR in studyBuddyHandler:", err);
    res.status(500).json({
      success: false,
      message: "Error processing study buddy request",
      error: err.message,
    });
  }
}

/**
 * Feynman Technique Simulator Handler
 * POST /api/ai/feynman
 */
async function feynmanHandler(req, res, next) {
  try {
    const { lessonTitle, lessonContent, userExplanation } = req.body;

    if (!lessonTitle || !lessonContent || !userExplanation) {
      return res.status(400).json({
        message: "lessonTitle, lessonContent, and userExplanation are required",
        error: "MISSING_FIELDS",
      });
    }

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const { feynmanPrompt } = require("../services/promptTemplates");
    const prompt = feynmanPrompt(lessonTitle, lessonContent, userExplanation);

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Clean up markdown fences if necessary
    if (text.startsWith("\`\`\`json")) {
      text = text.replace(/^\`\`\`json\s*/, "").replace(/\`\`\`\s*$/, "");
    } else if (text.startsWith("\`\`\`")) {
      text = text.replace(/^\`\`\`\s*/, "").replace(/\`\`\`\s*$/, "");
    }
    
    const parsedFeedback = JSON.parse(text);

    res.status(200).json({
      success: true,
      data: parsedFeedback
    });
  } catch (err) {
    console.error("🔥 ERROR in feynmanHandler:", err);
    res.status(500).json({
      success: false,
      message: "Error processing Feynman evaluation",
      error: err.message,
    });
  }
}

/**
 * Generate adaptive paths for Choose Your Own Adventure
 * POST /api/ai/generate-paths
 */
async function generatePathsHandler(req, res, next) {
  try {
    const { courseTitle, lessonTitle } = req.body;

    if (!courseTitle || !lessonTitle) {
      return res.status(400).json({
        message: "courseTitle and lessonTitle are required",
        error: "MISSING_FIELDS",
      });
    }

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const { adaptivePathsPrompt } = require("../services/promptTemplates");
    const prompt = adaptivePathsPrompt(courseTitle, lessonTitle);

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    if (text.startsWith("\`\`\`json")) {
      text = text.replace(/^\`\`\`json\s*/, "").replace(/\`\`\`\s*$/, "");
    } else if (text.startsWith("\`\`\`")) {
      text = text.replace(/^\`\`\`\s*/, "").replace(/\`\`\`\s*$/, "");
    }
    
    const parsedPaths = JSON.parse(text);

    res.status(200).json({
      success: true,
      data: parsedPaths
    });
  } catch (err) {
    console.error("🔥 ERROR in generatePathsHandler:", err);
    res.status(500).json({
      success: false,
      message: "Error generating adaptive paths",
      error: err.message,
    });
  }
}

/**
 * Generate cross-disciplinary connections between lessons
 * POST /api/ai/discover-connections
 */
async function discoverConnectionsHandler(req, res, next) {
  try {
    const { lessons } = req.body;

    if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
      return res.status(400).json({
        message: "lessons array is required",
        error: "MISSING_FIELDS",
      });
    }

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const { discoverConnectionsPrompt } = require("../services/promptTemplates");
    const prompt = discoverConnectionsPrompt(lessons);

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    if (text.startsWith("\`\`\`json")) {
      text = text.replace(/^\`\`\`json\s*/, "").replace(/\`\`\`\s*$/, "");
    } else if (text.startsWith("\`\`\`")) {
      text = text.replace(/^\`\`\`\s*/, "").replace(/\`\`\`\s*$/, "");
    }
    
    const parsedConnections = JSON.parse(text);

    res.status(200).json({
      success: true,
      data: parsedConnections
    });
  } catch (err) {
    console.error("🔥 ERROR in discoverConnectionsHandler:", err);
    res.status(500).json({
      success: false,
      message: "Error generating connections",
      error: err.message,
    });
  }
}

module.exports = {
  generateCourseHandler,
  generateLessonHandler,
  studyBuddyHandler,
  feynmanHandler,
  generatePathsHandler,
  discoverConnectionsHandler,
};
