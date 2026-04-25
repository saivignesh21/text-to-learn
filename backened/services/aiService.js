// backend/services/aiService.js - UPDATED WITH CONTEXT

require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  generateCoursePrompt,
  generateLessonPrompt,
} = require("./promptTemplates");
const {
  safeJsonParse,
  sanitizeLesson,
  validateCourse,
  validateLesson,
} = require("./validator");

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY missing in .env");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = "gemini-2.5-flash";
const SYSTEM_INSTRUCTION =
  "You are a specialized course generator and expert educator. Your responses MUST be valid, unadorned JSON that strictly adheres to the requested schema. Do not include any surrounding text, markdown, code fences, or explanations. Return ONLY the raw JSON object.";

/**
 * Calls the Gemini API with a single prompt
 */
async function callLLM(prompt) {
  console.log("🧠 Calling Gemini API...");
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log(
      "✅ Gemini response received (length: " + (text ? text.length : 0) + ")"
    );
    return text;
  } catch (error) {
    console.error("🔥 Gemini Error:", error.message);
    throw error;
  }
}

/**
 * Generate a complete course structure
 */
exports.generateCourse = async (topic) => {
  try {
    console.log("📚 Generating course for topic:", topic);
    const prompt = generateCoursePrompt(topic);
    const raw = await callLLM(prompt);
    const parsed = safeJsonParse(raw);

    if (!validateCourse(parsed)) {
      throw new Error("Invalid course structure from LLM");
    }

    console.log("✅ Course generated successfully:", {
      title: parsed.title,
      modulesCount: parsed.modules.length,
    });

    return parsed;
  } catch (error) {
    console.error("❌ Error generating course:", error.message);
    throw error;
  }
};

/**
 * Generate detailed lesson content with context awareness
 * Now accepts moduleIndex, lessonIndex, and course structure info
 */
exports.generateLesson = async (
  courseTitle,
  moduleTitle,
  lessonTitle,
  moduleIndex = 0,
  lessonIndex = 0,
  totalModules = 4,
  totalLessons = 16
) => {
  try {
    console.log(
      `📝 Generating lesson: "${lessonTitle}" (Module ${
        moduleIndex + 1
      }/${totalModules}, Lesson ${lessonIndex + 1}/${totalLessons})`
    );

    // Generate prompt with full context
    const prompt = generateLessonPrompt(
      courseTitle,
      moduleTitle,
      lessonTitle,
      moduleIndex,
      lessonIndex,
      totalModules,
      totalLessons
    );

    const raw = await callLLM(prompt);

    console.log(
      "📋 Raw LLM response (first 300 chars):",
      raw.substring(0, 300)
    );

    const parsed = safeJsonParse(raw);
    console.log("✅ JSON parsed successfully");

    if (!validateLesson(parsed)) {
      throw new Error("Invalid lesson structure from LLM");
    }

    console.log("✅ Basic validation passed");

    // Sanitize and fix
    console.log("🧹 Sanitizing lesson content...");
    const sanitized = sanitizeLesson(parsed);
    console.log("✅ Lesson sanitized successfully");

    // Stats and reporting
    const stats = {
      total: sanitized.content.length,
      mcq: sanitized.content.filter((b) => b.type === "mcq").length,
      code: sanitized.content.filter((b) => b.type === "code").length,
      video: sanitized.content.filter((b) => b.type === "video").length,
      heading: sanitized.content.filter((b) => b.type === "heading").length,
      paragraph: sanitized.content.filter((b) => b.type === "paragraph").length,
      depth: sanitized.depth || "unknown",
    };

    console.log("📊 Lesson content stats:", stats);

    // Log first MCQ
    const firstMCQ = sanitized.content.find((b) => b.type === "mcq");
    if (firstMCQ) {
      console.log("✅ First MCQ block:", {
        question: firstMCQ.question.substring(0, 50) + "...",
        optionsCount: firstMCQ.options.length,
        answer: firstMCQ.answer,
      });
    }

    // Log first code block
    const firstCode = sanitized.content.find((b) => b.type === "code");
    if (firstCode) {
      console.log("✅ First code block:", {
        language: firstCode.language,
        codeLength: firstCode.code.length,
        preview: firstCode.code.substring(0, 50) + "...",
      });
    }

    return sanitized;
  } catch (error) {
    console.error("❌ Error generating lesson:", error.message);
    console.error("Stack:", error.stack);
    throw error;
  }
};

module.exports.callLLM = callLLM;