import React, { useState, useCallback } from "react";
import CameraView from "@/components/Camera";
import VoiceInput from "@/components/VoiceInput";
import ChatInput from "@/components/ChatInput";
import ResponseDisplay from "@/components/ResponseDisplay";
import { useToast } from "@/hooks/use-toast";

interface Response {
  type: "identification" | "safety" | "condition" | "environmental";
  content: string;
  severity?: "info" | "warning" | "critical";
}

const Index = () => {
  const [responses, setResponses] = useState<Response[]>([]);
  const { toast } = useToast();

  const handleFrame = useCallback((imageData: ImageData) => {
    // Here you would integrate with Gemini API
    // For now, we'll simulate responses
    console.log("Processing frame...", imageData);
  }, []);

  const handleInput = useCallback((input: string) => {
    // Here you would integrate with Gemini API
    // For now, we'll simulate responses
    const mockResponses: Response[] = [
      {
        type: "identification",
        content: "Industrial lathe machine, Model XYZ-2000",
        severity: "info",
      },
      {
        type: "safety",
        content: "Warning: Safety guard appears to be missing from the chuck",
        severity: "warning",
      },
      {
        type: "condition",
        content: "Machine appears to be in good working condition. Regular maintenance recommended.",
        severity: "info",
      },
      {
        type: "environmental",
        content: "No visible leaks or emissions detected",
        severity: "info",
      },
    ];

    setResponses(mockResponses);
    toast({
      title: "Analysis Complete",
      description: "New information available",
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-primary text-primary-foreground p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-center mb-6">
            Real-Time Asset Analysis
          </h1>
          
          <CameraView onFrame={handleFrame} />
          
          <div className="flex items-center justify-center gap-4">
            <VoiceInput onInput={handleInput} />
            <div className="flex-1 max-w-xl">
              <ChatInput onSend={handleInput} />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <ResponseDisplay responses={responses} />
        </div>
      </div>
    </div>
  );
};

export default Index;