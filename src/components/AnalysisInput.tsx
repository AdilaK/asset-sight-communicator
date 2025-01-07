import React from 'react';
import VoiceInput from './VoiceInput';
import ChatInput from './ChatInput';

interface AnalysisInputProps {
  onInput: (input: string) => void;
}

const AnalysisInput: React.FC<AnalysisInputProps> = ({ onInput }) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <VoiceInput onInput={onInput} />
      <div className="flex-1 max-w-xl">
        <ChatInput onSend={onInput} />
      </div>
    </div>
  );
};

export default AnalysisInput;