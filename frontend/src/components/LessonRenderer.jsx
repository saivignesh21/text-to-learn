import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  Share2,
  ArrowUp,
  Check,
} from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  saveLessonWithContext,
  markLessonComplete,
} from "../utils/api";

// Import all block components
import HeadingBlock from "./blocks/HeadingBlock";
import ParagraphBlock from "./blocks/ParagraphBlock";
import CodeBlock from "./blocks/CodeBlock";
import VideoBlock from "./blocks/VideoBlock";
import MCQBlock from "./blocks/MCQBlock";

import HinglishTranslator from "./HinglishTranslator";
import PDFExporter from "./PDFExporter";

import "./LessonRenderer.css";

const blockMap = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  code: CodeBlock,
  video: VideoBlock,
  mcq: MCQBlock,
};

const LessonRenderer = ({
  lesson,
  module,
  course,
  moduleIdx = 0,
  lessonIdx = 0,
  totalLessons = 1,
  onPrevious,
  onNext,
  objectives = [],
  content = [],
  onLessonSaved = () => {},
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const containerRef = useRef(null);
  const prevLessonIdRef = useRef(null);
  
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  // Use lesson prop first, fallback to component props
  const lessonData = useMemo(() => lesson || {}, [lesson]);
  const lessonObjectives = useMemo(
    () => lessonData.objectives || objectives,
    [lessonData.objectives, objectives]
  );
  const lessonContent = useMemo(
    () => lessonData.content || content,
    [lessonData.content, content]
  );

  // 🔧 STEP 1: Disable browser scroll restoration on mount
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // 🔧 STEP 2: Enhanced scroll to top function with container focus
  const scrollToTopImmediate = () => {
    // Method 1: window.scrollTo
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto' // Use 'auto' for immediate scroll
    });

    // Method 2: document element
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Method 3: Focus on container if it exists
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
      containerRef.current.focus({ preventScroll: false });
    }

    // Method 4: Verify with setTimeout
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);

    // Method 5: Another verification after render
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  };

  // 🔧 STEP 3: Watch for lesson changes and scroll to top
  useEffect(() => {
    const currentLessonId = lessonData?._id;
    
    // If lesson ID changed, scroll to top
    if (currentLessonId && currentLessonId !== prevLessonIdRef.current) {
      console.log(`📚 Lesson changed: ${currentLessonId}`);
      prevLessonIdRef.current = currentLessonId;
      
      // Reset saved state
      setIsSaved(false);
      
      // Scroll to top immediately
      scrollToTopImmediate();
    }
  }, [lessonData?._id]);

  // Detect scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollToTopImmediate();
  };

  // Handle save lesson
  const handleSaveLesson = async () => {
    if (!isAuthenticated) {
      alert("Please login to save lessons");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const token = await getAccessTokenSilently();

      console.log("💾 Saving lesson:", {
        title: lessonData.title,
        course: course?.title,
        module: module?.title,
      });

      const result = await saveLessonWithContext(
        lessonData,
        course?.title || "Unknown Course",
        module?.title || "Unknown Module",
        token
      );

      console.log("✅ Lesson saved successfully:", result._id);
      setIsSaved(true);

      try {
        if (lessonData._id) {
          await markLessonComplete(lessonData._id, token);
          console.log("✅ Lesson marked as complete");
        }
      } catch (progressErr) {
        console.warn("Could not mark lesson as complete:", progressErr);
      }

      onLessonSaved(lessonData);

      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error("❌ Error saving lesson:", err);
      setSaveError(err.message || "Failed to save lesson");
      alert("Failed to save lesson: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle share
  const handleShare = () => {
    alert("Share feature coming soon!");
  };

  // Navigation handlers
  const handlePreviousClick = () => {
    console.log("⬅️ Previous button clicked");
    scrollToTopImmediate();
    if (onPrevious && typeof onPrevious === "function") {
      onPrevious();
    }
  };

  const handleNextClick = () => {
    console.log("➡️ Next button clicked");
    scrollToTopImmediate();
    if (onNext && typeof onNext === "function") {
      onNext();
    }
  };

  // Check if we can navigate
  const canGoPrevious = lessonIdx > 0;
  const canGoNext = lessonIdx < totalLessons - 1;

  return (
    <div className="lesson-renderer-container" ref={containerRef}>
      {/* Lesson Header */}
      <header className="lesson-header">
        <div className="lesson-header-content">
          <div className="lesson-breadcrumb">
            {course && (
              <>
                <span className="breadcrumb-item">{course.title}</span>
                <span className="breadcrumb-separator">/</span>
              </>
            )}
            {module && (
              <>
                <span className="breadcrumb-item">{module.title}</span>
                <span className="breadcrumb-separator">/</span>
              </>
            )}
            <span className="breadcrumb-current">
              {lessonData.title || "Lesson"}
            </span>
          </div>

          <h1 className="lesson-title">{lessonData.title}</h1>

          {/* Lesson Actions */}
          <div className="lesson-header-actions">
            <button
              onClick={handleSaveLesson}
              disabled={isSaving || isSaved}
              className={`action-btn ${isSaved ? "saved" : ""} ${
                isSaving ? "loading" : ""
              }`}
              title={
                isSaving
                  ? "Saving..."
                  : isSaved
                  ? "Saved!"
                  : "Save this lesson"
              }
            >
              {isSaved ? (
                <>
                  <Check size={18} />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <BookmarkPlus size={18} />
                  <span>{isSaving ? "Saving..." : "Save"}</span>
                </>
              )}
            </button>

            <PDFExporter
              lesson={lessonData}
              courseInfo={{
                courseName: course?.title || "Course",
                moduleName: module?.title || "Module",
              }}
              lessonId={lessonData._id}
            />

            <button
              onClick={handleShare}
              className="action-btn"
              title="Share lesson"
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>

          {saveError && (
            <div className="save-error-message">Error: {saveError}</div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="lesson-main-content">
        {/* Objectives Section */}
        {lessonObjectives && lessonObjectives.length > 0 && (
          <section className="objectives-section">
            <h2 className="section-title">📚 What You'll Learn</h2>
            <div className="objectives-grid">
              {lessonObjectives.map((obj, idx) => (
                <div key={idx} className="objective-card">
                  <span className="objective-checkmark">✓</span>
                  <p>{obj}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hinglish Translation Section */}
        <section className="hinglish-section">
          <HinglishTranslator lesson={lessonData} />
        </section>

        {/* Content Blocks */}
        <section className="content-section">
          {lessonContent && lessonContent.length > 0 ? (
            <div className="lesson-content">
              {lessonContent.map((block, idx) => {
                const BlockComponent = blockMap[block.type] || (() => (
                  <div className="invalid-block">
                    <p>Block Type: {block.type}</p>
                  </div>
                ));

                return <BlockComponent key={idx} {...block} />;
              })}
            </div>
          ) : (
            <div className="empty-content">
              <p>📝 No content available for this lesson yet.</p>
            </div>
          )}
        </section>
      </main>

      {/* Navigation Footer */}
      <footer className="lesson-footer">
        <div className="lesson-navigation">
          {/* Previous Button */}
          <button
            onClick={handlePreviousClick}
            disabled={!canGoPrevious}
            className="nav-btn prev-btn"
            title={canGoPrevious ? "Previous lesson" : "First lesson"}
          >
            <ChevronLeft size={20} />
            <span>Previous</span>
          </button>

          {/* Progress Indicator */}
          <div className="lesson-progress">
            <span className="progress-text">
              Lesson {lessonIdx + 1} of {totalLessons}
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((lessonIdx + 1) / totalLessons) * 100}%` }}
              />
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextClick}
            disabled={!canGoNext}
            className="nav-btn next-btn"
            title={canGoNext ? "Next lesson" : "Last lesson"}
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="scroll-to-top-btn"
          title="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default LessonRenderer;