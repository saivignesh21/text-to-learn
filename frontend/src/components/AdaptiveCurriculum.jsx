import React, { useState, useEffect } from 'react';
import { Compass, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { generateAdaptivePaths, generateLessonAI, addLessonToModule } from '../utils/api';
import './AdaptiveCurriculum.css';

const AdaptiveCurriculum = ({ course, module, lesson, onPathGenerated }) => {
  const [paths, setPaths] = useState([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [error, setError] = useState(null);
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    // Only fetch paths if we have a valid lesson
    if (course && lesson && paths.length === 0 && !isLoadingPaths && !error) {
      fetchPaths();
    }
  }, [lesson, course]);

  const fetchPaths = async () => {
    setIsLoadingPaths(true);
    setError(null);
    try {
      const token = isAuthenticated ? await getAccessTokenSilently() : null;
      const response = await generateAdaptivePaths(course.title, lesson.title, token);
      if (response.success && Array.isArray(response.data)) {
        setPaths(response.data);
      } else {
        setError("Failed to fetch adaptive paths.");
      }
    } catch (err) {
      console.error("Error fetching paths:", err);
      setError("Could not load your next adventure.");
    } finally {
      setIsLoadingPaths(false);
    }
  };

  const handleSelectPath = async (path) => {
    if (!isAuthenticated) {
      alert("Please log in to generate custom lessons.");
      return;
    }

    setIsGeneratingLesson(true);
    setSelectedPath(path);
    setError(null);

    try {
      const token = await getAccessTokenSilently();
      
      // 1. Generate the lesson via AI
      const lessonResponse = await generateLessonAI(
        course.title,
        module.title,
        path.title,
        token
      );

      if (!lessonResponse.success) {
        throw new Error("AI failed to generate the lesson.");
      }

      const generatedLessonData = lessonResponse.data;

      // 2. Add it to the module permanently
      if (module._id) {
        await addLessonToModule(module._id, generatedLessonData, token);
      }

      // 3. Notify parent to refresh course state or navigate
      if (onPathGenerated) {
        onPathGenerated();
      }

    } catch (err) {
      console.error("Error generating chosen path:", err);
      setError("Failed to generate your custom lesson. Please try again.");
    } finally {
      setIsGeneratingLesson(false);
      setSelectedPath(null);
    }
  };

  const getPathClass = (type) => {
    const lower = type.toLowerCase();
    if (lower.includes('deep')) return 'deep-dive';
    if (lower.includes('practical')) return 'practical-application';
    if (lower.includes('lateral')) return 'lateral-concept';
    return '';
  };

  if (!course || !lesson) return null;

  return (
    <div className="adaptive-curriculum-container">
      <div className="adaptive-header">
        <Compass size={28} className="text-orange-400" />
        <h2 className="adaptive-title">Choose Your Next Adventure</h2>
      </div>
      
      <p className="adaptive-description">
        You've completed this lesson. Where do you want to go next? 
        Select a path below and the AI will dynamically generate a brand new lesson specifically for you.
      </p>

      {isLoadingPaths ? (
        <div className="adaptive-loading">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <p>Analyzing context and calculating possible paths...</p>
        </div>
      ) : isGeneratingLesson ? (
        <div className="adaptive-loading">
          <Loader2 size={32} className="animate-spin text-green-400" />
          <p>Generating your custom lesson: <strong>{selectedPath?.title}</strong>...</p>
        </div>
      ) : error ? (
        <div className="text-red-400 p-4 bg-red-900/20 rounded">
          {error}
          <button 
            onClick={fetchPaths}
            className="ml-4 text-indigo-300 underline"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="adaptive-paths-grid">
          {paths.map((path, idx) => (
            <div 
              key={idx} 
              className={`path-card ${getPathClass(path.type)}`}
              onClick={() => handleSelectPath(path)}
            >
              <div className="path-type">{path.type}</div>
              <div className="path-title">{path.title}</div>
              <div className="path-description">{path.description}</div>
              <div className="path-action">
                Explore this path <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdaptiveCurriculum;
