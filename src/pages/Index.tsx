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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const processImageData = async (imageData: ImageData) => {
    if (isAnalyzing) return; // Prevent multiple simultaneous analyses

    try {
      setIsAnalyzing(true);

      // Convert ImageData to base64
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      ctx?.putImageData(imageData, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];

      const response = await fetch('/functions/v1/analyze-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          prompt: "Please analyze this machine or equipment and provide: 1) Type and model identification 2) Safety assessment 3) Condition evaluation 4) Environmental impact analysis"
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      console.log('Analysis result:', result);

      // Parse the response from Gemini and structure it
      const text = result.candidates[0]?.content?.parts[0]?.text || '';
      
      // Split the response into sections based on numbering
      const sections = text.split(/\d+\)/).filter(Boolean);
      
      const structuredResponses: Response[] = [
        {
          type: "identification",
          content: sections[0]?.trim() || "Unable to identify the asset",
          severity: "info"
        },
        {
          type: "safety",
          content: sections[1]?.trim() || "Unable to assess safety",
          severity: sections[1]?.toLowerCase().includes("warning") ? "warning" : "info"
        },
        {
          type: "condition",
          content: sections[2]?.trim() || "Unable to evaluate condition",
          severity: sections[2]?.toLowerCase().includes("poor") ? "warning" : "info"
        },
        {
          type: "environmental",
          content: sections[3]?.trim() || "Unable to assess environmental impact",
          severity: sections[3]?.toLowerCase().includes("concern") ? "warning" : "info"
        }
      ];

      setResponses(structuredResponses);
      toast({
        title: "Analysis Complete",
        description: "New information available",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to process the image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInput = useCallback(async (input: string) => {
    try {
      const response = await fetch('/functions/v1/analyze-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      console.log('Text analysis result:', result);

      // Structure the response
      const text = result.candidates[0]?.content?.parts[0]?.text || '';
      
      const newResponse: Response = {
        type: "identification",
        content: text,
        severity: "info"
      };

      setResponses([newResponse]);
      toast({
        title: "Response Received",
        description: "New information available",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to process your request",
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-primary text-primary-foreground p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-center mb-6">
            Real-Time Asset Analysis
          </h1>
          
          <CameraView onFrame={processImageData} />
          
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