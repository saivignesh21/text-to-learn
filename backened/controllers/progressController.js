const User = require("../models/User");

// Helper to determine if date is yesterday
const isYesterday = (date) => {
  if (!date) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
};

// Helper to determine if date is today
const isToday = (date) => {
  if (!date) return false;
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Mark lesson as complete and update gamification stats
 */
exports.markLessonComplete = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const auth0Sub = req.user.sub; // From authMiddleware

    let user = await User.findOne({ auth0Sub });
    if (!user) {
      // Create user if not exists
      user = new User({ auth0Sub });
    }

    const XP_PER_LESSON = 50;
    let xpGained = XP_PER_LESSON;
    let newStreak = user.streakCount || 0;

    // Check streak
    if (!isToday(user.lastStudyDate)) {
      if (isYesterday(user.lastStudyDate)) {
        // Continue streak
        newStreak += 1;
        xpGained += 20; // Bonus for streak
      } else if (!user.lastStudyDate) {
        // First time
        newStreak = 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      user.streakCount = newStreak;
      user.lastStudyDate = new Date();
    }

    user.xp = (user.xp || 0) + xpGained;

    if (!user.completedLessons.includes(lessonId)) {
      user.completedLessons.push(lessonId);
    }

    await user.save();

    res.json({
      success: true,
      xpGained,
      totalXp: user.xp,
      streakCount: user.streakCount,
      message: `Lesson completed! You earned ${xpGained} XP.`
    });
  } catch (error) {
    console.error("Error marking lesson complete:", error);
    res.status(500).json({ success: false, message: "Failed to update progress" });
  }
};

/**
 * Get user progress and gamification stats
 */
exports.getUserProgress = async (req, res) => {
  try {
    const auth0Sub = req.user.sub;

    let user = await User.findOne({ auth0Sub });
    if (!user) {
      user = new User({ auth0Sub });
      await user.save();
    }

    // Determine current level based on XP
    const calculateLevel = (xp) => Math.floor(Math.sqrt(xp / 100)) + 1;
    const level = calculateLevel(user.xp || 0);
    const nextLevelXp = Math.pow(level, 2) * 100;

    res.json({
      success: true,
      data: {
        xp: user.xp || 0,
        level,
        nextLevelXp,
        streakCount: user.streakCount || 0,
        lastStudyDate: user.lastStudyDate,
        completedLessonsCount: user.completedLessons?.length || 0,
      }
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ success: false, message: "Failed to fetch progress" });
  }
};
