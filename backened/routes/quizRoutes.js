const express = require("express");
const router = express.Router();
const multer = require("multer");
const { generateQuiz } = require("../controllers/quizController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (["pdf", "txt", "md"].includes(ext)) cb(null, true);
    else cb(new Error("Only PDF, TXT, and MD files are allowed"));
  },
});

router.post("/generate", upload.single("file"), async (req, res, next) => {
  await generateQuiz(req, res, next);
});

module.exports = router;