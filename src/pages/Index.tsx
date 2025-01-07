import React, { useCallback } from "react";
import CameraView from "@/components/Camera";
import ResponseDisplay from "@/components/ResponseDisplay";
import AnalysisInput from "@/components/AnalysisInput";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { responses, processImageData } = useImageAnalysis();
  const { toast } = useToast();

  const handleInput = useCallback(async (input: string) => {
    try {
      const response = await fetch('https://oaetcqwattvzzuseqwfl.supabase.co/functions/v1/analyze-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXRjcXdhdHR2enp1c2Vxd2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNTUzOTksImV4cCI6MjA1MTczMTM5OX0.XKsBfu_F7B9v2RHF5WPxhmQ_t32awvR5vVYDPjJaSi8`,
        },
        body: JSON.stringify({
          prompt: input
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please try again in a few minutes",
            variant: "destructive",
          });
          return;
        }
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      console.log('Text analysis result:', result);

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      toast({
        title: "Response Received",
        description: "New information available",
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Unable to process your request",
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
          <AnalysisInput onInput={handleInput} />
        </div>

        <div className="mt-8">
          <ResponseDisplay responses={responses} />
        </div>
      </div>
    </div>
  );
};

export default Index;