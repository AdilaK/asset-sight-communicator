import { supabase } from "@/integrations/supabase/client";

export const speakText = async (text: string): Promise<void> => {
  try {
    console.log("Starting text-to-speech conversion...");
    
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Empty text provided');
    }

    // Truncate text if it exceeds maximum length
    const MAX_LENGTH = 4000;
    const truncatedText = text.length > MAX_LENGTH 
      ? text.substring(0, MAX_LENGTH - 3) + '...'
      : text;

    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: {
        text: truncatedText,
        voice: 'alloy'
      }
    });

    if (error) {
      console.error('Text-to-speech API error:', error);
      throw error;
    }

    if (!data?.audioContent) {
      throw new Error('No audio content received');
    }

    console.log("Audio response received, creating audio...");

    // Convert base64 to audio and play it
    const audioData = atob(data.audioContent);
    const arrayBuffer = new ArrayBuffer(audioData.length);
    const view = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < audioData.length; i++) {
      view[i] = audioData.charCodeAt(i);
    }
    
    const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    await new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(null);
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Audio playback failed'));
      };
      audio.play().catch(reject);
    });

  } catch (error) {
    console.error("Text-to-speech error:", error);
    throw error;
  }
};