import React, { useState, useEffect, useMemo, useRef } from "react";
import { scrollToTop as scrollContentToTop } from "../utils/scrollToTop";
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

import HeadingBlock from "./blocks/HeadingBlock";
import ParagraphBlock from "./blocks/ParagraphBlock";
import CodeBlock from "./blocks/CodeBlock";
import VideoBlock from "./blocks/VideoBlock";
import MCQBlock from "./blocks/MCQBlock";
import FlashcardsBlock from "./blocks/FlashcardsBlock";

import HinglishTranslator from "./HinglishTranslator";
import PDFExporter from "./PDFExporter";
import FeynmanSimulator from "./FeynmanSimulator";
import AdaptiveCurriculum from "./AdaptiveCurriculum";

import "./LessonRenderer.css";

const blockMap = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  code: CodeBlock,
  video: VideoBlock,
  mcq: MCQBlock,
  flashcards: FlashcardsBlock,
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

  const lessonData = useMemo(() => lesson || {}, [lesson]);
  const lessonObjectives = useMemo(
    () => lessonData.objectives || objectives,
    [lessonData.objectives, objectives]
  );
  const lessonContent = useMemo(
    () => lessonData.content || content,
    [lessonData.content, content]
  );

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Fixed: scroll the actual content container, not window
  const scrollToTopImmediate = () => {
    scrollContentToTop("auto");
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "auto", block: "start" });
    }
  };

  // Watch for lesson changes and scroll to top
  useEffect(() => {
    const currentLessonId = lessonData?._id;
    if (currentLessonId && currentLessonId !== prevLessonIdRef.current) {
      prevLessonIdRef.current = currentLessonId;
      setIsSaved(false);
      scrollToTopImmediate();
    }
  }, [lessonData?._id]);

  // Fixed: watch the correct scrollable container for scroll-to-top button
  useEffect(() => {
    const container = document.querySelector(".app-main-content");
    const target = container || window;
    const handleScroll = () => {
      const scrollY = container ? container.scrollTop : window.scrollY;
      setShowScrollTop(scrollY > 300);
    };
    target.addEventListener("scroll", handleScroll);
    return () => target.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollToTopImmediate();
  };

  const handleSaveLesson = async () => {
    if (!isAuthenticated) {
      alert("Please login to save lessons");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const token = await getAccessTokenSilently();

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
          const progressResult = await markLessonComplete(lessonData._id, token);
          if (progressResult && progressResult.xpGained) {
             // We can use the existing showNotification from Home.jsx if it was passed down,
             // but currently it's just alert.
             alert(`🎉 Lesson Completed! You earned ${progressResult.xpGained} XP! \nCurrent Level: ${Math.floor(Math.sqrt(progressResult.totalXp / 100)) + 1}`);
          }
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

  const handleShare = () => {
    alert("Share feature coming soon!");
  };

  const handlePreviousClick = () => {
    scrollToTopImmediate();
    if (onPrevious && typeof onPrevious === "function") {
      onPrevious();
    }
  };

  const handleNextClick = () => {
    scrollToTopImmediate();
    if (onNext && typeof onNext === "function") {
      onNext();
    }
  };

  const canGoPrevious = lessonIdx > 0;
  const canGoNext = lessonIdx < totalLessons - 1;

  return (
    <div className="lesson-renderer-container" ref={containerRef}>
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

          <div className="lesson-header-actions">
            <button
              onClick={handleSaveLesson}
              disabled={isSaving || isSaved}
              className={`action-btn ${isSaved ? "saved" : ""} ${isSaving ? "loading" : ""}`}
              title={isSaving ? "Saving..." : isSaved ? "Saved!" : "Save this lesson"}
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

            <button onClick={handleShare} className="action-btn" title="Share lesson">
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>

          {saveError && (
            <div className="save-error-message">Error: {saveError}</div>
          )}
        </div>
      </header>

      <main className="lesson-main-content">
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

        <section className="hinglish-section">
          <HinglishTranslator lesson={lessonData} />
        </section>

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

        <section className="feynman-section">
          <FeynmanSimulator lesson={lessonData} />
        </section>

        {lessonIdx === totalLessons - 1 && (
          <section className="adaptive-section">
            <AdaptiveCurriculum 
              course={course} 
              module={module} 
              lesson={lessonData} 
              onPathGenerated={() => window.dispatchEvent(new Event('course_updated'))}
            />
          </section>
        )}
      </main>

      <footer className="lesson-footer">
        <div className="lesson-navigation">
          <button
            onClick={handlePreviousClick}
            disabled={!canGoPrevious}
            className="nav-btn prev-btn"
            title={canGoPrevious ? "Previous lesson" : "First lesson"}
          >
            <ChevronLeft size={20} />
            <span>Previous</span>
          </button>

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