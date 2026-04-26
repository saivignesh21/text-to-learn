// backend/controllers/quizController.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = "gemini-2.5-flash";

async function generateQuiz(req, res) {
  try {
    const { difficulty = "medium", count = 10 } = req.body;
    const textInput = req.body.text_input || "";
    const file = req.file;

    const numQuestions = Math.min(Math.max(parseInt(count) || 10, 5), 20);

    let promptParts = [];
    
    const basePrompt = `You are a quiz generator. Read the study material provided and create exactly ${numQuestions} multiple-choice questions at "${difficulty}" difficulty.

Return ONLY a raw JSON object (no markdown, no code fences) matching this exact schema:
{
  "title": "<short descriptive title based on the material>",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "<question text>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "answer": <0-based index of correct option>,
      "explanation": "<brief explanation of the correct answer>",
      "topic_tag": "<short topic label>"
    }
  ]
}

Rules:
- Exactly ${numQuestions} questions, all based strictly on the study material.
- Each question has exactly 4 options.
- "answer" is the 0-based index (0, 1, 2, or 3) of the correct option.
- Difficulty "${difficulty}": ${difficulty === "easy" ? "basic recall and definitions" : difficulty === "medium" ? "understanding concepts and application" : "analysis, edge cases, and synthesis"}.
- No markdown, no extra fields.`;

    if (file) {
      if (file.mimetype === "application/pdf") {
        promptParts = [
          basePrompt,
          {
            inlineData: {
              data: file.buffer.toString("base64"),
              mimeType: "application/pdf"
            }
          }
        ];
      } else {
        let studyText = file.buffer.toString("utf-8");
        if (studyText.length > 12000) studyText = studyText.slice(0, 12000) + "\n...[truncated]";
        promptParts = [
          basePrompt + `\n\nSTUDY MATERIAL:\n"""\n${studyText}\n"""`
        ];
      }
    } else if (textInput && textInput.trim().length >= 50) {
      let studyText = textInput.trim();
      if (studyText.length > 12000) studyText = studyText.slice(0, 12000) + "\n...[truncated]";
      promptParts = [
        basePrompt + `\n\nSTUDY MATERIAL:\n"""\n${studyText}\n"""`
      ];
    } else {
      return res.status(400).json({ success: false, message: "Please upload a file or paste at least 50 characters of text." });
    }

    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: "You are a quiz generator. Return ONLY valid raw JSON. No markdown, no code fences, no explanations.",
      generationConfig: { responseMimeType: "application/json", temperature: 0.65 },
    });

    const result = await model.generateContent(promptParts);
    const raw = result.response.text();
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let quizData;
    try {
      quizData = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ success: false, message: "AI returned malformed JSON. Please try again." });
    }

    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      return res.status(500).json({ success: false, message: "Quiz generation failed — no questions returned." });
    }

    quizData.questions = quizData.questions.map((q, i) => ({
      question: q.question || `Question ${i + 1}`,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      answer: typeof q.answer === "number" ? Math.min(Math.max(q.answer, 0), 3) : 0,
      explanation: q.explanation || "",
      topic_tag: q.topic_tag || "",
    }));

    return res.json({ success: true, quiz: { title: quizData.title || "Quiz", difficulty: quizData.difficulty || difficulty, questions: quizData.questions } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to generate quiz" });
  }
}

module.exports = { generateQuiz };