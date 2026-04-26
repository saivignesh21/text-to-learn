import React, { useState } from 'react';
import { Send, UserCircle, BrainCircuit } from 'lucide-react';
import { submitFeynmanExplanation } from '../utils/api';
import './FeynmanSimulator.css';

const FeynmanSimulator = ({ lesson }) => {
  const [explanation, setExplanation] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!explanation.trim()) return;

    setIsEvaluating(true);
    setError(null);
    setFeedback(null);

    try {
      // In a real app, you might want to pass the Auth0 token here
      const result = await submitFeynmanExplanation(
        lesson.title,
        lesson.content,
        explanation
      );

      if (result.success) {
        setFeedback(result.data);
      } else {
        setError(result.message || "Failed to evaluate explanation.");
      }
    } catch (err) {
      console.error("Feynman simulation error:", err);
      setError("An error occurred while evaluating your explanation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!lesson) return null;

  return (
    <div className="feynman-simulator-container">
      <div className="feynman-header">
        <BrainCircuit size={28} className="text-indigo-400" />
        <h2 className="feynman-title">Feynman Technique Simulator</h2>
      </div>
      
      <p className="feynman-description">
        The best way to verify you understand <strong>{lesson.title}</strong> is to teach it. 
        Explain the concept below as if you were teaching a beginner. Our AI "student" will review your explanation, ask clarifying questions if confused, and grade your understanding.
      </p>

      <textarea
        className="feynman-textarea"
        placeholder="Type your explanation here..."
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        disabled={isEvaluating}
      />

      <button 
        className="feynman-submit-btn" 
        onClick={handleSubmit}
        disabled={isEvaluating || !explanation.trim()}
      >
        <Send size={18} />
        {isEvaluating ? 'The student is reading...' : 'Teach the Student'}
      </button>

      {error && (
        <div className="error mt-4 text-red-400">
          {error}
        </div>
      )}

      {feedback && (
        <div className="feynman-feedback-container">
          <div className="feynman-feedback-header">
            <div className="feynman-student-label">
              <UserCircle size={20} />
              <span>AI Student</span>
            </div>
            {feedback.grade && (
              <div className={`feynman-grade grade-${feedback.grade.charAt(0)}`}>
                Grade: {feedback.grade}
              </div>
            )}
          </div>

          <div className="feynman-feedback-text">
            {feedback.feedback}
          </div>

          {feedback.followUpQuestion && (
            <div className="feynman-followup">
              <div className="feynman-followup-title">Curious Question:</div>
              <p>{feedback.followUpQuestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeynmanSimulator;
