import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import {
  getUserCourses,
  deleteCourseById,
  getUserSavedLessons,
  deleteLessonById,
} from "../utils/api";
import {
  Trash2,
  Eye,
  LogOut,
  BookOpen,
  Clock,
  Zap,
  AlertCircle,
  BookmarkCheck,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import "./Profile.css";

const ProfilePage = ({ onSelectCourse, onViewProfileLesson }) => {
  const { user, isAuthenticated, logout, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [savedLessons, setSavedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [notification, setNotification] = useState(null);

  // Fetch user data on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAccessTokenSilently();

        console.log("📚 Profile - Fetching saved courses...");
        const coursesData = await getUserCourses(token);
        setCourses(coursesData || []);

        console.log("📖 Profile - Fetching saved lessons...");
        const lessonsData = await getUserSavedLessons(token);
        setSavedLessons(lessonsData || []);

        console.log("✅ Profile - User data loaded:", {
          courses: coursesData?.length,
          lessons: lessonsData?.length,
        });
      } catch (err) {
        console.error("❌ Profile - Error loading user data:", err);
        setError(err.message || "Failed to load your data");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Handle delete course
  const handleDeleteCourse = async (courseId) => {
    setDeleting(courseId);
    try {
      const token = await getAccessTokenSilently();
      await deleteCourseById(courseId, token);
      setCourses(courses.filter((c) => c._id !== courseId));
      setDeleteConfirm(null);
      console.log("✅ Course deleted");
    } catch (err) {
      console.error("❌ Error deleting course:", err);
      setError("Failed to delete course");
    } finally {
      setDeleting(null);
    }
  };

  // Handle delete lesson
  const handleDeleteLesson = async (lessonId) => {
    setDeleting(lessonId);
    try {
      const token = await getAccessTokenSilently();
      await deleteLessonById(lessonId, token);
      setSavedLessons(savedLessons.filter((l) => l._id !== lessonId));
      setDeleteConfirm(null);
      console.log("✅ Lesson deleted");
    } catch (err) {
      console.error("❌ Error deleting lesson:", err);
      setError("Failed to delete lesson");
    } finally {
      setDeleting(null);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
  };

  // Handle Go Back to Home
  const handleGoBack = () => {
    console.log("📍 Going back to home/courses");
    navigate("/");
  };

  // Handle view saved lesson - Navigate to home with special state
  const handleViewLesson = (lesson) => {
    console.log("👁️ Viewing saved lesson from profile:", {
      lessonId: lesson._id,
      title: lesson.title,
      course: lesson.courseTitle,
      module: lesson.moduleName,
    });

    const lessonData = {
      _id: lesson._id,
      title: lesson.title,
      content: lesson.content || [],
      objectives: lesson.objectives || [],
    };

    const moduleData = {
      title: lesson.moduleName || "Module",
    };

    const courseData = {
      title: lesson.courseTitle || "Course",
    };

    // Call the callback to update App state
    if (onViewProfileLesson) {
      onViewProfileLesson({
        lesson: lessonData,
        module: moduleData,
        course: courseData,
        lessonIdx: 0,
        moduleIdx: 0,
        totalLessons: 1,
      });
    }

    // Navigate to home page
    navigate("/", {
      state: {
        viewingSavedLesson: true,
        returnPath: "/profile",
      },
    });
  };

  // Handle view course - Navigate to home with course data
  const handleViewCourse = async (course) => {
    console.log("👁️ Viewing course from profile:", course.title);

    const courseDataSize = JSON.stringify(course).length;
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (courseDataSize > maxSize) {
      setNotification({
        type: "error",
        message:
          "⚠️ Unable to save due to high payload. Try saving individual lessons instead.",
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    // Use the onSelectCourse callback to update App state
    if (onSelectCourse) {
      onSelectCourse(course);
    }

    // Navigate to home page
    navigate("/");
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-page-auth-required">
        <AlertCircle size={48} />
        <h2>Authentication Required</h2>
        <p>Please log in to view and manage your profile</p>
      </div>
    );
  }

  // Calculate totals from combined saved lessons and courses
  const totalSavedLessons = savedLessons.length;
  const totalCourseLessons = courses.reduce(
    (sum, course) =>
      sum +
      (course.modules?.reduce(
        (mSum, m) => mSum + (m.lessons?.length || 0),
        0
      ) || 0),
    0
  );
  const combinedTotal = totalSavedLessons + totalCourseLessons;

  // Group saved lessons by course for professional display
  const groupedSavedLessons = savedLessons.reduce((acc, lesson) => {
    const courseTitle = lesson.courseTitle || "Uncategorized";
    if (!acc[courseTitle]) {
      acc[courseTitle] = {
        courseTitle,
        modules: {},
      };
    }

    const moduleTitle = lesson.moduleName || "Uncategorized";
    if (!acc[courseTitle].modules[moduleTitle]) {
      acc[courseTitle].modules[moduleTitle] = {
        moduleName: moduleTitle,
        lessons: [],
      };
    }

    acc[courseTitle].modules[moduleTitle].lessons.push(lesson);
    return acc;
  }, {});

  return (
    <div className="profile-page-container">
      {/* Notification Banner */}
      {notification && (
        <div className={`notification-banner notification-${notification.type}`}>
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="notification-close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="profile-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">
            ✕
          </button>
        </div>
      )}

      {/* Profile Header */}
      <header className="profile-header">
        {/* Go Back Section - Integrated into Header */}
        <div className="profile-goback-inline">
          <button onClick={handleGoBack} className="goback-btn" title="Go back">
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>
        </div>

        <div className="profile-header-content">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <img
              src={
                user?.picture || "https://api.dicebear.com/7.x/avataaars/svg"
              }
              alt={user?.name || "User"}
              className="profile-avatar"
              onError={(e) => {
                e.target.src =
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=default";
              }}
            />
            <div className="profile-user-info">
              <h1 className="profile-user-name">
                {user?.name || user?.nickname || "User"}
              </h1>
              <p className="profile-user-email">{user?.email}</p>
              <p className="profile-user-id">
                ID: {user?.sub?.substring(0, 12)}...
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="profile-header-actions">
            <button
              onClick={handleLogout}
              className="action-btn logout-btn"
              title="Logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Updated Stats Bar */}
        <div className="profile-stats">
          <div className="stat-card">
            <BookOpen size={20} />
            <div>
              <p className="stat-label">Saved Courses</p>
              <p className="stat-value">{courses.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <BookmarkCheck size={20} />
            <div>
              <p className="stat-label">Saved Lessons</p>
              <p className="stat-value">{totalSavedLessons}</p>
            </div>
          </div>
          <div className="stat-card">
            <Zap size={20} />
            <div>
              <p className="stat-label">Total</p>
              <p className="stat-value">{combinedTotal}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="profile-main">
        {/* Combined Saved Items Section */}
        <section className="profile-combined-section">
          <div className="section-header">
            <h2>
              <BookmarkCheck size={20} />
              Your Saved Content
            </h2>
            <span className="content-count">{combinedTotal}</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your content...</p>
            </div>
          ) : combinedTotal === 0 ? (
            <div className="empty-state">
              <BookmarkCheck size={48} />
              <h3>No Saved Content Yet</h3>
              <p>Save courses and lessons to access them here</p>
            </div>
          ) : (
            <div className="combined-content">
              {/* Saved Lessons */}
              {totalSavedLessons > 0 && (
                <div className="content-subsection">
                  <h3 className="subsection-title">
                    📖 Saved Lessons ({totalSavedLessons})
                  </h3>
                  <div className="saved-courses-hierarchy">
                    {Object.entries(groupedSavedLessons).map(
                      ([courseTitle, courseData]) => (
                        <SavedCourseGroup
                          key={`lesson-${courseTitle}`}
                          courseTitle={courseTitle}
                          modules={courseData.modules}
                          onViewLesson={handleViewLesson}
                          onDeleteLesson={(lessonId) => {
                            setDeleteConfirm(lessonId);
                            setDeleteType("lesson");
                          }}
                          deleting={deleting}
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Saved Courses */}
              {courses.length > 0 && (
                <div className="content-subsection">
                  <h3 className="subsection-title">
                    📚 Saved Courses ({courses.length})
                  </h3>
                  <div className="courses-grid">
                    {courses.map((course) => (
                      <CourseCard
                        key={course._id}
                        course={course}
                        onView={() => handleViewCourse(course)}
                        onDelete={() => {
                          setDeleteConfirm(course._id);
                          setDeleteType("course");
                        }}
                        isDeleting={deleting === course._id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>
              Delete {deleteType === "course" ? "Course" : "Lesson"}?
            </h3>
            <p>
              Are you sure you want to delete this{" "}
              {deleteType === "course" ? "course" : "lesson"}? This action
              cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteType(null);
                }}
                className="modal-btn cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteType === "course") {
                    handleDeleteCourse(deleteConfirm);
                  } else {
                    handleDeleteLesson(deleteConfirm);
                  }
                }}
                disabled={deleting === deleteConfirm}
                className="modal-btn delete-btn"
              >
                {deleting === deleteConfirm ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component Groups (SavedCourseGroup, SavedModuleGroup, etc.)
const SavedCourseGroup = ({
  courseTitle,
  modules,
  onViewLesson,
  onDeleteLesson,
  deleting,
}) => {
  const [expandedModules, setExpandedModules] = useState({});

  const toggleModule = (moduleName) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  const totalLessons = Object.values(modules).reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );

  return (
    <div className="saved-course-group">
      <div className="saved-course-header">
        <div className="saved-course-info">
          <h3 className="saved-course-title">📚 {courseTitle}</h3>
          <p className="saved-course-stats">{totalLessons} lessons</p>
        </div>
      </div>

      <div className="modules-hierarchy">
        {Object.entries(modules).map(([moduleName, moduleData]) => (
          <SavedModuleGroup
            key={moduleName}
            moduleName={moduleName}
            lessons={moduleData.lessons}
            isExpanded={expandedModules[moduleName]}
            onToggle={() => toggleModule(moduleName)}
            onViewLesson={onViewLesson}
            onDeleteLesson={onDeleteLesson}
            deleting={deleting}
          />
        ))}
      </div>
    </div>
  );
};

const SavedModuleGroup = ({
  moduleName,
  lessons,
  isExpanded,
  onToggle,
  onViewLesson,
  onDeleteLesson,
  deleting,
}) => {
  return (
    <div className="saved-module-group">
      <button className="saved-module-header" onClick={onToggle}>
        <div className="module-toggle">
          <ChevronDown
            size={18}
            className={`toggle-icon ${isExpanded ? "expanded" : ""}`}
          />
          <span className="module-name">📖 {moduleName}</span>
        </div>
        <span className="module-lesson-count">{lessons.length}</span>
      </button>

      {isExpanded && (
        <div className="lessons-list">
          {lessons.map((lesson) => (
            <SavedLessonItem
              key={lesson._id}
              lesson={lesson}
              onView={() => onViewLesson(lesson)}
              onDelete={() => onDeleteLesson(lesson._id)}
              isDeleting={deleting === lesson._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SavedLessonItem = ({ lesson, onView, onDelete, isDeleting }) => {
  return (
    <div className="saved-lesson-item">
      <div className="lesson-item-header">
        <div className="lesson-item-info">
          <h4 className="lesson-item-title">{lesson.title}</h4>
          <p className="lesson-item-meta">
            📝 {lesson.content?.length || 0} blocks • ⏰{" "}
            {new Date(lesson.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="lesson-item-actions">
          <button
            onClick={onView}
            className="lesson-item-btn view-btn"
            title="View lesson"
          >
            <Eye size={16} />
            <span>View</span>
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="lesson-item-btn delete-btn"
            title="Delete lesson"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {lesson.objectives && lesson.objectives.length > 0 && (
        <div className="lesson-item-objectives">
          {lesson.objectives.slice(0, 2).map((obj, idx) => (
            <span key={idx} className="objective-tag">
              ✓ {obj}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const CourseCard = ({ course, onView, onDelete, isDeleting }) => {
  const moduleCount = course.modules?.length || 0;
  const lessonCount =
    course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;

  return (
    <div className="course-card">
      <div className="course-card-header">
        <h3 className="course-card-title">{course.title}</h3>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="card-delete-btn"
          title="Delete course"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <p className="course-card-description">{course.description}</p>

      <div className="course-card-tags">
        {course.tags && course.tags.length > 0 ? (
          course.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))
        ) : (
          <span className="tag default-tag">AI-Generated</span>
        )}
        {course.tags && course.tags.length > 3 && (
          <span className="tag more-tag">+{course.tags.length - 3}</span>
        )}
      </div>

      <div className="course-card-stats">
        <div className="card-stat">
          <BookOpen size={14} />
          <span>{moduleCount} Modules</span>
        </div>
        <div className="card-stat">
          <Clock size={14} />
          <span>{lessonCount} Lessons</span>
        </div>
      </div>

      <button onClick={onView} className="course-card-btn">
        <Eye size={16} />
        <span>View Course</span>
      </button>
    </div>
  );
};

export default ProfilePage;