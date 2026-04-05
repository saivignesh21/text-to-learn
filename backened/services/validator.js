// backend/services/validator.js - COMPREHENSIVE VALIDATION & SANITIZATION

/**
 * Safe JSON parsing with error handling
 */
function safeJsonParse(text) {
  if (!text) throw new Error("Empty response from LLM");

  try {
    // Remove markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (error) {
    console.error("❌ JSON Parse Error:", error.message);
    console.error("Text received:", text.substring(0, 200));
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

/**
 * Sanitize and fix MCQ blocks - CRITICAL FIX
 */
function sanitizeMCQBlock(mcq, blockIndex) {
  const sanitized = {
    type: "mcq",
    question: "",
    options: [],
    answer: 0,
    explanation: "",
  };

  // 🔧 FIX: Handle question from various field names
  const question = mcq.question || mcq.query || mcq.text || "";
  sanitized.question = String(question).trim().substring(0, 500); // Limit length

  if (!sanitized.question) {
    console.warn(`⚠️  MCQ Block ${blockIndex}: Empty question`);
    return null; // REJECT invalid blocks
  }

  // 🔧 FIX: Ensure exactly 4 options
  const options = Array.isArray(mcq.options) ? mcq.options : [];
  sanitized.options = options
    .slice(0, 4) // Take max 4
    .map((opt) =>
      String(opt || "")
        .trim()
        .substring(0, 200)
    )
    .filter((opt) => opt.length > 0);

  // Pad with placeholder options if needed
  while (sanitized.options.length < 4) {
    sanitized.options.push(`Option ${sanitized.options.length + 1}`);
  }

  // 🔧 FIX: Validate answer index
  const answerIndex = Number(mcq.answer);
  if (Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex <= 3) {
    sanitized.answer = answerIndex;
  } else {
    console.warn(`⚠️  MCQ Block ${blockIndex}: Invalid answer index, using 0`);
    sanitized.answer = 0;
  }

  // 🔧 FIX: Handle explanation
  sanitized.explanation = String(mcq.explanation || "")
    .trim()
    .substring(0, 1000);

  if (!sanitized.explanation) {
    sanitized.explanation = `The correct answer is option ${String.fromCharCode(
      65 + sanitized.answer
    )}.`;
  }

  return sanitized;
}

/**
 * Sanitize and fix code blocks - CRITICAL FIX
 */
function sanitizeCodeBlock(codeBlock, blockIndex) {
  const sanitized = {
    type: "code",
    language: "javascript",
    code: "",
  };

  // 🔧 FIX: Handle language variations
  sanitized.language = String(
    codeBlock.language || codeBlock.lang || "javascript"
  )
    .toLowerCase()
    .trim();

  // 🔧 FIX: Get code from various field names
  let code = codeBlock.code || codeBlock.content || codeBlock.text || "";
  code = String(code).trim();

  // 🔧 FIX: Handle escaped newlines from JSON
  if (typeof code === "string") {
    code = code
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .replace(/\\\\/g, "\\");
  }

  sanitized.code = code.substring(0, 5000); // Limit to 5KB

  if (!sanitized.code || sanitized.code.trim().length === 0) {
    console.warn(`⚠️  Code Block ${blockIndex}: Empty code content`);
    return null; // REJECT invalid blocks
  }

  return sanitized;
}

/**
 * Sanitize content blocks
 */
function sanitizeContentBlock(block, blockIndex) {
  if (!block || !block.type) {
    console.warn(`⚠️  Block ${blockIndex}: Missing type`);
    return null;
  }

  const blockType = String(block.type).toLowerCase().trim();

  // Route to appropriate sanitizer
  if (blockType === "mcq") {
    return sanitizeMCQBlock(block, blockIndex);
  }

  if (blockType === "code") {
    return sanitizeCodeBlock(block, blockIndex);
  }

  if (blockType === "heading") {
    return {
      type: "heading",
      text: String(block.text || "")
        .trim()
        .substring(0, 200),
      level: Number(block.level) || 1,
    };
  }

  if (blockType === "paragraph") {
    return {
      type: "paragraph",
      text: String(block.text || "")
        .trim()
        .substring(0, 5000),
    };
  }

  if (blockType === "video") {
    return {
      type: "video",
      query: String(block.query || "")
        .trim()
        .substring(0, 200),
    };
  }

  console.warn(`⚠️  Block ${blockIndex}: Unknown type "${blockType}"`);
  return null;
}

/**
 * Sanitize entire lesson
 */
function sanitizeLesson(lesson) {
  if (!lesson || typeof lesson !== "object") {
    throw new Error("Invalid lesson object");
  }

  // Sanitize objectives
  const objectives = Array.isArray(lesson.objectives)
    ? lesson.objectives
        .map((obj) =>
          String(obj || "")
            .trim()
            .substring(0, 500)
        )
        .filter((obj) => obj.length > 0)
    : [];

  // Sanitize content blocks
  const contentBlocks = Array.isArray(lesson.content) ? lesson.content : [];
  const sanitizedContent = contentBlocks
    .map((block, idx) => sanitizeContentBlock(block, idx))
    .filter((block) => block !== null); // Remove invalid blocks

  // Validate minimum content
  if (sanitizedContent.length === 0) {
    console.warn("⚠️  Lesson has no valid content blocks");
  }

  const mcqCount = sanitizedContent.filter((b) => b.type === "mcq").length;
  const codeCount = sanitizedContent.filter((b) => b.type === "code").length;

  if (mcqCount === 0) {
    console.warn("⚠️  Lesson has no MCQ blocks");
  }
  if (codeCount === 0) {
    console.warn("⚠️  Lesson has no code blocks");
  }

  return {
    title: String(lesson.title || "Untitled")
      .trim()
      .substring(0, 200),
    objectives,
    content: sanitizedContent,
  };
}

/**
 * Validate course structure
 */
function validateCourse(course) {
  if (!course || typeof course !== "object") {
    console.error("❌ Course is not an object");
    return false;
  }

  if (!course.title || typeof course.title !== "string") {
    console.error("❌ Course missing valid title");
    return false;
  }

  if (!Array.isArray(course.modules)) {
    console.error("❌ Course.modules is not an array");
    return false;
  }

  return true;
}

/**
 * Validate lesson structure
 */
function validateLesson(lesson) {
  if (!lesson || typeof lesson !== "object") {
    console.error("❌ Lesson is not an object");
    return false;
  }

  if (!lesson.title || typeof lesson.title !== "string") {
    console.error("❌ Lesson missing valid title");
    return false;
  }

  if (!Array.isArray(lesson.objectives)) {
    console.error("❌ Lesson.objectives is not an array");
    return false;
  }

  if (!Array.isArray(lesson.content)) {
    console.error("❌ Lesson.content is not an array");
    return false;
  }

  return true;
}

module.exports = {
  safeJsonParse,
  sanitizeLesson,
  sanitizeContentBlock,
  sanitizeMCQBlock,
  sanitizeCodeBlock,
  validateCourse,
  validateLesson,
};
