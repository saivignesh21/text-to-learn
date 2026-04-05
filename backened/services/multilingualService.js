// backend/services/multilingualService.js - OPENAI VERSION

const { OpenAI } = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn(
    "⚠️  OPENAI_API_KEY not configured. Translation will be unavailable."
  );
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/**
 * Translate English text to Hinglish (Hindi-English mix) using OpenAI
 * @param {string} text - English text to translate
 * @returns {Promise<string>} Hinglish translation
 */
async function translateToHinglish(text) {
  try {
    if (!OPENAI_API_KEY) {
      console.warn("OpenAI API key not available, returning original text");
      return text;
    }

    console.log("🌐 Translating to Hinglish using OpenAI...");

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Fast and affordable
      messages: [
        {
          role: "system",
          content: `You are a Hinglish translator. Your task is to convert English text to Hinglish (a natural mix of Hindi and English).

Important rules:
1. Use Hindi grammar and sentence structure where it sounds natural
2. Mix English technical terms with Hindi explanations
3. Make it sound conversational, like how Indians naturally speak
4. Do NOT translate code snippets - keep them in English
5. Keep numbers, special characters, and technical terms unchanged
6. Preserve formatting and structure
7. Make it easy to understand for Indian students with Hindi background

Example:
English: "React is a JavaScript library for building user interfaces"
Hinglish: "React ek JavaScript library hai jo user interfaces banane ke liye use hota hai"

Respond with ONLY the Hinglish translation. Do NOT include any explanations or extra text.`,
        },
        {
          role: "user",
          content: `Please translate the following text to Hinglish:\n\n${text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const hinglishText = response.choices[0].message.content.trim();

    console.log("✅ OpenAI Hinglish translation completed");
    return hinglishText;
  } catch (error) {
    console.error("🔥 OpenAI Translation Error:", error.message);
    return text; // Return original text on error
  }
}

/**
 * Generate audio from text using browser API or external service
 * Note: For production, you might want to use Google Cloud TTS or similar
 * @param {string} text - Text to convert to audio
 * @param {string} language - Language code (e.g., 'hi-IN' for Hindi)
 * @returns {Promise<Buffer>} Audio buffer (null if unavailable)
 */
async function generateAudio(text, language = "hi-IN") {
  try {
    console.log(`🎙️  Audio generation requested for language: ${language}`);

    // NOTE: Full TTS implementation requires additional setup
    // For now, we'll return null and let the frontend handle it
    // The frontend can use browser's Web Speech API or a lightweight TTS service

    console.warn(
      "🎙️  TTS not configured. Suggest using browser Web Speech API."
    );
    return null;
  } catch (error) {
    console.error("🔥 Audio Generation Error:", error.message);
    return null;
  }
}

/**
 * Create a Hinglish lesson explanation
 * @param {string} lessonTitle - Title of the lesson
 * @param {string} lessonContent - Content of the lesson
 * @param {boolean} generateAudioFlag - Whether to generate audio
 * @returns {Promise<Object>} Object with hinglishText and optional audio
 */
async function createMultilingualLesson(
  lessonTitle,
  lessonContent,
  generateAudioFlag = false
) {
  try {
    console.log(`📚 Creating multilingual lesson: "${lessonTitle}"`);

    // Extract text from lesson content (if it's an array of blocks)
    let textToTranslate = lessonContent;
    if (Array.isArray(lessonContent)) {
      textToTranslate = lessonContent
        .filter((block) => ["paragraph", "heading"].includes(block.type))
        .map((block) => `${block.text || block.title}`)
        .join("\n\n")
        .substring(0, 2000); // Limit to first 2000 chars for translation
    }

    // Translate to Hinglish
    const hinglishText = await translateToHinglish(
      `${lessonTitle}\n\n${textToTranslate}`
    );

    // Generate audio if requested (currently returns null)
    let audioBuffer = null;
    if (generateAudioFlag) {
      audioBuffer = await generateAudio(hinglishText, "hi-IN");
    }

    return {
      lessonTitle,
      hinglishText,
      audioBuffer,
      audioUrl: audioBuffer ? `/api/audio/${Date.now()}.mp3` : null,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("🔥 Error creating multilingual lesson:", error.message);
    throw error;
  }
}

/**
 * Batch translate multiple lesson texts
 * @param {Array} lessons - Array of lesson objects with title and content
 * @returns {Promise<Array>} Array of lessons with hinglishText
 */
async function batchTranslate(lessons) {
  try {
    console.log(`🌐 Batch translating ${lessons.length} lessons...`);

    const translations = await Promise.all(
      lessons.map(async (lesson) => {
        const hinglish = await translateToHinglish(lesson.content);
        return {
          ...lesson,
          hinglishText: hinglish,
        };
      })
    );

    console.log("✅ Batch translation completed");
    return translations;
  } catch (error) {
    console.error("🔥 Batch translation error:", error.message);
    throw error;
  }
}

module.exports = {
  translateToHinglish,
  generateAudio,
  createMultilingualLesson,
  batchTranslate,
};
