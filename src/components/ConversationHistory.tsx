import React from 'react';

interface Conversation {
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isVoiceInput?: boolean;
}

interface ConversationHistoryProps {
  conversations: Conversation[];
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ conversations }) => {
  return (
    <div className="bg-secondary/50 rounded-lg p-4 max-h-96 overflow-y-auto">
      {conversations.map((msg, index) => (
        <div
          key={index}
          className={`mb-4 ${
            msg.type === "user" ? "text-right" : "text-left"
          }`}
        >
          <div
            className={`inline-block max-w-[80%] rounded-lg p-3 ${
              msg.type === "user"
                ? "bg-success text-success-foreground ml-auto"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
            <span className="text-xs opacity-70 mt-1 block">
              {msg.timestamp.toLocaleTimeString()}
              {msg.isVoiceInput && " 🎤"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationHistory;