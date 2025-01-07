import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import debounce from 'lodash/debounce';

interface Response {
  type: "identification" | "safety" | "condition" | "environmental";
  content: string;
  severity?: "info" | "warning" | "critical";
}

export const useImageAnalysis = () => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  const [analyzedImages] = useState(new Set<string>());
  const { toast } = useToast();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  const processImageData = useCallback(
    debounce(async (imageData: ImageData) => {
      if (isAnalyzing) return;

      // Convert ImageData to a hash for tracking
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      ctx?.putImageData(imageData, 0, 0);
      const imageHash = canvas.toDataURL('image/jpeg');

      // Skip if this image has already been analyzed
      if (analyzedImages.has(imageHash)) {
        return;
      }

      try {
        setIsAnalyzing(true);
        toast({
          title: "Processing",
          description: "Analyzing the image...",
        });

        const base64Image = canvas.toDataURL('image/jpeg');

        console.log('Sending image data to API...', {
          imageSize: base64Image.length,
          dimensions: `${imageData.width}x${imageData.height}`
        });

        const response = await fetch('https://oaetcqwattvzzuseqwfl.supabase.co/functions/v1/analyze-asset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXRjcXdhdHR2enp1c2Vxd2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNTUzOTksImV4cCI6MjA1MTczMTM5OX0.XKsBfu_F7B9v2RHF5WPxhmQ_t32awvR5vVYDPjJaSi8`,
          },
          body: JSON.stringify({
            image: base64Image,
            prompt: "Please analyze this machine or equipment and provide: 1) Type and model identification 2) Safety assessment 3) Condition evaluation 4) Environmental impact analysis"
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          
          if (response.status === 429) {
            if (retryTimeout) {
              clearTimeout(retryTimeout);
            }
            
            const retryAfter = errorData.retryAfter || 60;
            const timeout = setTimeout(() => {
              processImageData(imageData);
            }, retryAfter * 1000);
            
            setRetryTimeout(timeout);
            
            toast({
              title: "Rate Limit Exceeded",
              description: `Analysis will automatically retry in ${retryAfter} seconds...`,
              duration: retryAfter * 1000,
            });
            return;
          }
          
          throw new Error(errorData.error || 'Analysis failed');
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

        // Mark this image as analyzed
        analyzedImages.add(imageHash);
        
        setResponses(structuredResponses);
        toast({
          title: "Analysis Complete",
          description: "New information available",
        });
      } catch (error: any) {
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
    }, 1000), // Debounce for 1 second
    [toast, isAnalyzing, retryTimeout, analyzedImages]
  );

  return {
    responses,
    isAnalyzing,
    processImageData
  };
};