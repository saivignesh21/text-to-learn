import React, { useState, useRef, useEffect } from "react";
import { Send, Loader, AlertCircle, Sparkles } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { generateCourseAI } from "../utils/api";
import "./ChatPrompt.css";

const ChatPrompt = ({ 
  onResponse, 
  onGenerationStart, 
  onError,
  isGenerating = false 
}) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);
  const { getAccessToken, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        150
      ) + "px";
    }
  }, [prompt]);

  useEffect(() => {
    console.log("ChatPrompt mounted");
    console.log("API URL:", process.env.REACT_APP_API_URL || "DEFAULT: http://localhost:5000/api");
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!prompt.trim()) {
      setError("Please enter a topic to generate a course");
      return;
    }

    setError(null);
    setLoading(true);
    onGenerationStart?.();

    try {
      let token = null;
      if (isAuthenticated) {
        try {
          token = await getAccessToken();
        } catch (tokenError) {
          console.warn("Failed to get access token:", tokenError.message);
        }
      }

      const response = await generateCourseAI(prompt.trim(), token);
      const courseData = response?.data || response;

      if (!courseData) {
        throw new Error("No course returned. Please try again.");
      }

      setPrompt("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      onResponse?.(courseData);
    } catch (err) {
      const errorMessage = err.message || "Error fetching AI response. Please try again.";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (e) => {
    if (loading || isGenerating) {
      e.preventDefault();
    }
  };

  const isSubmitDisabled = loading || isGenerating || !prompt.trim();

  return (
    <div className="chat-prompt-wrapper">
      <form onSubmit={handleSubmit} className="chat-prompt-form">
        {error && (
          <div className="prompt-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="error-close-btn"
            >
              ✕
            </button>
          </div>
        )}

        <div className="prompt-input-container">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="What would you like to learn today? (e.g., 'Introduction to React Hooks', 'Python for Data Science')"
            className="prompt-textarea"
            disabled={loading || isGenerating}
            rows={1}
          />

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="prompt-submit-btn"
            title={loading || isGenerating ? "Generating course..." : "Generate course (Enter)"}
          >
            {loading || isGenerating ? (
              <>
                <Loader size={20} className="spinner-icon" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Generate</span>
              </>
            )}
          </button>
        </div>

        {!loading && !isGenerating && (
          <div className="prompt-helper-text">
            <span className="helper-icon">
              <Sparkles size={14} />
            </span>
            <span>
              Press <kbd>Enter</kbd> to generate
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatPrompt;