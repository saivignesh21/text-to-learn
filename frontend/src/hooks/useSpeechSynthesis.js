/**
 * Custom React hook for browser-native text-to-speech
 * Uses Web Speech API (SpeechSynthesisUtterance)
 * Fallback for when Google Cloud TTS is unavailable
 */

export const useSpeechSynthesis = () => {
  // Check if browser supports Web Speech API
  const isSupported = () => {
    const synth =
      window.speechSynthesis ||
      window.webkitSpeechSynthesis ||
      window.mozSpeechSynthesis;
    return !!(synth && typeof SpeechSynthesisUtterance !== "undefined");
  };

  /**
   * Speak text using browser's built-in speech synthesis
   * @param {string} text - Text to speak
   * @param {string} lang - Language code (e.g., 'hi-IN', 'en-US')
   */
  const speak = (text, lang = "hi-IN") => {
    if (!isSupported()) {
      console.warn("❌ Web Speech API not supported in this browser");
      return false;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set language
    utterance.lang = lang;

    // Adjust voice properties
    utterance.rate = 0.9; // Speed (0.1 - 10)
    utterance.pitch = 1; // Pitch (0 - 2)
    utterance.volume = 1; // Volume (0 - 1)

    // Try to get a voice matching the language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (voice) =>
        voice.lang.startsWith(lang.split("-")[0]) || voice.lang === lang
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
      console.log(`🎤 Using voice: ${matchingVoice.name}`);
    }

    // Event handlers
    utterance.onstart = () => {
      console.log("🎵 Speech started");
    };

    utterance.onend = () => {
      console.log("✅ Speech ended");
    };

    utterance.onerror = (event) => {
      console.error("❌ Speech error:", event.error);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  };

  /**
   * Stop speaking
   */
  const stop = () => {
    if (isSupported()) {
      window.speechSynthesis.cancel();
      console.log("⏹️  Speech stopped");
    }
  };

  /**
   * Pause speaking
   */
  const pause = () => {
    if (isSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      console.log("⏸️  Speech paused");
    }
  };

  /**
   * Resume speaking
   */
  const resume = () => {
    if (isSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      console.log("▶️  Speech resumed");
    }
  };

  /**
   * Get available voices
   */
  const getAvailableVoices = () => {
    if (!isSupported()) return [];
    return window.speechSynthesis.getVoices();
  };

  return {
    speak,
    stop,
    pause,
    resume,
    isSupported,
    getAvailableVoices,
  };
};
