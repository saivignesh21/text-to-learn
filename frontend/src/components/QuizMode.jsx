import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  ChevronRight,
  RotateCcw,
  Zap,
  Target,
  AlertCircle,
} from "lucide-react";
import "./QuizMode.css";

const SECONDS_PER_QUESTION = 30;

// ─── Utility ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Result Screen ───────────────────────────────────────────────────────────

const ResultScreen = ({ questions, answers, timeTaken, onClose, onRetry }) => {
  const score = answers.filter(
    (a, i) => a === questions[i].answer
  ).length;
  const pct = Math.round((score / questions.length) * 100);

  const grade =
    pct >= 90 ? { label: "Excellent!", color: "gold", icon: "🏆" } :
    pct >= 70 ? { label: "Good job!", color: "green", icon: "✅" } :
    pct >= 50 ? { label: "Keep going!", color: "orange", icon: "📚" } :
                { label: "Try again!", color: "red", icon: "💪" };

  const mins = Math.floor(timeTaken / 60);
  const secs = timeTaken % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div className="qm-result">
      {/* Score ring */}
      <div className={`qm-score-ring qm-score-ring--${grade.color}`}>
        <span className="qm-score-pct">{pct}%</span>
        <span className="qm-score-label">Score</span>
      </div>

      <div className={`qm-grade qm-grade--${grade.color}`}>
        <span className="qm-grade-icon">{grade.icon}</span>
        <span>{grade.label}</span>
      </div>

      {/* Stats row */}
      <div className="qm-stats">
        <div className="qm-stat">
          <CheckCircle size={18} className="qm-stat-icon qm-stat-icon--green" />
          <span className="qm-stat-val">{score}</span>
          <span className="qm-stat-lbl">Correct</span>
        </div>
        <div className="qm-stat">
          <XCircle size={18} className="qm-stat-icon qm-stat-icon--red" />
          <span className="qm-stat-val">{questions.length - score}</span>
          <span className="qm-stat-lbl">Wrong</span>
        </div>
        <div className="qm-stat">
          <Clock size={18} className="qm-stat-icon qm-stat-icon--blue" />
          <span className="qm-stat-val">{timeStr}</span>
          <span className="qm-stat-lbl">Time</span>
        </div>
      </div>

      {/* Per-question review */}
      <div className="qm-review">
        <h3 className="qm-review-title">Review</h3>
        {questions.map((q, i) => {
          const correct = answers[i] === q.answer;
          return (
            <div key={i} className={`qm-review-item ${correct ? "qm-review-item--correct" : "qm-review-item--wrong"}`}>
              <div className="qm-review-header">
                {correct
                  ? <CheckCircle size={16} className="qm-ri-icon qm-ri-icon--green" />
                  : <XCircle size={16} className="qm-ri-icon qm-ri-icon--red" />
                }
                <span className="qm-ri-num">Q{i + 1}</span>
                <span className="qm-ri-q">{q.question}</span>
              </div>
              {!correct && (
                <div className="qm-review-detail">
                  {answers[i] !== null && answers[i] !== undefined ? (
                    <span className="qm-ri-wrong">
                      Your answer: <em>{q.options[answers[i]]}</em>
                    </span>
                  ) : (
                    <span className="qm-ri-wrong">Timed out</span>
                  )}
                  <span className="qm-ri-correct">
                    Correct: <em>{q.options[q.answer]}</em>
                  </span>
                  {q.explanation && (
                    <span className="qm-ri-explanation">{q.explanation}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="qm-result-actions">
        <button className="qm-btn qm-btn--ghost" onClick={onRetry}>
          <RotateCcw size={16} /> Retry Quiz
        </button>
        <button className="qm-btn qm-btn--primary" onClick={onClose}>
          Back to Lesson
        </button>
      </div>
    </div>
  );
};

// ─── Main QuizMode ───────────────────────────────────────────────────────────

const QuizMode = ({ lesson, onClose }) => {
  // Extract and validate MCQs from lesson content
  const questions = React.useMemo(() => {
    const raw = lesson?.content || [];
    return raw.filter(
      (b) =>
        b.type === "mcq" &&
        b.question?.trim() &&
        Array.isArray(b.options) &&
        b.options.length === 4 &&
        typeof b.answer === "number"
    );
  }, [lesson]);

  const [phase, setPhase] = useState("intro"); // intro | question | result
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef(null);

  // Clear timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  const goNext = useCallback(() => {
    if (idx + 1 >= questions.length) {
      clearInterval(timerRef.current);
      setTotalTime(Math.round((Date.now() - startTime) / 1000));
      setPhase("result");
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
      setTimeLeft(SECONDS_PER_QUESTION);
    }
  }, [idx, questions.length, startTime]);

  // Timer tick
  useEffect(() => {
    if (phase !== "question") return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // Time's up — record null answer
          setAnswers((prev) => {
            const next = [...prev];
            next[idx] = null;
            return next;
          });
          setAnswered(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, idx]); // eslint-disable-line

  const handleStart = () => {
    setPhase("question");
    setIdx(0);
    setSelected(null);
    setAnswered(false);
    setAnswers([]);
    setTimeLeft(SECONDS_PER_QUESTION);
    setStartTime(Date.now());
  };

  const handleSelect = (optIdx) => {
    if (answered) return;
    clearInterval(timerRef.current);
    setSelected(optIdx);
    setAnswered(true);
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = optIdx;
      return next;
    });
  };

  const handleRetry = () => {
    setPhase("intro");
    setIdx(0);
    setSelected(null);
    setAnswered(false);
    setAnswers([]);
    setTimeLeft(SECONDS_PER_QUESTION);
  };

  // ── Intro screen ──
  if (phase === "intro") {
    if (questions.length === 0) {
      return (
        <div className="qm-overlay">
          <div className="qm-modal">
            <button className="qm-close" onClick={onClose}><X size={20} /></button>
            <div className="qm-empty">
              <AlertCircle size={40} />
              <h2>No questions found</h2>
              <p>This lesson doesn't have any quiz questions yet. Generate a lesson to get MCQs.</p>
              <button className="qm-btn qm-btn--primary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="qm-overlay">
        <div className="qm-modal">
          <button className="qm-close" onClick={onClose}><X size={20} /></button>
          <div className="qm-intro">
            <div className="qm-intro-icon"><Zap size={32} /></div>
            <h2 className="qm-intro-title">Quiz Mode</h2>
            <p className="qm-intro-lesson">{lesson?.title}</p>

            <div className="qm-intro-stats">
              <div className="qm-intro-stat">
                <Target size={18} />
                <span><strong>{questions.length}</strong> questions</span>
              </div>
              <div className="qm-intro-stat">
                <Clock size={18} />
                <span><strong>{SECONDS_PER_QUESTION}s</strong> per question</span>
              </div>
              <div className="qm-intro-stat">
                <Trophy size={18} />
                <span>Score tracked</span>
              </div>
            </div>

            <p className="qm-intro-tip">
              Each question has a {SECONDS_PER_QUESTION}-second timer. Unanswered questions count as wrong.
            </p>

            <button className="qm-btn qm-btn--primary qm-btn--large" onClick={handleStart}>
              Start Quiz <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Result screen ──
  if (phase === "result") {
    return (
      <div className="qm-overlay">
        <div className="qm-modal qm-modal--wide">
          <button className="qm-close" onClick={onClose}><X size={20} /></button>
          <ResultScreen
            questions={questions}
            answers={answers}
            timeTaken={totalTime}
            onClose={onClose}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  // ── Question screen ──
  const q = questions[idx];
  const timerPct = (timeLeft / SECONDS_PER_QUESTION) * 100;
  const timerDanger = timeLeft <= 10;

  return (
    <div className="qm-overlay">
      <div className="qm-modal">
        <button className="qm-close" onClick={onClose}><X size={20} /></button>

        {/* Progress bar */}
        <div className="qm-progress">
          <div className="qm-progress-bar">
            <div
              className="qm-progress-fill"
              style={{ width: `${((idx) / questions.length) * 100}%` }}
            />
          </div>
          <span className="qm-progress-label">{idx + 1} / {questions.length}</span>
        </div>

        {/* Timer */}
        <div className={`qm-timer ${timerDanger ? "qm-timer--danger" : ""}`}>
          <div className="qm-timer-ring">
            <svg viewBox="0 0 44 44" width="44" height="44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
              <circle
                cx="22" cy="22" r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - timerPct / 100)}`}
                style={{ transition: "stroke-dashoffset 1s linear", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
              />
            </svg>
            <span className="qm-timer-num">{timeLeft}</span>
          </div>
        </div>

        {/* Question */}
        <div className="qm-question-body">
          <p className="qm-q-num">Question {idx + 1}</p>
          <h2 className="qm-q-text">{q.question}</h2>
        </div>

        {/* Options */}
        <div className="qm-options">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.answer;
            let cls = "qm-option";
            if (answered) {
              if (isCorrect) cls += " qm-option--correct";
              else if (isSelected) cls += " qm-option--wrong";
              else cls += " qm-option--dim";
            } else {
              cls += " qm-option--interactive";
            }
            return (
              <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={answered}>
                <span className="qm-opt-letter">{String.fromCharCode(65 + i)}</span>
                <span className="qm-opt-text">{opt}</span>
                {answered && isCorrect && <CheckCircle size={18} className="qm-opt-icon qm-opt-icon--green" />}
                {answered && isSelected && !isCorrect && <XCircle size={18} className="qm-opt-icon qm-opt-icon--red" />}
              </button>
            );
          })}
        </div>

        {/* Timeout message */}
        {answered && selected === null && (
          <div className="qm-timeout-msg">
            <Clock size={16} /> Time's up! The correct answer was <strong>{String.fromCharCode(65 + q.answer)}</strong>
          </div>
        )}

        {/* Explanation */}
        {answered && q.explanation && (
          <div className="qm-explanation">
            <span className="qm-exp-label">Explanation</span>
            <p>{q.explanation}</p>
          </div>
        )}

        {/* Next button */}
        {answered && (
          <button className="qm-btn qm-btn--primary qm-next-btn" onClick={goNext}>
            {idx + 1 >= questions.length ? (
              <><Trophy size={16} /> See Results</>
            ) : (
              <>Next <ChevronRight size={16} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizMode;