import React, { useState } from "react";
import { ChevronDown, BookOpen, Clock, Zap } from "lucide-react";
import { getLessonById } from "../utils/api";
import "./CoursePreview.css";

const CoursePreview = ({ course, onLessonSelect }) => {
  const [expandedModules, setExpandedModules] = useState({});
  const [loadingLessonId, setLoadingLessonId] = useState(null);

  if (!course) {
    console.warn("CoursePreview: No course prop received");
    return null;
  }

  const modules = Array.isArray(course.modules) ? course.modules : [];

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleLessonClick = async (lesson, module, lessonIdx, moduleIdx) => {
    const lessonId = lesson._id;
    
    console.log("=== LESSON CLICK ===");
    console.log("Lesson ID:", lessonId);
    console.log("Lesson title:", lesson.title);
    
    // Set loading state
    setLoadingLessonId(lessonId);

    try {
      console.log("Fetching lesson from API...");
      const freshLessonData = await getLessonById(lessonId);
      
      console.log("✅ Fetch successful");
      console.log("Fresh lesson:", freshLessonData);
      console.log("Content length:", freshLessonData.content?.length);
      console.log("Objectives length:", freshLessonData.objectives?.length);

      // Pass the fresh data
      if (onLessonSelect) {
        console.log("Calling onLessonSelect with fresh data");
        onLessonSelect({
          lesson: freshLessonData,
          module,
          lessonIdx,
          moduleIdx,
        });
      } else {
        console.error("onLessonSelect is not defined!");
      }
    } catch (err) {
      console.error("❌ Error fetching lesson:", err);
      console.log("Using fallback: original lesson object");
      
      if (onLessonSelect) {
        onLessonSelect({
          lesson,
          module,
          lessonIdx,
          moduleIdx,
        });
      }
    } finally {
      setLoadingLessonId(null);
    }
  };

  const totalLessons = modules.reduce(
    (sum, mod) => sum + (Array.isArray(mod.lessons) ? mod.lessons.length : 0),
    0
  );

  return (
    <div className="course-preview-container">
      {/* Course Header */}
      <div className="course-preview-header">
        <div className="course-header-content">
          <div className="course-badge">
            <Zap size={16} />
            AI-Generated Course
          </div>
          <h1 className="course-preview-title">{course.title}</h1>
          <p className="course-preview-description">{course.description}</p>

          {/* Course Stats */}
          <div className="course-stats">
            <div className="stat-item">
              <BookOpen size={18} />
              <span>{modules.length} Modules</span>
            </div>
            <div className="stat-item">
              <Clock size={18} />
              <span>{totalLessons} Lessons</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="course-modules-container">
        {modules && modules.length > 0 ? (
          <div className="modules-list">
            {modules.map((module, moduleIdx) => {
              const moduleId = module._id || `module-${moduleIdx}`;
              const lessons = Array.isArray(module.lessons) ? module.lessons : [];

              return (
                <div key={moduleId} className="module-card">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(moduleId)}
                    className="module-header-btn"
                  >
                    <div className="module-header-left">
                      <span className="module-number">
                        {String(moduleIdx + 1).padStart(2, "0")}
                      </span>
                      <div className="module-header-text">
                        <h3 className="module-title">{module.title}</h3>
                        <span className="module-lesson-count">
                          {lessons.length} lessons
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`module-chevron ${
                        expandedModules[moduleId] ? "expanded" : ""
                      }`}
                    />
                  </button>

                  {/* Lessons - Expandable */}
                  {expandedModules[moduleId] && (
                    <div className="lessons-container">
                      {lessons && lessons.length > 0 ? (
                        <ul className="lessons-list">
                          {lessons.map((lesson, lessonIdx) => {
                            const isLoading =
                              loadingLessonId === lesson._id;

                            return (
                              <li
                                key={lesson._id || `lesson-${lessonIdx}`}
                                className="lesson-item"
                              >
                                <button
                                  onClick={() => {
                                    console.log("Button clicked for lesson:", lesson.title);
                                    handleLessonClick(
                                      lesson,
                                      module,
                                      lessonIdx,
                                      moduleIdx
                                    );
                                  }}
                                  className={`lesson-button ${
                                    isLoading ? "loading" : ""
                                  }`}
                                  disabled={isLoading}
                                >
                                  <span className="lesson-index">
                                    {lessonIdx + 1}
                                  </span>
                                  <span className="lesson-title">
                                    {isLoading
                                      ? `Loading ${lesson.title}...`
                                      : lesson.title}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="no-lessons">
                          No lessons in this module
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-modules">
            <BookOpen size={40} />
            <p>No modules in this course</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePreview;


