// frontend/hooks/useLessonData.js

import { useState, useEffect } from "react";

/**
 * Hook to fetch lesson data from API with proper error handling
 * @param {string} courseId - Course ID
 * @param {number} moduleIdx - Module index
 * @param {number} lessonIdx - Lesson index
 * @returns {object} { lesson, loading, error }
 */
export const useLessonData = (courseId, moduleIdx, lessonIdx) => {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) {
      setError("No course ID provided");
      setLoading(false);
      return;
    }

    const fetchLesson = async () => {
      try {
        setLoading(true);
        console.log("🔵 Fetching course:", courseId);

        // Fetch the full course with all lessons
        const response = await fetch(`/api/courses/${courseId}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const course = await response.json();

        console.log("✅ Course fetched:", {
          title: course.title,
          modules: course.modules.length,
        });

        // Navigate to specific lesson
        if (
          !course.modules ||
          !course.modules[moduleIdx] ||
          !course.modules[moduleIdx].lessons ||
          !course.modules[moduleIdx].lessons[lessonIdx]
        ) {
          throw new Error(
            `Lesson not found at modules[${moduleIdx}].lessons[${lessonIdx}]`
          );
        }

        const foundLesson = course.modules[moduleIdx].lessons[lessonIdx];

        console.log("📖 Lesson found:", {
          title: foundLesson.title,
          contentBlocks: foundLesson.content?.length || 0,
          objectives: foundLesson.objectives?.length || 0,
        });

        // 🔍 Validate content structure
        if (!foundLesson.content || !Array.isArray(foundLesson.content)) {
          console.error(
            "❌ Invalid content structure:",
            typeof foundLesson.content
          );
          throw new Error("Lesson content is not an array");
        }

        // 🔍 Validate content blocks
        const stats = {
          total: foundLesson.content.length,
          mcq: foundLesson.content.filter((b) => b.type === "mcq").length,
          code: foundLesson.content.filter((b) => b.type === "code").length,
          video: foundLesson.content.filter((b) => b.type === "video").length,
        };

        console.log("📊 Content statistics:", stats);

        // Check for empty blocks
        const emptyMCQs = foundLesson.content.filter(
          (b) => b.type === "mcq" && (!b.question || b.question.trim() === "")
        );
        const emptyCode = foundLesson.content.filter(
          (b) => b.type === "code" && (!b.code || b.code.trim() === "")
        );

        if (emptyMCQs.length > 0) {
          console.warn(`⚠️  Found ${emptyMCQs.length} empty MCQ blocks`);
        }
        if (emptyCode.length > 0) {
          console.warn(`⚠️  Found ${emptyCode.length} empty code blocks`);
        }

        setLesson(foundLesson);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching lesson:", err.message);
        setError(err.message);
        setLesson(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [courseId, moduleIdx, lessonIdx]);

  return { lesson, loading, error };
};

/**
 * Hook to fetch course metadata
 * @param {string} courseId - Course ID
 * @returns {object} { course, loading, error }
 */
export const useCourseData = (courseId) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) {
      setError("No course ID provided");
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setCourse(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError(err.message);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  return { course, loading, error };
};
