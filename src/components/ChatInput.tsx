import React, { useState } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your question..."
        className="flex-1 px-4 py-2 rounded-lg bg-secondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-success"
      />
      <button
        type="submit"
        disabled={!message.trim()}
        className="p-2 rounded-lg bg-success text-white hover:bg-success/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-6 h-6" />
      </button>
    </form>
  );
};

export default ChatInput;