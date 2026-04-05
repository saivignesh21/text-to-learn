const Module = require("../models/Module");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");

/**
 * Add a module to a course
 */
exports.addModule = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description = "" } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Module title required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const mod = new Module({
      title,
      description,
      course: course._id,
      order: course.modules.length,
    });

    await mod.save();

    course.modules.push(mod._id);
    await course.save();

    res.status(201).json(mod);
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Delete a module (fixed for Mongoose v7+)
 */
exports.deleteModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const mod = await Module.findById(moduleId);
    if (!mod) {
      return res.status(404).json({ message: "Module not found" });
    }

    // ✅ Step 1: Delete all lessons inside this module
    await Lesson.deleteMany({ module: mod._id });

    // ✅ Step 2: Remove module reference from its parent course
    await Course.updateOne(
      { _id: mod.course },
      { $pull: { modules: mod._id } }
    );

    // ✅ Step 3: Delete the module itself
    await Module.deleteOne({ _id: mod._id });

    res.json({ message: "Module and its lessons deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all modules for a specific course
 */
exports.getModulesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const modules = await Module.find({ course: courseId })
      .sort("order")
      .lean();
    res.json(modules);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all lessons for a specific module
 */
exports.getLessonsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const lessons = await Lesson.find({ module: moduleId })
      .sort("order")
      .lean();
    res.json(lessons);
  } catch (err) {
    next(err);
  }
};
