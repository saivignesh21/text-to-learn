// src/utils/api.js

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

console.log("API MODULE LOADED");
console.log("BASE_URL configured as:", BASE_URL);

/**
 * Generic API request helper with comprehensive logging
 */
export const apiRequest = async (
  endpoint,
  method = "GET",
  body = null,
  token = null
) => {
  const fullUrl = `${BASE_URL}${endpoint}`;

  console.group("API_REQUEST");
  console.log("URL:", fullUrl);
  console.log("Method:", method);
  console.log("Has Body:", !!body);
  console.log("Has Token:", !!token);
  if (body) console.log("Body:", body);
  console.groupEnd();

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    console.log("Making fetch request to:", fullUrl);
    const res = await fetch(fullUrl, options);

    console.group("API_RESPONSE");
    console.log("Status:", res.status, res.statusText);
    console.log("URL:", res.url);
    console.log("OK:", res.ok);
    console.groupEnd();

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { message: res.statusText };
      }

      console.error("API Error Response:", errorData);
      throw new Error(
        errorData.message || `API Error: ${res.status} ${res.statusText}`
      );
    }

    const data = await res.json();
    console.log("API Response Data:", data);
    return data;
  } catch (err) {
    console.error("API REQUEST FAILED");
    console.error("Endpoint:", endpoint);
    console.error("Error:", err.message);
    console.error("Full Error:", err);
    throw err;
  }
};

/**
 * Generate a structured course from a topic prompt
 */
export const generateCourseAI = async (topic, token = null) => {
  console.group("generateCourseAI");
  console.log("Topic:", topic);
  console.log("Has Token:", !!token);

  if (!topic || !topic.trim()) {
    console.error("Topic is empty or missing");
    console.groupEnd();
    throw new Error("Topic is required");
  }

  try {
    console.log("Calling apiRequest with /ai/generate-course");
    const result = await apiRequest(
      "/ai/generate-course",
      "POST",
      { topic: topic.trim() },
      token
    );
    console.log("Success! Generated course:", result);
    console.groupEnd();
    return result;
  } catch (err) {
    console.error("generateCourseAI failed:", err.message);
    console.groupEnd();
    throw new Error(err.message || "Failed to generate course");
  }
};

/**
 * Generate a specific lesson
 */
export const generateLessonAI = async (
  courseTitle,
  moduleTitle,
  lessonTitle,
  token = null
) => {
  if (!courseTitle || !moduleTitle || !lessonTitle) {
    throw new Error("Course, module, and lesson titles are required");
  }

  try {
    return await apiRequest(
      "/ai/generate-lesson",
      "POST",
      { courseTitle, moduleTitle, lessonTitle },
      token
    );
  } catch (err) {
    console.error("Lesson generation error:", err);
    throw new Error(err.message || "Failed to generate lesson");
  }
};

// ==================== COURSE ROUTES ====================

export const getAllCourses = async () => {
  try {
    return await apiRequest("/courses");
  } catch (err) {
    console.error("Error fetching all courses:", err);
    throw err;
  }
};

export const getCourseById = async (id) => {
  if (!id) throw new Error("Course ID is required");
  try {
    return await apiRequest(`/courses/${id}`);
  } catch (err) {
    console.error("Error fetching course:", err);
    throw err;
  }
};

export const getUserCourses = async (token) => {
  if (!token) throw new Error("Authentication required");
  try {
    return await apiRequest("/courses/my", "GET", null, token);
  } catch (err) {
    console.error("Error fetching user courses:", err);
    throw err;
  }
};

/**
 * 🔧 FIXED: Save entire course to user's profile
 * Sends course with all modules and lessons
 */
export const saveCourse = async (course, token) => {
  if (!token) throw new Error("Authentication required to save courses");
  if (!course) throw new Error("Course object is required");

  try {
    console.log("💾 Saving full course:", course.title);

    // Ensure course has required fields
    const courseData = {
      title: course.title || "Untitled Course",
      description: course.description || "",
      tags: course.tags || [],
      modules: course.modules || [],
      isGenerated: true,
      createdAt: new Date(),
    };

    // POST to /courses to save entire course with all modules/lessons
    const result = await apiRequest("/courses", "POST", courseData, token);

    console.log("✅ Course saved successfully:", result._id);
    return result;
  } catch (err) {
    console.error("Error saving course:", err);
    throw new Error(err.message || "Failed to save course");
  }
};

