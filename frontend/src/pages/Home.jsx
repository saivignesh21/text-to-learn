import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Sparkles, Loader, Save, Check, X, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { scrollToTop } from '../utils/scrollToTop';
import ChatPrompt from '../components/ChatPrompt';
import CoursePreview from '../components/CoursePreview';
import LessonRenderer from '../components/LessonRenderer';
import StudyBuddy from '../components/StudyBuddy';
import { saveCourse } from '../utils/api';
import './Home.css';

const Home = ({
  activeCourse,
  activeLesson,
  isViewingProfileLesson,
  onCloseProfileLesson,
  onCourseGenerated,
  onSaveCourse,
  onSelectLesson,
  onBackToCourse,
  onNewCourse,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [saved, setSaved] = useState(false);
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  const prevLessonIdRef = useRef(null);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Fixed: scroll the actual content container, not window
  useEffect(() => {
    const currentLessonId = activeLesson?.lesson?._id || activeLesson?._id;

    if (currentLessonId && currentLessonId !== prevLessonIdRef.current) {
      prevLessonIdRef.current = currentLessonId;
      scrollToTop("auto");
    }
  }, [activeLesson]);

  const handleAIResponse = useCallback((generatedCourse) => {
    try {
      if (!isAuthenticated) {
        showNotification('Please login to generate courses', 'warning');
        setIsGenerating(false);
        return;
      }
      onCourseGenerated(generatedCourse);
      setIsGenerating(false);
      setSaved(false);
      showNotification(`Course "${generatedCourse.title}" generated!`, 'success');
    } catch (error) {
      console.error('❌ Error in handleAIResponse:', error);
      showNotification('Failed to process course', 'error');
    }
  }, [onCourseGenerated, showNotification, isAuthenticated]);

  const handleSaveCourse = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Please login to save courses', 'warning');
      return;
    }

    if (!activeCourse) {
      showNotification('No course to save', 'error');
      return;
    }

    try {
      const courseDataSize = JSON.stringify(activeCourse).length;
      const maxSize = 5 * 1024 * 1024;

      if (courseDataSize > maxSize) {
        showNotification('⚠️ Course too large. Try saving individual lessons instead.', 'error');
        return;
      }

      const token = await getAccessTokenSilently();
      await saveCourse(activeCourse, token);
      onSaveCourse(activeCourse);
      setSaved(true);
      showNotification(`Course "${activeCourse.title}" saved successfully!`, 'success');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('❌ Error saving course:', err);
      showNotification('Failed to save course. Try again later.', 'error');
    }
  }, [isAuthenticated, activeCourse, onSaveCourse, getAccessTokenSilently, showNotification]);

  const getTotalLessons = useCallback(() => {
    if (isViewingProfileLesson && activeLesson) return 1;
    if (!activeCourse || !activeCourse.modules) return 0;
    return activeCourse.modules.reduce((total, module) => {
      return total + (module.lessons?.length || 0);
    }, 0);
  }, [activeCourse, isViewingProfileLesson, activeLesson]);

  const getCurrentLessonIndex = useCallback(() => {
    if (isViewingProfileLesson && activeLesson) return 0;
    if (!activeLesson || !activeCourse || !activeCourse.modules) return 0;

    let currentIndex = 0;
    for (let modIdx = 0; modIdx < activeCourse.modules.length; modIdx++) {
      const module = activeCourse.modules[modIdx];
      if (!module.lessons) continue;
      for (let lesIdx = 0; lesIdx < module.lessons.length; lesIdx++) {
        const lessonId = module.lessons[lesIdx]._id;
        const activeLessonId = activeLesson.lesson?._id || activeLesson._id;
        if (lessonId === activeLessonId) return currentIndex;
        currentIndex++;
      }
    }
    return 0;
  }, [activeLesson, activeCourse, isViewingProfileLesson]);

  const getLessonByIndex = useCallback((globalIndex) => {
    if (!activeCourse || !activeCourse.modules) return null;

    let currentIndex = 0;
    for (let modIdx = 0; modIdx < activeCourse.modules.length; modIdx++) {
      const module = activeCourse.modules[modIdx];
      if (!module.lessons) continue;
      for (let lesIdx = 0; lesIdx < module.lessons.length; lesIdx++) {
        if (currentIndex === globalIndex) {
          return {
            lesson: module.lessons[lesIdx],
            module: module,
            lessonIdx: lesIdx,
            moduleIdx: modIdx,
          };
        }
        currentIndex++;
      }
    }
    return null;
  }, [activeCourse]);

  const handleLessonSelection = useCallback((lessonData) => {
    try {
      if (isViewingProfileLesson) return;
      if (lessonData && lessonData.lesson) {
        onSelectLesson(lessonData);
      }
    } catch (error) {
      console.error('❌ Error selecting lesson:', error);
      showNotification('Failed to select lesson', 'error');
    }
  }, [isViewingProfileLesson, onSelectLesson, showNotification]);

  const handlePreviousLesson = useCallback(() => {
    try {
      const currentIndex = getCurrentLessonIndex();
      if (currentIndex > 0) {
        const previousLesson = getLessonByIndex(currentIndex - 1);
        if (previousLesson) onSelectLesson(previousLesson);
      }
    } catch (error) {
      console.error('❌ Error navigating to previous lesson:', error);
      showNotification('Cannot navigate to previous lesson', 'error');
    }
  }, [getCurrentLessonIndex, getLessonByIndex, onSelectLesson, showNotification]);

  const handleNextLesson = useCallback(() => {
    try {
      const currentIndex = getCurrentLessonIndex();
      const totalLessons = getTotalLessons();
      if (currentIndex < totalLessons - 1) {
        const nextLesson = getLessonByIndex(currentIndex + 1);
        if (nextLesson) onSelectLesson(nextLesson);
      }
    } catch (error) {
      console.error('❌ Error navigating to next lesson:', error);
      showNotification('Cannot navigate to next lesson', 'error');
    }
  }, [getCurrentLessonIndex, getTotalLessons, getLessonByIndex, onSelectLesson, showNotification]);

  const handleBackToCourse = useCallback(() => {
    try {
      if (isViewingProfileLesson) return;
      onBackToCourse();
      if (location.state?.returnPath === "/profile") {
        navigate("/profile");
      }
    } catch (error) {
      console.error('❌ Error going back:', error);
      showNotification('Failed to go back', 'error');
    }
  }, [isViewingProfileLesson, onBackToCourse, location.state, navigate, showNotification]);

  const handleCloseProfileLesson = useCallback(() => {
    try {
      if (onCloseProfileLesson) onCloseProfileLesson();
    } catch (error) {
      console.error('❌ Error closing profile lesson:', error);
    }
  }, [onCloseProfileLesson]);

  const handleNewCourse = useCallback(() => {
    try {
      onNewCourse();
      showNotification('Starting new course...', 'info');
    } catch (error) {
      console.error('❌ Error starting new course:', error);
      showNotification('Failed to start new course', 'error');
    }
  }, [onNewCourse, showNotification]);

  function renderContent() {
    if (activeLesson) {
      const currentIndex = getCurrentLessonIndex();
      const totalLessons = getTotalLessons();
      const lessonData = activeLesson.lesson || activeLesson;
      const moduleData = activeLesson.module || { title: 'Module' };
      const courseData = activeLesson.course || activeCourse || { title: 'Course' };

      return (
        <div className="home-lesson-view">
          {isViewingProfileLesson && (
            <button
              onClick={handleCloseProfileLesson}
              className="close-profile-lesson-btn"
              title="Close saved lesson"
            >
              <X size={20} />
              <span>Close</span>
            </button>
          )}

          <LessonRenderer
            key={`lesson-${lessonData._id}`}
            lesson={lessonData}
            module={moduleData}
            course={courseData}
            moduleIdx={activeLesson.moduleIdx || 0}
            lessonIdx={currentIndex}
            totalLessons={totalLessons}
            onBack={handleBackToCourse}
            onPrevious={handlePreviousLesson}
            onNext={handleNextLesson}
          />
        </div>
      );
    }

    if (activeCourse) {
      return (
        <div className="home-course-view">
          <div className="course-actions">
            <button
              onClick={handleNewCourse}
              className="new-course-action-btn"
              disabled={isViewingProfileLesson}
              title="New Course"
            >
              ✕ New Course
            </button>
            {isAuthenticated && (
              <button
                onClick={handleSaveCourse}
                className="save-course-btn"
                disabled={saved || isViewingProfileLesson}
                title="Save Course"
              >
                {saved ? (
                  <>
                    <Check size={18} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Course
                  </>
                )}
              </button>
            )}
          </div>

          {error && (
            <div className="save-error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          <CoursePreview
            course={activeCourse}
            onLessonSelect={handleLessonSelection}
          />
        </div>
      );
    }

    return (
      <div className="home-container">
        <header className="home-header">
          <div className="header-badge">
            <Sparkles size={16} />
            <span>AI-Powered Learning</span>
          </div>
          <h1 className="home-title">Generate Your Perfect Course</h1>
          <p className="home-subtitle">
            Describe what you want to learn, and our AI creates a structured course with modules and lessons.
          </p>
        </header>

        <section className="home-prompt-section">
          <ChatPrompt
            onResponse={handleAIResponse}
            onGenerationStart={() => setIsGenerating(true)}
            onError={(err) => showNotification(err, 'error')}
            isGenerating={isGenerating}
          />
        </section>

        {isGenerating && (
          <div className="home-loading">
            <Loader size={48} className="spinner" />
            <h3>Creating Your Course</h3>
            <p>Generating modules, lessons, and content...</p>
          </div>
        )}

        {!isGenerating && (
          <div className="home-empty-state">
            <Sparkles size={64} />
            <h2>Ready to Learn Something New?</h2>
            <p>Enter a topic above to generate your personalized course</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {notification && (
        <div className={`home-notification home-notification-${notification.type}`}>
          <div className="notification-content">
            {notification.type === 'error' && <AlertCircle size={20} />}
            {notification.type === 'warning' && <AlertCircle size={20} />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      {renderContent()}
      {(activeCourse || activeLesson) && (
        <StudyBuddy 
          course={activeLesson?.course || activeCourse}
          module={activeLesson?.module}
          lesson={activeLesson?.lesson || (activeLesson && !activeLesson.module ? activeLesson : null)}
        />
      )}
    </>
  );
};

export default Home;