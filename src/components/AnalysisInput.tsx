import React from 'react';
import VoiceInput from './VoiceInput';
import ChatInput from './ChatInput';

interface AnalysisInputProps {
  onInput: (input: string, isVoice: boolean) => void;
  isProcessing?: boolean;
}

const AnalysisInput: React.FC<AnalysisInputProps> = ({ onInput, isProcessing }) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <VoiceInput onInput={onInput} disabled={isProcessing} />
      <div className="flex-1 max-w-xl">
        <ChatInput onSend={(text) => onInput(text, false)} disabled={isProcessing} />
      </div>
    </div>
  );
};

export default AnalysisInput;