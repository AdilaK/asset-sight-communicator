import React, { useState, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  onInput: (text: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onInput }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string>("");

  const startListening = useCallback(async () => {
    try {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        onInput(text);
      };

      recognition.onerror = (event) => {
        setError("Speech recognition error. Please try again.");
        console.error("Speech recognition error:", event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
      setError("");
    } catch (err) {
      setError("Speech recognition not supported in this browser.");
      console.error("Speech recognition error:", err);
    }
  }, [onInput]);

  return (
    <div className="relative">
      <button
        onClick={startListening}
        disabled={isListening}
        className={`p-3 rounded-full transition-all duration-200 ${
          isListening
            ? "bg-success text-white animate-pulse"
            : "bg-secondary hover:bg-secondary/80 text-white"
        }`}
        aria-label={isListening ? "Recording..." : "Start recording"}
      >
        {isListening ? (
          <Mic className="w-6 h-6" />
        ) : (
          <MicOff className="w-6 h-6" />
        )}
      </button>
      {error && (
        <p className="absolute top-full mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default VoiceInput;