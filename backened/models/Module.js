const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
    order: { type: Number, default: 0 }, // helpful for ordering modules
  },
  { timestamps: true }
);

// When module removed, delete its lessons
moduleSchema.pre("remove", async function (next) {
  const Lesson = mongoose.model("Lesson");
  await Lesson.deleteMany({ module: this._id });
  // Also remove reference from course.modules
  const Course = mongoose.model("Course");
  await Course.updateOne(
    { _id: this.course },
    { $pull: { modules: this._id } }
  );
  next();
});

module.exports = mongoose.model("Module", moduleSchema);
