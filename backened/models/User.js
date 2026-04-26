const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    auth0Sub: { type: String, required: true, unique: true }, // Auth0 `sub`
    email: { type: String, index: true },
    name: String,
    picture: String,
    createdAt: { type: Date, default: Date.now },
    // Optionally keep list of created courses for quick lookups (denormalized)
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    // Gamification & Study Streaks
    xp: { type: Number, default: 0 },
    streakCount: { type: Number, default: 0 },
    lastStudyDate: { type: Date, default: null },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
  },
  { timestamps: true }
);

// No need for a separate index — `unique: true` already handles it

module.exports = mongoose.model("User", userSchema);
