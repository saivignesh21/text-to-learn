import React, { useState, useRef, useCallback } from "react";
import {
  Upload, FileText, Loader, Sparkles, Brain,
  ChevronRight, Trophy, RotateCcw,
  CheckCircle, XCircle, Clock, Target,
  AlertCircle, X, BookOpen
} from "lucide-react";
import "./QuizGenerator.css";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const SECONDS = 30;

const DIFFICULTIES = [
  { key: "easy",   label: "Easy",   icon: "🌱", desc: "Basic recall & definitions", color: "green"  },
  { key: "medium", label: "Medium", icon: "⚡", desc: "Concepts & application",      color: "yellow" },
  { key: "hard",   label: "Hard",   icon: "🔥", desc: "Analysis & edge cases",       color: "red"    },
];
const COUNTS = [5, 10, 15, 20];

/* ─── Upload Screen ─────────────────────────────────────────────────────────── */
const UploadScreen = ({ onGenerate, loading }) => {
  const [file, setFile]           = useState(null);
  const [textInput, setTextInput] = useState("");
  const [difficulty, setDiff]     = useState("medium");
  const [count, setCount]         = useState(10);
  const [dragOver, setDragOver]   = useState(false);
  const [mode, setMode]           = useState("file");
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.match(/\.(pdf|txt|md)$/i);
    if (!ext) { alert("Only PDF, TXT, and MD files are supported."); return; }
    setFile(f);
  };

  const canSubmit = (mode === "file" && file) || (mode === "text" && textInput.trim().length > 50);

  return (
    <div className="qg-upload">
      <div className="qg-hero">
        <div className="qg-hero-icon"><Brain size={28} /></div>
        <h1 className="qg-hero-title">Quiz from Study Material</h1>
        <p className="qg-hero-sub">Upload a PDF, paste notes, or drop a text file — get an interactive quiz in seconds.</p>
      </div>

      <div className="qg-card">
        {/* Tabs */}
        <div className="qg-tabs">
          <button className={`qg-tab ${mode === "file" ? "active" : ""}`} onClick={() => setMode("file")}>
            <Upload size={14} /> Upload File
          </button>
          <button className={`qg-tab ${mode === "text" ? "active" : ""}`} onClick={() => setMode("text")}>
            <FileText size={14} /> Paste Text
          </button>
        </div>

        {mode === "file" ? (
          <div
            className={`qg-dropzone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => !file && fileRef.current.click()}
          >
            <input ref={fileRef} type="file" accept=".pdf,.txt,.md" style={{ display:"none" }} onChange={(e) => handleFile(e.target.files[0])} />
            {file ? (
              <div className="qg-file-preview">
                <FileText size={26} className="qg-file-icon" />
                <div className="qg-file-info">
                  <p className="qg-file-name">{file.name}</p>
                  <p className="qg-file-size">{(file.size/1024).toFixed(1)} KB</p>
                </div>
                <button className="qg-file-remove" onClick={(e)=>{ e.stopPropagation(); setFile(null); }}><X size={15}/></button>
              </div>
            ) : (
              <div className="qg-drop-content">
                <Upload size={28} className="qg-drop-icon" />
                <p className="qg-drop-title">Drop your file here</p>
                <p className="qg-drop-sub">PDF, TXT, or MD — up to 10MB</p>
                <span className="qg-drop-btn">Browse Files</span>
              </div>
            )}
          </div>
        ) : (
          <textarea
            className="qg-textarea"
            placeholder="Paste your study material, notes, or any text here (minimum 50 characters)..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={8}
          />
        )}

        {/* Difficulty */}
        <div className="qg-section">
          <p className="qg-section-label">Difficulty Level</p>
          <div className="qg-diff-grid">
            {DIFFICULTIES.map((d) => (
              <button key={d.key} className={`qg-diff-btn qg-diff-btn--${d.color} ${difficulty===d.key?"active":""}`} onClick={() => setDiff(d.key)}>
                <span className="qg-diff-icon">{d.icon}</span>
                <span className="qg-diff-label">{d.label}</span>
                <span className="qg-diff-desc">{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="qg-section">
          <p className="qg-section-label">Number of Questions</p>
          <div className="qg-count-row">
            {COUNTS.map((n) => (
              <button key={n} className={`qg-count-btn ${count===n?"active":""}`} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
        </div>

        <button className="qg-gen-btn" onClick={() => onGenerate({ file: mode==="file"?file:null, textInput: mode==="text"?textInput:"", difficulty, count })} disabled={!canSubmit||loading}>
          {loading ? <><Loader size={17} className="qg-spin"/> Generating Quiz...</> : <><Sparkles size={17}/> Generate {count} Questions</>}
        </button>
      </div>
    </div>
  );
};

/* ─── Quiz Player ────────────────────────────────────────────────────────────── */
const QuizPlayer = ({ quiz, onRestart }) => {
  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers]   = useState([]);
  const [phase, setPhase]       = useState("playing");
  const [timeLeft, setTime]     = useState(SECONDS);
  const [startTime]             = useState(Date.now());
  const [totalTime, setTotal]   = useState(0);
  const timerRef = useRef(null);
  const questions = quiz.questions;

  const goNext = useCallback(() => {
    if (idx + 1 >= questions.length) {
      clearInterval(timerRef.current);
      setTotal(Math.round((Date.now()-startTime)/1000));
      setPhase("result");
    } else {
      setIdx(i => i+1); setSelected(null); setAnswered(false); setTime(SECONDS);
    }
  }, [idx, questions.length, startTime]);

  React.useEffect(() => {
    if (phase !== "playing") return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setAnswers(prev => { const n=[...prev]; n[idx]=null; return n; });
          setAnswered(true); return 0;
        }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, idx]); // eslint-disable-line

  const handleSelect = (i) => {
    if (answered) return;
    clearInterval(timerRef.current);
    setSelected(i); setAnswered(true);
    setAnswers(prev => { const n=[...prev]; n[idx]=i; return n; });
  };

  const retryQuiz = () => { setPhase("playing"); setIdx(0); setSelected(null); setAnswered(false); setAnswers([]); setTime(SECONDS); };

  /* ── Result ── */
  if (phase === "result") {
    const score = answers.filter((a,i) => a===questions[i].answer).length;
    const pct   = Math.round((score/questions.length)*100);
    const mins  = Math.floor(totalTime/60), secs = totalTime%60;
    const grade = pct>=90?{l:"Outstanding!",c:"gold",e:"🏆"}:pct>=70?{l:"Well done!",c:"green",e:"✅"}:pct>=50?{l:"Keep going!",c:"yellow",e:"📚"}:{l:"Try again!",c:"red",e:"💪"};
    const diff  = DIFFICULTIES.find(d => d.key===quiz.difficulty);

    return (
      <div className="qg-result">
        <div className="qg-result-inner">
          <div className={`qg-ring qg-ring--${grade.c}`}>
            <span className="qg-ring-pct">{pct}%</span>
            <span className="qg-ring-lbl">Score</span>
          </div>
          <div className={`qg-grade qg-grade--${grade.c}`}>{grade.e} {grade.l}</div>
          <div className="qg-result-meta">
            <span className="qg-result-topic">{quiz.title}</span>
            <span className={`qg-dpill qg-dpill--${quiz.difficulty}`}>{diff?.icon} {quiz.difficulty}</span>
          </div>
          <div className="qg-result-stats">
            <div className="qg-rstat qg-rstat--green"><CheckCircle size={15}/><b>{score}</b><span>Correct</span></div>
            <div className="qg-rstat qg-rstat--red"><XCircle size={15}/><b>{questions.length-score}</b><span>Wrong</span></div>
            <div className="qg-rstat qg-rstat--blue"><Clock size={15}/><b>{mins>0?`${mins}m ${secs}s`:`${secs}s`}</b><span>Time</span></div>
            <div className="qg-rstat qg-rstat--purple"><Target size={15}/><b>{questions.length}</b><span>Total</span></div>
          </div>

          <div className="qg-review">
            <p className="qg-review-title">Question Review</p>
            {questions.map((q,i) => {
              const ok = answers[i]===q.answer;
              return (
                <div key={i} className={`qg-ri ${ok?"qg-ri--ok":"qg-ri--bad"}`}>
                  <div className="qg-ri-row">
                    {ok?<CheckCircle size={13} className="qg-ri-icon green"/>:<XCircle size={13} className="qg-ri-icon red"/>}
                    <span className="qg-ri-num">Q{i+1}</span>
                    <span className="qg-ri-q">{q.question}</span>
                    {q.topic_tag && <span className="qg-ttag">{q.topic_tag}</span>}
                  </div>
                  {!ok && (
                    <div className="qg-ri-detail">
                      {answers[i]!=null?<span className="qg-wrong-ans">Your answer: <em>{q.options[answers[i]]}</em></span>:<span className="qg-wrong-ans">Timed out</span>}
                      <span className="qg-correct-ans">Correct: <em>{q.options[q.answer]}</em></span>
                      {q.explanation && <span className="qg-exp-text">{q.explanation}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="qg-result-btns">
            <button className="qg-btn qg-btn--ghost" onClick={onRestart}><RotateCcw size={14}/> New Quiz</button>
            <button className="qg-btn qg-btn--primary" onClick={retryQuiz}><RotateCcw size={14}/> Retry</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Playing ── */
  const q = questions[idx];
  const timerPct = (timeLeft/SECONDS)*100;
  const danger   = timeLeft <= 8;
  const diff     = DIFFICULTIES.find(d => d.key===quiz.difficulty);

  return (
    <div className="qg-player">
      <div className="qg-player-top">
        <div className="qg-player-meta">
          <BookOpen size={14}/>
          <span className="qg-player-ttl">{quiz.title}</span>
          <span className={`qg-dpill qg-dpill--${quiz.difficulty}`}>{diff?.icon} {quiz.difficulty}</span>
        </div>
        <button className="qg-exit" onClick={onRestart} title="Exit"><X size={15}/></button>
      </div>

      <div className="qg-prog">
        <div className="qg-prog-bar"><div className="qg-prog-fill" style={{width:`${(idx/questions.length)*100}%`}}/></div>
        <span className="qg-prog-lbl">{idx+1}/{questions.length}</span>
      </div>

      <div className="qg-player-body">
        {/* Timer ring */}
        <div className={`qg-timer ${danger?"qg-timer--danger":""}`}>
          <svg viewBox="0 0 44 44" width="52" height="52">
            <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3"/>
            <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${2*Math.PI*18}`}
              strokeDashoffset={`${2*Math.PI*18*(1-timerPct/100)}`}
              style={{transition:"stroke-dashoffset 1s linear",transform:"rotate(-90deg)",transformOrigin:"50% 50%"}}/>
          </svg>
          <span className="qg-timer-num">{timeLeft}</span>
        </div>

        {/* Question */}
        <div className="qg-q-area">
          <p className="qg-q-num">Question {idx+1}</p>
          <h2 className="qg-q-text">{q.question}</h2>
          {q.topic_tag && <span className="qg-ttag qg-ttag--inline">{q.topic_tag}</span>}
        </div>

        {/* Options */}
        <div className="qg-opts">
          {q.options.map((opt,i) => {
            let cls = "qg-opt";
            if (answered) {
              if (i===q.answer) cls += " qg-opt--correct";
              else if (i===selected) cls += " qg-opt--wrong";
              else cls += " qg-opt--dim";
            } else cls += " qg-opt--live";
            return (
              <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={answered}>
                <span className="qg-opt-letter">{String.fromCharCode(65+i)}</span>
                <span className="qg-opt-text">{opt}</span>
                {answered && i===q.answer && <CheckCircle size={15} className="qg-opt-icon green"/>}
                {answered && i===selected && i!==q.answer && <XCircle size={15} className="qg-opt-icon red"/>}
              </button>
            );
          })}
        </div>

        {answered && selected===null && (
          <div className="qg-timeout"><Clock size={13}/> Time's up! Correct: <strong>{String.fromCharCode(65+q.answer)}</strong></div>
        )}

        {answered && q.explanation && (
          <div className="qg-expl">
            <span className="qg-expl-label">Explanation</span>
            <p>{q.explanation}</p>
          </div>
        )}

        {answered && (
          <button className="qg-btn qg-btn--primary qg-next-btn" onClick={goNext}>
            {idx+1>=questions.length ? <><Trophy size={14}/> See Results</> : <>Next <ChevronRight size={14}/></>}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
const QuizGenerator = () => {
  const [phase, setPhase] = useState("upload");
  const [quiz, setQuiz]   = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async ({ file, textInput, difficulty, count }) => {
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      if (file)      fd.append("file", file);
      if (textInput) fd.append("text_input", textInput);
      fd.append("difficulty", difficulty);
      fd.append("count", count);

      const res  = await fetch(`${BASE_URL}/quiz/generate`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to generate quiz");
      setQuiz(data.quiz); setPhase("quiz");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qg-page">
      {error && (
        <div className="qg-error-banner">
          <AlertCircle size={16}/> {error}
          <button onClick={() => setError(null)}><X size={14}/></button>
        </div>
      )}
      {phase==="upload" && <UploadScreen onGenerate={handleGenerate} loading={loading}/>}
      {phase==="quiz"   && quiz && <QuizPlayer quiz={quiz} onRestart={() => { setPhase("upload"); setQuiz(null); setError(null); }}/>}
    </div>
  );
};

export default QuizGenerator;