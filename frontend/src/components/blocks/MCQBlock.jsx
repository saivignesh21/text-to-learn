import React, { useState, useEffect } from "react";
import { HelpCircle, CheckCircle, XCircle } from "lucide-react";
import "./MCQBlock.css";

const MCQBlock = ({ 
  question = "", 
  options = [], 
  answer = null,
  explanation = "" 
}) => {
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answered, setAnswered] = useState(false);

  // 🔍 Enhanced debug logging - runs on every render
  useEffect(() => {
    console.group("❓ MCQBlock Debug Info");
    console.log("Raw question prop:", JSON.stringify(question));
    console.log("Question type:", typeof question);
    console.log("Question length:", question?.length || 0);
    console.log("Question after trim:", JSON.stringify(question?.trim?.()));
    console.log("Options array:", options);
    console.log("Options count:", options?.length || 0);
    console.log("Answer index:", answer);
    console.log("Explanation:", explanation);
    console.groupEnd();
  }, [question, options, answer, explanation]);

  // 🔧 FIX: Stricter validation
  const hasValidQuestion = 
    question && 
    typeof question === "string" && 
    question.trim().length > 0;
    
  const hasValidOptions = 
    Array.isArray(options) && 
    options.length === 4 && 
    options.every(opt => opt && typeof opt === "string" && opt.trim().length > 0);

  const hasValidAnswer = 
    typeof answer === "number" && 
    answer >= 0 && 
    answer <= 3;

  // 🔴 If invalid, show detailed error
  if (!hasValidQuestion || !hasValidOptions || !hasValidAnswer) {
    console.warn("❌ MCQ Block Invalid - Showing empty state");
    console.warn({
      hasValidQuestion,
      hasValidOptions,
      hasValidAnswer,
      questionIssue: !hasValidQuestion ? (
        question ? "Empty after trim" : "Missing"
      ) : "OK",
      optionsIssue: !hasValidOptions ? (
        `Got ${options?.length || 0}/4, or some are empty`
      ) : "OK",
      answerIssue: !hasValidAnswer ? (
        `Invalid answer index: ${answer}`
      ) : "OK",
    });

    return (
      <div className="mcq-block-container mcq-empty">
        <div className="mcq-question">
          <HelpCircle size={24} className="question-icon" />
          <h3>Question not available</h3>
          <div style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
            {!hasValidQuestion && (
              <p>❌ Question: {question ? "Empty or whitespace only" : "Missing"}</p>
            )}
            {!hasValidOptions && (
              <p>❌ Options: Expected 4, got {options?.length || 0}</p>
            )}
            {!hasValidAnswer && (
              <p>❌ Answer: Invalid index {answer}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ✅ Valid MCQ - proceed with rendering
  const isCorrect = (index) => index === answer;
  const correctLetter = String.fromCharCode(65 + (answer || 0));

  const handleSelectOption = (index) => {
    if (!answered) {
      setSelected(index);
      setAnswered(true);
    }
  };

  const handleReset = () => {
    setSelected(null);
    setAnswered(false);
    setShowExplanation(false);
  };

  return (
    <div className="mcq-block-container">
      {/* Question Section */}
      <div className="mcq-question">
        <HelpCircle size={24} className="question-icon" />
        <h3>{question}</h3>
      </div>

      {/* Options Section */}
      {options && options.length > 0 ? (
        <div className="mcq-options">
          {options.map((option, index) => {
            const selected_state = selected === index;
            const is_correct = isCorrect(index);
            const show_result = answered && selected_state;

            let optionClass = "mcq-option";
            if (show_result) {
              optionClass += is_correct ? " correct" : " incorrect";
            } else if (!answered) {
              optionClass += " interactive";
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectOption(index)}
                disabled={answered}
                className={optionClass}
                aria-pressed={selected_state}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
                {show_result && (
                  is_correct ? (
                    <CheckCircle size={20} className="option-icon correct-icon" />
                  ) : (
                    <XCircle size={20} className="option-icon incorrect-icon" />
                  )
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mcq-options-empty">
          <p>No options available for this question</p>
        </div>
      )}

      {/* Feedback Section */}
      {answered && (
        <div className="mcq-feedback">
          <div className={`feedback-status ${selected === answer ? "correct" : "incorrect"}`}>
            {selected === answer ? (
              <>
                <CheckCircle size={20} />
                <span>Correct! Well done!</span>
              </>
            ) : (
              <>
                <XCircle size={20} />
                <span>Incorrect. The correct answer is <strong>{correctLetter}</strong></span>
              </>
            )}
          </div>

          {explanation && explanation.trim() !== "" && (
            <div className="explanation-section">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="explanation-toggle"
              >
                {showExplanation ? "Hide Explanation" : "Show Explanation"}
              </button>
              {showExplanation && (
                <div className="explanation-content">
                  <p><strong>Why is this the answer?</strong></p>
                  <p>{explanation}</p>
                </div>
              )}
            </div>
          )}

          <button onClick={handleReset} className="mcq-reset-btn">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default MCQBlock;