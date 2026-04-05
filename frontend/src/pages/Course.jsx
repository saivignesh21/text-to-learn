import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Zap,
  BookmarkPlus,
  Check,
} from "lucide-react";
import { saveCourse } from "../utils/api";
import CoursePreview from "../components/CoursePreview";
import LessonRenderer from "../components/LessonRenderer";
import "./Course.css";

const CoursePage = ({ course = null, onBack }) => {
  // 🔧 FIX: Use correct Auth0 hook
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleIdx, setModuleIdx] = useState(0);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [courseError, setCourseError] = useState(null);
  const [courseSaved, setCourseSaved] = useState(false);

  if (!course) {
    return (
      <div className="course-page-empty">
        <div className="empty-state">
          <BookOpen size={64} />
          <h2>No Course Selected</h2>
          <p>Select a course from the sidebar or generate a new one</p>
          <button onClick={onBack} className="back-to-home-btn">
            <ArrowLeft size={18} />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // 🔧 FIX: Handle save course with correct Auth0
  const handleSaveCourse = async () => {
    if (!isAuthenticated) {
      alert("Please login to save courses");
      return;
    }

    setIsSavingCourse(true);
    setCourseError(null);

    try {
      // 🔧 FIX: Get token using getAccessTokenSilently
      const token = await getAccessTokenSilently();

      console.log("💾 Saving course:", {
        title: course.title,
        modules: course.modules?.length || 0,
      });

      const courseData = {
        title: course.title,
        description: course.description || "",
        tags: course.tags || [],
        modules: course.modules || [],
      };

      const result = await saveCourse(courseData, token);
      console.log("✅ Course saved successfully:", result._id);
      setCourseSaved(true);
      setTimeout(() => setCourseSaved(false), 2000);
    } catch (err) {
      console.error("❌ Error saving course:", err);
      setCourseError(err.message || "Failed to save course");
      alert("Failed to save course: " + err.message);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleLessonSelect = (data) => {
    console.log("📖 Lesson selected:", {
      lesson: data.lesson.title,
      module: data.module.title,
      moduleIdx: data.moduleIdx,
      lessonIdx: data.lessonIdx,
    });

    setSelectedLesson(data.lesson);
    setSelectedModule(data.module);
    setModuleIdx(data.moduleIdx || 0);
    setLessonIdx(data.lessonIdx || 0);
  };

  const handleBackToCourse = () => {
    setSelectedLesson(null);
    setSelectedModule(null);
  };

  // 🔧 FIXED: Navigate to next lesson
  const handleNextLesson = () => {
    if (!selectedModule || !selectedLesson || !course) {
      console.warn("Missing data for next lesson");
      return;
    }

    console.log("📍 Current position:", {
      moduleIdx,
      lessonIdx,
      totalLessonsInModule: selectedModule.lessons?.length || 0,
      totalModules: course.modules?.length || 0,
    });

    // Check if there's a next lesson in current module
    if (lessonIdx < selectedModule.lessons.length - 1) {
      const nextLesson = selectedModule.lessons[lessonIdx + 1];
      console.log("➡️ Moving to next lesson in same module:", nextLesson.title);
      setSelectedLesson(nextLesson);
      setLessonIdx(lessonIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Check if there's a next module
    else if (moduleIdx < course.modules.length - 1) {
      const nextModule = course.modules[moduleIdx + 1];
      const firstLesson = nextModule.lessons?.[0];
      if (firstLesson) {
        console.log(
          "📚 Moving to first lesson in next module:",
          firstLesson.title
        );
        setSelectedModule(nextModule);
        setSelectedLesson(firstLesson);
        setModuleIdx(moduleIdx + 1);
        setLessonIdx(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      console.log("🎉 End of course reached");
      alert("🎉 You've reached the end of the course!");
    }
  };

  // 🔧 FIXED: Navigate to previous lesson
  const handlePreviousLesson = () => {
    if (!selectedModule || !selectedLesson || !course) {
      console.warn("Missing data for previous lesson");
      return;
    }

    console.log("📍 Current position:", {
      moduleIdx,
      lessonIdx,
    });

    // Check if there's a previous lesson in current module
    if (lessonIdx > 0) {
      const prevLesson = selectedModule.lessons[lessonIdx - 1];
      console.log("⬅️ Moving to previous lesson in same module:", prevLesson.title);
      setSelectedLesson(prevLesson);
      setLessonIdx(lessonIdx - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Check if there's a previous module
    else if (moduleIdx > 0) {
      const prevModule = course.modules[moduleIdx - 1];
      const lastLesson = prevModule.lessons?.[prevModule.lessons.length - 1];
      if (lastLesson) {
        console.log(
          "📚 Moving to last lesson in previous module:",
          lastLesson.title
        );
        setSelectedModule(prevModule);
        setSelectedLesson(lastLesson);
        setModuleIdx(moduleIdx - 1);
        setLessonIdx(prevModule.lessons.length - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      console.log("Already at first lesson");
    }
  };

  // Calculate total lessons in current module
  const getTotalLessonsInModule = () => {
    return selectedModule?.lessons?.length || 1;
  };

  // If lesson is selected, show lesson renderer
  if (selectedLesson) {
    return (
      <div className="course-page-container">
        <button onClick={handleBackToCourse} className="back-to-course-btn">
          <ArrowLeft size={18} />
          <span>Back to Course Overview</span>
        </button>

        <LessonRenderer
          lesson={selectedLesson}
          module={selectedModule}
          course={course}
          moduleIdx={moduleIdx}
          lessonIdx={lessonIdx}
          totalLessons={getTotalLessonsInModule()}
          onPrevious={handlePreviousLesson}
          onNext={handleNextLesson}
          objectives={selectedLesson.objectives || []}
          content={selectedLesson.content || []}
        />
      </div>
    );
  }

  // Otherwise show course preview
  return (
    <div className="course-page-container">
      <div className="course-page-header-bar">
        <div className="header-left">
          <button onClick={onBack} className="back-to-home-btn-small">
            <ArrowLeft size={18} />
            <span>Home</span>
          </button>

          {courseError && (
            <div className="course-error" style={{ marginLeft: "1rem" }}>
              ❌ {courseError}
            </div>
          )}
        </div>

        {/* 🔧 Save Course Button */}
        <button
          onClick={handleSaveCourse}
          disabled={isSavingCourse || courseSaved}
          className={`save-course-btn ${courseSaved ? "saved" : ""}`}
          title={
            isSavingCourse
              ? "Saving..."
              : courseSaved
              ? "Saved!"
              : "Save entire course"
          }
        >
          {courseSaved ? (
            <>
              <Check size={18} />
              <span>Saved</span>
            </>
          ) : (
            <>
              <BookmarkPlus size={18} />
              <span>{isSavingCourse ? "Saving..." : "Save Course"}</span>
            </>
          )}
        </button>

        <div className="course-page-stats">
          <div className="stat">
            <BookOpen size={16} />
            <span>{course.modules?.length || 0} Modules</span>
          </div>
          <div className="stat">
            <Clock size={16} />
            <span>
              {course.modules?.reduce(
                (sum, m) => sum + (m.lessons?.length || 0),
                0
              ) || 0}{" "}
              Lessons
            </span>
          </div>
          <div className="stat">
            <Zap size={16} />
            <span>AI Generated</span>
          </div>
        </div>
      </div>

      <CoursePreview course={course} onLessonSelect={handleLessonSelect} />
    </div>
  );
};

export default CoursePage;








