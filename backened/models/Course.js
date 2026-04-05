const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    creator: { type: String, required: true }, // Auth0 sub
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }],
    tags: [{ type: String, trim: true }],
    published: { type: Boolean, default: false }, // optional workflow flag
    coverImage: { type: String }, // url or static path
  },
  { timestamps: true }
);

// Virtual for module count (not stored)
courseSchema.virtual("moduleCount").get(function () {
  return this.modules ? this.modules.length : 0;
});

// When a course is removed, remove contained modules & lessons (cascade)
courseSchema.pre("remove", async function (next) {
  const Module = mongoose.model("Module");
  // Remove each module (module pre remove will remove lessons)
  await Module.deleteMany({ course: this._id });
  next();
});

// Check if model already exists to prevent OverwriteModelError during hot reload
module.exports =
  mongoose.models.Course || mongoose.model("Course", courseSchema);
