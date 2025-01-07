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
    if (isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      toast({
        title: "Processing",
        description: "Analyzing the image...",
      });

      // Convert ImageData to base64
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      ctx?.putImageData(imageData, 0, 0);
      
      // Get base64 with correct MIME type prefix
      const base64Image = canvas.toDataURL('image/jpeg');

      console.log('Sending image data to API...', {
        imageSize: base64Image.length,
        dimensions: `${imageData.width}x${imageData.height}`
      });

      // Use the complete Supabase Edge Function URL
      const response = await fetch('https://oaetcqwattvzzuseqwfl.supabase.co/functions/v1/analyze-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          image: base64Image,
          prompt: "Please analyze this machine or equipment and provide: 1) Type and model identification 2) Safety assessment 3) Condition evaluation 4) Environmental impact analysis"
        })
      });

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
        throw new Error('Received non-JSON response from server');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Analysis failed: ${errorText}`);
      }

      const result = await response.json();
      console.log('Analysis result:', result);

      if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from API');
      }

      const text = result.candidates[0].content.parts[0].text;
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
        description: error.message || "Unable to process the image",
        variant: "destructive",
      });
      setResponses([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInput = useCallback(async (input: string) => {
    try {
      const response = await fetch('https://oaetcqwattvzzuseqwfl.supabase.co/functions/v1/analyze-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          prompt: input
        })
      });

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
        throw new Error('Received non-JSON response from server');
      }

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      console.log('Text analysis result:', result);

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
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