export const deleteCourseById = async (id, token) => {
  if (!token) throw new Error("Authentication required");
  if (!id) throw new Error("Course ID is required");
  try {
    return await apiRequest(`/courses/${id}`, "DELETE", null, token);
  } catch (err) {
    console.error("Error deleting course:", err);
    throw err;
  }
};

export const updateCourse = async (id, updates, token) => {
  if (!token) throw new Error("Authentication required");
  if (!id) throw new Error("Course ID is required");
  try {
    return await apiRequest(`/courses/${id}`, "PUT", updates, token);
  } catch (err) {
    console.error("Error updating course:", err);
    throw err;
  }
};

// ==================== MODULE ROUTES ====================

export const getModulesByCourse = async (courseId) => {
  if (!courseId) throw new Error("Course ID is required");
  try {
    return await apiRequest(`/modules?courseId=${courseId}`);
  } catch (err) {
    console.error("Error fetching modules:", err);
    throw err;
  }
};

export const getModuleById = async (moduleId) => {
  if (!moduleId) throw new Error("Module ID is required");
  try {
    return await apiRequest(`/modules/${moduleId}`);
  } catch (err) {
    console.error("Error fetching module:", err);
    throw err;
  }
};

export const addModuleToCourse = async (courseId, module, token) => {
  if (!token) throw new Error("Authentication required");
  if (!courseId) throw new Error("Course ID is required");
  if (!module) throw new Error("Module data is required");
  try {
    return await apiRequest(
      `/modules?courseId=${courseId}`,
      "POST",
      module,
      token
    );
  } catch (err) {
    console.error("Error adding module:", err);
    throw err;
  }
};

export const deleteModuleById = async (moduleId, token) => {
  if (!token) throw new Error("Authentication required");
  if (!moduleId) throw new Error("Module ID is required");
  try {
    return await apiRequest(`/modules/${moduleId}`, "DELETE", null, token);
  } catch (err) {
    console.error("Error deleting module:", err);
    throw err;
  }
};

// ==================== LESSON ROUTES ====================

export const getLessonsByModule = async (moduleId) => {
  if (!moduleId) throw new Error("Module ID is required");
  try {
    return await apiRequest(`/lessons?moduleId=${moduleId}`);
  } catch (err) {
    console.error("Error fetching lessons:", err);
    throw err;
  }
};

export const getLessonById = async (lessonId) => {
  if (!lessonId) throw new Error("Lesson ID is required");
  try {
    return await apiRequest(`/lessons/${lessonId}`);
  } catch (err) {
    console.error("Error fetching lesson:", err);
    throw err;
  }
};

/**
 * 🔧 FIXED: Save a lesson to user's saved lessons
 * This saves a lesson from a course to the user's collection
 * Endpoint: POST /api/lessons/save
 * Body should contain: title, objectives, content, courseTitle, moduleName
 */
export const saveLessonWithContext = async (
  lesson,
  courseTitle,
  moduleName,
  token
) => {
  if (!token) throw new Error("Authentication required");
  if (!lesson) throw new Error("Lesson object is required");

  try {
    console.log("💾 Saving lesson with context:", {
      title: lesson.title,
      course: courseTitle,
      module: moduleName,
    });

    // 🔧 CRITICAL: Use the exact endpoint and format expected by backend
    const lessonData = {
      title: lesson.title || "Untitled Lesson",
      objectives: lesson.objectives || [],
      content: lesson.content || [],
      courseTitle: courseTitle || "Untitled Course",
      moduleName: moduleName || "Untitled Module",
    };

    // POST to /lessons/save endpoint (protected, requires token)
    const result = await apiRequest("/lessons/save", "POST", lessonData, token);

    console.log("✅ Lesson saved successfully:", result._id);
    return result;
  } catch (err) {
    console.error("Error saving lesson:", err);
    throw new Error(err.message || "Failed to save lesson");
  }
};

/**
 * 🔧 FIXED: Get user's saved lessons
 * GET /api/lessons/user/saved
 * Returns array of lessons saved by current user
 */
export const getUserSavedLessons = async (token) => {
  if (!token) throw new Error("Authentication required");
  try {
    console.log("📚 Fetching saved lessons...");
    const result = await apiRequest("/lessons/user/saved", "GET", null, token);

    // Handle both array and object responses
    const lessons = Array.isArray(result) ? result : result.data || [];
    console.log(`✅ Fetched ${lessons.length} saved lessons`);
    return lessons;
  } catch (err) {
    console.error("Error fetching saved lessons:", err);
    // Return empty array on error to prevent breaking the page
    return [];
  }
};

