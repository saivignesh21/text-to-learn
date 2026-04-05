// frontend/pages/Lesson.jsx - SIMPLIFIED

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import LessonRenderer from "../components/LessonRenderer";
import "./Lesson.css";

const LessonPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get lesson data from navigation state
  useEffect(() => {
    const state = location.state;
    
    if (state?.lesson) {
      console.log("📖 Viewing saved lesson:", state.lesson.title);
      setLesson(state.lesson);
    } else {
      console.warn("⚠️  No lesson data provided");
    }
    
    setLoading(false);
  }, [location]);

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Loading state
  if (loading) {
    return (
      <div className="lesson-page-container">
        <button onClick={handleBack} className="lesson-back-btn">
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="lesson-page-loading">
          <div className="spinner"></div>
          <p>Loading lesson...</p>
        </div>
      </div>
    );
  }

  // Error state - no lesson
  if (!lesson) {
    return (
      <div className="lesson-page-container">
        <button onClick={handleBack} className="lesson-back-btn">
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="lesson-page-error">
          <AlertCircle size={48} />
          <h2>Lesson Not Found</h2>
          <p>The lesson data couldn't be loaded. Please go back and try again.</p>
          <button onClick={handleBack} className="error-back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Success: Render the lesson
  return (
    <div className="lesson-page-container">
      <button onClick={handleBack} className="lesson-back-btn">
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <LessonRenderer
        lesson={lesson}
        module={{
          _id: "virtual",
          title: lesson.moduleName || "Module",
        }}
        course={{
          _id: "virtual",
          title: lesson.courseTitle || "Course",
        }}
        moduleIdx={0}
        lessonIdx={0}
        totalLessons={1}
        objectives={lesson.objectives || []}
        content={lesson.content || []}
      />
    </div>
  );
};

export default LessonPage;