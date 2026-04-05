import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Sparkles, Loader, Save, Check, X, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatPrompt from '../components/ChatPrompt';
import CoursePreview from '../components/CoursePreview';
import LessonRenderer from '../components/LessonRenderer';
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

  // Show notification
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // Disable browser scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // FIXED: Track lesson changes and reset scroll
  useEffect(() => {
    const currentLessonId = activeLesson?.lesson?._id || activeLesson?._id;
    
    if (currentLessonId && currentLessonId !== prevLessonIdRef.current) {
      console.log(`🔧 Home - Lesson changed: ${currentLessonId}`);
      prevLessonIdRef.current = currentLessonId;
      
      // Reset scroll to top when lesson changes
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 0);
    }
  }, [activeLesson]);

  const handleAIResponse = useCallback((generatedCourse) => {
    try {
      if (!isAuthenticated) {
        showNotification('Please login to generate courses', 'warning');
        setIsGenerating(false);
        return;
      }

      console.log('✅ Home - Course generated:', generatedCourse.title);
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
    // FIXED: Handle profile lessons that don't have modules
    if (isViewingProfileLesson && activeLesson) {
      return 1; // Profile lessons are viewed as single lessons
    }
    
    if (!activeCourse || !activeCourse.modules) return 0;
    return activeCourse.modules.reduce((total, module) => {
      return total + (module.lessons?.length || 0);
    }, 0);
  }, [activeCourse, isViewingProfileLesson, activeLesson]);

  const getCurrentLessonIndex = useCallback(() => {
    // FIXED: Handle profile lessons
    if (isViewingProfileLesson && activeLesson) {
      return 0; // Profile lessons are always at index 0
    }

    if (!activeLesson || !activeCourse || !activeCourse.modules) return 0;

    let currentIndex = 0;
    for (let modIdx = 0; modIdx < activeCourse.modules.length; modIdx++) {
      const module = activeCourse.modules[modIdx];
      if (!module.lessons) continue;

      for (let lesIdx = 0; lesIdx < module.lessons.length; lesIdx++) {
        const lessonId = module.lessons[lesIdx]._id;
        const activeLessonId = activeLesson.lesson?._id || activeLesson._id;

        if (lessonId === activeLessonId) {
          return currentIndex;
        }
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
      if (isViewingProfileLesson) {
        console.log('🔒 LOCKED: Cannot select lesson while viewing profile lesson');
        return;
      }

      console.log('✅ Home - Lesson selected from preview');

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
      console.log('✅ Home - Previous lesson');

      const currentIndex = getCurrentLessonIndex();
      if (currentIndex > 0) {
        const previousLesson = getLessonByIndex(currentIndex - 1);
        if (previousLesson) {
          onSelectLesson(previousLesson);
        }
      }
    } catch (error) {
      console.error('❌ Error navigating to previous lesson:', error);
      showNotification('Cannot navigate to previous lesson', 'error');
    }
  }, [getCurrentLessonIndex, getLessonByIndex, onSelectLesson, showNotification]);

  const handleNextLesson = useCallback(() => {
    try {
      console.log('✅ Home - Next lesson');

      const currentIndex = getCurrentLessonIndex();
      const totalLessons = getTotalLessons();

      if (currentIndex < totalLessons - 1) {
        const nextLesson = getLessonByIndex(currentIndex + 1);
        if (nextLesson) {
          onSelectLesson(nextLesson);
        }
      }
    } catch (error) {
      console.error('❌ Error navigating to next lesson:', error);
      showNotification('Cannot navigate to next lesson', 'error');
    }
  }, [getCurrentLessonIndex, getTotalLessons, getLessonByIndex, onSelectLesson, showNotification]);

  const handleBackToCourse = useCallback(() => {
    try {
      if (isViewingProfileLesson) {
        console.log('🔒 LOCKED: Cannot go back while viewing profile lesson');
        return;
      }

      console.log('🔙 Home - Going back to course');
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
      console.log('✅ Home - Closing profile lesson');
      if (onCloseProfileLesson) {
        onCloseProfileLesson();
      }
    } catch (error) {
      console.error('❌ Error closing profile lesson:', error);
    }
  }, [onCloseProfileLesson]);

  const handleNewCourse = useCallback(() => {
    try {
      console.log('🆕 Home - Starting new course');
      onNewCourse();
      showNotification('Starting new course...', 'info');
    } catch (error) {
      console.error('❌ Error starting new course:', error);
      showNotification('Failed to start new course', 'error');
    }
  }, [onNewCourse, showNotification]);

  // FIXED: Handle profile lessons and regular course lessons
  function renderContent() {
    // Show lesson content when activeLesson exists (works for both profile lessons and course lessons)
    if (activeLesson) {
      const currentIndex = getCurrentLessonIndex();
      const totalLessons = getTotalLessons();
      
      // FIXED: Get lesson data - profile lessons have different structure
      const lessonData = activeLesson.lesson || activeLesson;
      const moduleData = activeLesson.module || { title: 'Module' };
      const courseData = activeLesson.course || activeCourse || { title: 'Course' };

      return (
        <div className="home-lesson-view">
          {/* Simple close button for profile lessons */}
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

    // Show course preview when activeCourse exists but activeLesson is null
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

    // Show home page (empty state)
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

  // Render with notifications
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
    </>
  );
};

export default Home;