/**
 * 🔧 FIXED: Delete a saved lesson
 * DELETE /api/lessons/:lessonId
 */
export const deleteLessonById = async (lessonId, token) => {
  if (!token) throw new Error("Authentication required");
  if (!lessonId) throw new Error("Lesson ID is required");

  try {
    console.log("🗑️  Deleting lesson:", lessonId);
    const result = await apiRequest(
      `/lessons/${lessonId}`,
      "DELETE",
      null,
      token
    );
    console.log("✅ Lesson deleted successfully");
    return result;
  } catch (err) {
    console.error("Error deleting lesson:", err);
    throw err;
  }
};

export const saveLesson = async (moduleId, lesson, token) => {
  if (!token) throw new Error("Authentication required to save lessons");
  if (!moduleId) throw new Error("Module ID is required");
  if (!lesson) throw new Error("Lesson object is required");

  try {
    console.log("Saving lesson:", lesson.title);
    const lessonData = {
      title: lesson.title,
      objectives: lesson.objectives || [],
      content: lesson.content || [],
    };

    const result = await apiRequest(
      `/lessons?moduleId=${moduleId}`,
      "POST",
      lessonData,
      token
    );
    console.log("Lesson saved successfully:", result);
    return result;
  } catch (err) {
    console.error("Error saving lesson:", err);
    throw err;
  }
};

export const addLessonToModule = async (moduleId, lesson, token) => {
  if (!token) throw new Error("Authentication required");
  if (!moduleId) throw new Error("Module ID is required");
  if (!lesson) throw new Error("Lesson data is required");
  try {
    return await apiRequest(
      `/lessons?moduleId=${moduleId}`,
      "POST",
      lesson,
      token
    );
  } catch (err) {
    console.error("Error adding lesson:", err);
    throw err;
  }
};

export const updateLesson = async (lessonId, updates, token) => {
  if (!token) throw new Error("Authentication required");
  if (!lessonId) throw new Error("Lesson ID is required");
  try {
    console.log("Updating lesson:", lessonId);
    const result = await apiRequest(
      `/lessons/${lessonId}`,
      "PUT",
      updates,
      token
    );
    console.log("Lesson updated successfully:", result);
    return result;
  } catch (err) {
    console.error("Error updating lesson:", err);
    throw err;
  }
};

// ==================== USER ROUTES ====================

export const getUserProfile = async (token) => {
  if (!token) throw new Error("Authentication required");
  try {
    return await apiRequest("/users/me", "GET", null, token);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    throw err;
  }
};

export const updateUserProfile = async (updates, token) => {
  if (!token) throw new Error("Authentication required");
  try {
    return await apiRequest("/users/me", "PUT", updates, token);
  } catch (err) {
    console.error("Error updating user profile:", err);
    throw err;
  }
};

// ==================== PROGRESS TRACKING ====================

export const markLessonComplete = async (lessonId, token) => {
  if (!token) throw new Error("Authentication required");
  if (!lessonId) throw new Error("Lesson ID is required");
  try {
    console.log("Marking lesson as complete:", lessonId);
    return await apiRequest(
      `/progress/lessons/${lessonId}/complete`,
      "POST",
      {},
      token
    );
  } catch (err) {
    console.error("Error marking lesson complete:", err);
    // Don't throw - this is not critical for the user flow
    return null;
  }
};

export const getUserProgress = async (courseId = null, token) => {
  if (!token) throw new Error("Authentication required");
  try {
    const endpoint = courseId ? `/progress?courseId=${courseId}` : "/progress";
    return await apiRequest(endpoint, "GET", null, token);
  } catch (err) {
    console.error("Error fetching user progress:", err);
    throw err;
  }
};

// ==================== EXPORT FOR TESTING ====================

const apiExports = {
  generateCourseAI,
  generateLessonAI,
  getAllCourses,
  getCourseById,
  getUserCourses,
  saveCourse,
  deleteCourseById,
  updateCourse,
  getModulesByCourse,
  getModuleById,
  addModuleToCourse,
  deleteModuleById,
  getLessonsByModule,
  getLessonById,
  saveLesson,
  saveLessonWithContext,
  getUserSavedLessons,
  deleteLessonById,
  addLessonToModule,
  updateLesson,
  getUserProfile,
  updateUserProfile,
  markLessonComplete,
  getUserProgress,
};

export default apiExports;
