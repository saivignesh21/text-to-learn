import React, { useState, useRef, useEffect } from "react";
import {
  Volume2,
  Loader,
  AlertCircle,
  ChevronDown,
  Download,
  Pause,
  Play,
} from "lucide-react";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import "./HinglishTranslator.css";

const HinglishTranslator = ({ lesson = {} }) => {
  const [expanded, setExpanded] = useState(false);
  const [hinglishText, setHinglishText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioUsingServerTTS, setAudioUsingServerTTS] = useState(false);
  const audioRef = useRef(null);
  const { speak, stop, isSupported } = useSpeechSynthesis();

  // 🔧 FIX: Reset translator state when lesson changes (WITHOUT stop dependency)
  useEffect(() => {
    console.log("📝 Lesson changed, resetting Hinglish translator");
    setExpanded(false);
    setHinglishText(null);
    setError(null);
    setAudioPlaying(false);
    setAudioUsingServerTTS(false);
    
    // Stop audio without adding stop to dependency array
    window.speechSynthesis?.cancel();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [lesson?._id]); // ✅ ONLY lesson ID dependency - fixes infinite loop

  // Extract text from lesson content
  const extractLessonText = () => {
    if (!lesson || !Array.isArray(lesson.content)) {
      console.warn("No lesson content available");
      return "";
    }

    const textContent = lesson.content
      .filter((block) => ["paragraph", "heading"].includes(block.type))
      .map((block) => block.text || block.title || "")
      .filter((text) => text.trim().length > 0);

    console.log(`📚 Extracted ${textContent.length} text blocks from lesson`);

    const fullText = textContent.join("\n\n");

    console.log(
      `📏 Total text length: ${fullText.length} characters (${textContent.length} blocks)`
    );

    return fullText;
  };

  const handleTranslateToHinglish = async () => {
    try {
      setLoading(true);
      setError(null);
      setHinglishText(null);
      setAudioPlaying(false);

      const text = extractLessonText();
      if (!text) {
        setError("No lesson content available to translate");
        console.warn("No text extracted for translation");
        return;
      }

      const API_URL =
        process.env.REACT_APP_API_URL || "http://localhost:5000/api";

      console.log("🌐 Translating to Hinglish...");
      console.log(`   Lesson: ${lesson.title}`);
      console.log(`   Text length: ${text.length} characters`);

      const response = await fetch(`${API_URL}/enrichment/translate-hinglish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          lessonTitle: lesson.title,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setHinglishText(data.data.hinglishText);
        console.log(
          `✅ Hinglish translation completed (${data.data.hinglishText.length} characters)`
        );
      } else {
        throw new Error(data.message || "Translation failed");
      }
    } catch (err) {
      console.error("❌ Translation error:", err);
      setError(err.message || "Failed to translate to Hinglish");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 NEW: Play using Browser Web Speech API (PRIMARY)
  const handlePlayBrowserAudio = () => {
    if (!hinglishText) {
      setError("Please translate to Hinglish first");
      return;
    }

    if (!isSupported()) {
      setError(
        "⚠️  Web Speech API not supported in your browser. Please use Chrome, Firefox, Safari, or Edge."
      );
      return;
    }

    if (audioPlaying) {
      stop();
      setAudioPlaying(false);
      setAudioUsingServerTTS(false);
    } else {
      console.log("🎤 Playing with Browser Web Speech API...");
      const success = speak(hinglishText, "hi-IN");
      if (success) {
        setAudioPlaying(true);
        setAudioUsingServerTTS(false);
      } else {
        setError("Failed to play audio");
      }
    }
  };

  const handleAudioEnded = () => {
    setAudioPlaying(false);
    setAudioUsingServerTTS(false);
  };

  return (
    <div className="hinglish-translator-container">
      {/* Hidden audio element for server TTS */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPlay={() => setAudioPlaying(true)}
        onPause={() => setAudioPlaying(false)}
      />

      {/* Toggle Button */}
      <button
        onClick={() => {
          console.log("🔘 Toggle button clicked! Current expanded:", expanded);
          setExpanded(!expanded);
        }}
        className="hinglish-toggle-button"
        title="Expand Hinglish translation"
      >
        <div className="hinglish-toggle-content">
          <span className="hinglish-icon">🇮🇳 हिंग्लिश</span>
          <span className="hinglish-label">Hindi-English Explanation</span>
        </div>
        <ChevronDown
          size={20}
          className={`toggle-chevron ${expanded ? "expanded" : ""}`}
        />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="hinglish-content">
          {/* Translate Button */}
          {!hinglishText && (
            <button
              onClick={handleTranslateToHinglish}
              disabled={loading}
              className="hinglish-action-button translate-btn"
            >
              {loading ? (
                <>
                  <Loader size={16} className="icon-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <span>🌐</span>
                  <span>Translate to Hinglish</span>
                </>
              )}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="hinglish-error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Hinglish Text Box */}
          {hinglishText && (
            <div className="hinglish-text-box">
              <h4 className="hinglish-text-title">📝 Hinglish Explanation:</h4>
              <div className="hinglish-text-content">
                {hinglishText.split("\n").map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>

              {/* Audio Controls */}
              <div className="hinglish-audio-controls">
                {/* PRIMARY: Browser Web Speech API Button - ONLY THIS */}
                <button
                  onClick={handlePlayBrowserAudio}
                  className={`hinglish-audio-button browser-tts ${
                    audioPlaying && !audioUsingServerTTS ? "active" : ""
                  }`}
                  title="Play using browser voice (instant, no server needed)"
                >
                  {audioPlaying && !audioUsingServerTTS ? (
                    <>
                      <Pause size={16} />
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} />
                      <span>🎙️ Play Audio</span>
                    </>
                  )}
                </button>
              </div>

              {/* New Translation Button */}
              <button
                onClick={() => {
                  setHinglishText(null);
                  setAudioPlaying(false);
                  setAudioUsingServerTTS(false);
                  window.speechSynthesis?.cancel();
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = "";
                  }
                }}
                className="hinglish-reset-button"
              >
                🔄 Translate Another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HinglishTranslator;