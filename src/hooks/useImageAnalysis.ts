import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import debounce from 'lodash/debounce';

interface Response {
  type: "identification" | "safety" | "condition" | "environmental";
  content: string;
  severity?: "info" | "warning" | "critical";
}

interface Conversation {
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isVoiceInput?: boolean;
}

export const useImageAnalysis = () => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<Response[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Conversation[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const lastProcessedTime = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const analyzedImagesRef = useRef(new Set<string>());

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const processImage = useCallback(async (imageData: ImageData, isFromCamera: boolean = false) => {
    if (isAnalyzing) return;

    if (isFromCamera) {
      const currentTime = Date.now();
      const timeSinceLastProcess = currentTime - lastProcessedTime.current;
      if (timeSinceLastProcess < 5000) {
        return;
      }
      lastProcessedTime.current = currentTime;
    }

    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      toast({
        title: "Error",
        description: "Could not process image",
        variant: "destructive",
      });
      return;
    }

    ctx.putImageData(imageData, 0, 0);
    const imageHash = canvas.toDataURL('image/jpeg');

    if (analyzedImagesRef.current.has(imageHash)) {
      return;
    }

    try {
      setIsAnalyzing(true);
      toast({
        title: "Processing",
        description: "Analyzing the equipment in detail...",
      });

      const base64Image = canvas.toDataURL('image/jpeg');

      console.log('Sending image data to API...', {
        imageSize: base64Image.length,
        dimensions: `${imageData.width}x${imageData.height}`,
        source: isFromCamera ? 'camera' : 'upload'
      });

      const response = await fetch('https://oaetcqwattvzzuseqwfl.supabase.co/functions/v1/analyze-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXRjcXdhdHR2enp1c2Vxd2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNTUzOTksImV4cCI6MjA1MTczMTM5OX0.XKsBfu_F7B9v2RHF5WPxhmQ_t32awvR5vVYDPjJaSi8`,
        },
        body: JSON.stringify({
          image: base64Image,
          conversationHistory,
          machineId: selectedMachineId
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        try {
          const parsedError = JSON.parse(errorData);
          if (response.status === 429) {
            const retryAfter = parsedError.retryAfter || 60;
            
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            
            retryTimeoutRef.current = setTimeout(() => {
              processImage(imageData, isFromCamera);
            }, retryAfter * 1000);
            
            toast({
              title: "Rate Limit Exceeded",
              description: `Analysis will automatically retry in ${retryAfter} seconds...`,
              duration: retryAfter * 1000,
            });
            return;
          }
          throw new Error(parsedError.error || 'Analysis failed');
        } catch {
          throw new Error(errorData || 'Analysis failed');
        }
      }

      // Clone the response before reading it
      const responseClone = response.clone();
      const result = await responseClone.json();
      console.log('Analysis result:', result);

      if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from API');
      }

      const text = result.candidates[0].content.parts[0].text;
      const sections = text.split(/\d+\)/).filter(Boolean);
      
      const structuredResponses: Response[] = [
        {
          type: "identification",
          content: sections[0]?.trim() || "Unable to identify the equipment",
          severity: "info"
        },
        {
          type: "safety",
          content: sections[1]?.trim() || "Unable to assess safety",
          severity: sections[1]?.toLowerCase().includes("warning") || sections[1]?.toLowerCase().includes("hazard") ? "warning" : "info"
        },
        {
          type: "condition",
          content: sections[2]?.trim() || "Unable to evaluate condition",
          severity: sections[2]?.toLowerCase().includes("poor") || sections[2]?.toLowerCase().includes("maintenance required") ? "warning" : "info"
        },
        {
          type: "environmental",
          content: sections[3]?.trim() || "Unable to assess environmental impact",
          severity: sections[3]?.toLowerCase().includes("concern") || sections[3]?.toLowerCase().includes("high impact") ? "warning" : "info"
        }
      ];

      setConversationHistory(prev => [...prev, {
        type: "assistant",
        content: text,
        timestamp: new Date()
      }]);

      analyzedImagesRef.current.add(imageHash);
      setResponses(structuredResponses);
      
      toast({
        title: "Analysis Complete",
        description: "Detailed equipment analysis available",
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Unable to process the equipment image",
        variant: "destructive",
      });
      setResponses([]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast, isAnalyzing, conversationHistory, selectedMachineId]);

  const processImageData = useCallback(
    (imageData: ImageData, isFromCamera: boolean = false) => {
      processImage(imageData, isFromCamera);
    },
    [processImage]
  );

  return {
    responses,
    isAnalyzing,
    processImageData,
    conversationHistory,
    setConversationHistory,
    setSelectedMachineId
  };
};
