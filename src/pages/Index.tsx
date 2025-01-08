import React, { useCallback, useState } from "react";
import CameraView from "@/components/Camera";
import ResponseDisplay from "@/components/ResponseDisplay";
import AnalysisInput from "@/components/AnalysisInput";
import ImageUpload from "@/components/ImageUpload";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { useToast } from "@/hooks/use-toast";
import { speakText } from "@/utils/textToSpeech";
import { Camera, Shield, Wrench, Leaf } from "lucide-react";

interface Conversation {
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isVoiceInput?: boolean;
}

// Features configuration moved to a separate constant
const FEATURES = [
  {
    icon: <Camera className="w-4 h-4" />,
    title: "Real-time Analysis",
    description: "Instant equipment recognition and assessment through your device camera"
  },
  {
    icon: <Shield className="w-4 h-4" />,
    title: "Safety Scanner",
    description: "Automatic detection of safety issues and compliance gaps"
  },
  {
    icon: <Wrench className="w-4 h-4" />,
    title: "Condition Monitor",
    description: "Identify wear patterns and maintenance needs early"
  },
  {
    icon: <Leaf className="w-4 h-4" />,
    title: "Environmental Check",
    description: "Track emissions and identify sustainability opportunities"
  }
];

const Index = () => {
  const { responses, processImageData, conversationHistory, setConversationHistory } = useImageAnalysis();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInput = useCallback(async (input: string, isVoiceInput: boolean = false) => {
    try {
      setIsProcessing(true);
      
      setConversationHistory(prev => [...prev, {
        type: "user",
        content: input,
        timestamp: new Date(),
        isVoiceInput
      }]);

      const response = await fetch('https://oaetcqwattvzzuseqwfl.supabase.co/functions/v1/analyze-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXRjcXdhdHR2enp1c2Vxd2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNTUzOTksImV4cCI6MjA1MTczMTM5OX0.XKsBfu_F7B9v2RHF5WPxhmQ_t32awvR5vVYDPjJaSi8`,
        },
        body: JSON.stringify({
          prompt: input,
          conversationHistory,
          isVoiceInput
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
      console.log('Analysis result:', result);

      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        const assistantResponse = result.candidates[0].content.parts[0].text;
        
        // If this was initiated by voice input, start speaking immediately
        if (isVoiceInput) {
          console.log("Voice input detected, starting immediate speech response");
          speakText(assistantResponse).catch(error => {
            console.error('Text-to-speech error:', error);
            toast({
              title: "Text-to-Speech Failed",
              description: "Could not play audio response",
              variant: "destructive",
            });
          });
        }

        setConversationHistory(prev => [...prev, {
          type: "assistant",
          content: assistantResponse,
          timestamp: new Date(),
          isVoiceInput
        }]);

        toast({
          title: "Response Received",
          description: "New information available",
        });
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Unable to process your request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast, conversationHistory]);

  return (
    <div className="min-h-screen bg-primary text-primary-foreground p-4 md:p-6 font-cabinet">
      <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-3 py-8">
            <div className="inline-block">
              <div className="relative">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70 animate-fade-in">
                  Asset<span className="text-success font-extrabold">Sight</span>
                </h1>
                <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-success/50 to-transparent"></div>
              </div>
              <p className="text-sm text-white/60 font-light mt-2 tracking-wide">
                Intelligent equipment monitoring and assessment
              </p>
            </div>
          </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {FEATURES.map((feature, index) => (
            <div key={index} className="bg-secondary/50 p-3 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-1">
                {feature.icon}
                <h3 className="font-semibold">{feature.title}</h3>
              </div>
              <p className="text-xs opacity-80">{feature.description}</p>
            </div>
          ))}
        </div>
        
          <div className="grid gap-4">
            <CameraView onFrame={processImageData} />
            <div className="flex justify-center">
              <span className="text-sm text-muted-foreground">or</span>
            </div>
            <ImageUpload onImageAnalysis={processImageData} />
          </div>
          
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {conversationHistory.map((msg, index) => (
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
            <AnalysisInput onInput={handleInput} isProcessing={isProcessing} />
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
