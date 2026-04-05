// backend/models/Lesson.js - UPDATED

const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    objectives: {
      type: [String],
      default: [],
    },
    // 🔧 FIXED: Content can be array of mixed types
    content: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
      required: false,
    },
    // Module reference (for lessons inside a course)
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: false, // 🔧 NOT required for saved lessons
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    isEnriched: {
      type: Boolean,
      default: false,
    },

    // 🔧 NEW: For saved lessons
    savedBy: {
      type: String, // Auth0 user ID
      default: null,
      index: true, // Index for faster queries
    },

    isSaved: {
      type: Boolean,
      default: false,
    },

    // Store context about where lesson came from
    courseTitle: {
      type: String,
      default: null,
    },

    moduleName: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 🔍 Debug: Log when lesson is saved
lessonSchema.pre("save", function (next) {
  console.log("💾 Lesson being saved:", {
    title: this.title,
    module: this.module ? "in course module" : "saved lesson (no module)",
    contentBlocksCount: this.content?.length || 0,
    objectives: this.objectives?.length || 0,
    isSaved: this.isSaved,
  });

  if (this.content && this.content.length > 0) {
    console.log("📊 Content blocks breakdown:");
    this.content.forEach((block, idx) => {
      if (block.type === "mcq") {
        console.log(
          `  Block ${idx} (MCQ): question="${
            block.question?.substring(0, 30) || "(empty)"
          }..."`
        );
      } else if (block.type === "code") {
        console.log(`  Block ${idx} (CODE): ${block.code?.length || 0} chars`);
      } else {
        console.log(`  Block ${idx} (${block.type}): OK`);
      }
    });
  }

  next();
});

// 🔍 Debug: Log when lesson is found
lessonSchema.post("findOne", function (doc) {
  if (doc) {
    console.log("📖 Lesson loaded from DB:", {
      title: doc.title,
      contentBlocksCount: doc.content?.length || 0,
      isSaved: doc.isSaved,
    });
  }
});

const Lesson = mongoose.model("Lesson", lessonSchema);

module.exports = Lesson;
