import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import ReactMarkdown from 'react-markdown';
import { askStudyBuddy } from '../utils/api';
import './StudyBuddy.css';

const StudyBuddy = ({ course, module, lesson }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm your AI Study Buddy. What do you need help understanding in this lesson?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice State
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const messagesEndRef = useRef(null);
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    // Cleanup voices
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      // Clear previous voice if speaking
      window.speechSynthesis?.cancel();
      recognitionRef.current?.start();
    }
  };

  const speakText = (text) => {
    if (!isVoiceMode || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Remove markdown symbols for cleaner speech
    utterance.text = text.replace(/[*_#`]/g, '');
    
    // Optional: Find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e, forcedInput = null) => {
    if (e) e.preventDefault();
    
    const textToSend = forcedInput || input.trim();
    if (!textToSend || isLoading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const token = isAuthenticated ? await getAccessTokenSilently() : null;
      
      const historyForApi = newMessages.slice(1).map(m => ({
        role: m.role,
        text: m.text
      }));

      // Pass "socratic" mode if voice is enabled to make AI answers concise and thought-provoking
      const mode = isVoiceMode ? "socratic" : "standard";

      const response = await askStudyBuddy(
        textToSend,
        course?.title,
        module?.title,
        lesson?.title,
        lesson?.content || course?.description || "Course overview",
        historyForApi,
        token,
        mode
      );

      if (response.success) {
        setMessages([...newMessages, { role: 'ai', text: response.answer }]);
        if (isVoiceMode) {
          speakText(response.answer);
        }
      } else {
        const errorMsg = "Sorry, I had trouble processing that request.";
        setMessages([...newMessages, { role: 'ai', text: errorMsg }]);
        speakText(errorMsg);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = "An error occurred while communicating with the server.";
      setMessages([...newMessages, { role: 'ai', text: errorMsg }]);
      speakText(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-send when input is populated via voice
  useEffect(() => {
    // If voice mode is on, we just finished listening, and input is not empty, auto-send
    if (isVoiceMode && !isListening && input.trim() && document.activeElement !== document.querySelector('.study-buddy-input')) {
        handleSend(null, input.trim());
    }
  }, [isListening, isVoiceMode, input]);

  return (
    <div className="study-buddy-wrapper">
      {isOpen && (
        <div className="study-buddy-chat">
          <div className="study-buddy-header">
            <h3 className="study-buddy-title">
              <Bot size={20} />
              Study Buddy {isVoiceMode ? "(Voice Socratic)" : ""}
            </h3>
            <div className="study-buddy-actions">
              <button 
                className={`voice-toggle-btn ${isVoiceMode ? 'active' : ''}`}
                onClick={() => {
                  setIsVoiceMode(!isVoiceMode);
                  window.speechSynthesis?.cancel();
                }}
                title="Toggle Voice Socratic Mode"
              >
                {isVoiceMode ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button className="study-buddy-close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="study-buddy-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`study-buddy-msg ${msg.role}`}>
                <div className="study-buddy-msg-content">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="study-buddy-msg ai">
                <div className="study-buddy-loading">
                  <div className="study-buddy-dot"></div>
                  <div className="study-buddy-dot"></div>
                  <div className="study-buddy-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="study-buddy-input-container">
            {isVoiceMode && (
               <button 
                type="button"
                className={`mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Click to speak"}
              >
                {isListening ? <Mic size={18} className="pulse-anim" /> : <MicOff size={18} />}
              </button>
            )}
            <form className="study-buddy-input-area" onSubmit={(e) => handleSend(e)}>
              <input
                type="text"
                className="study-buddy-input"
                placeholder={isListening ? "Listening..." : "Ask a question..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading || isListening}
              />
              <button type="submit" className="study-buddy-send" disabled={!input.trim() || isLoading || isListening}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {!isOpen && (
        <button className="study-buddy-toggle" onClick={() => setIsOpen(true)} title="Ask Study Buddy">
          <Sparkles size={24} />
        </button>
      )}
    </div>
  );
};

export default StudyBuddy;
