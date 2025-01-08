import { supabase } from "@/integrations/supabase/client";

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah's voice ID

export const speakText = async (text: string): Promise<void> => {
  try {
    console.log("Starting text-to-speech conversion...");
    
    // Fetch the API key from Supabase secrets
    const { data: secretData, error: secretError } = await supabase
      .from('secrets')
      .select('value')
      .eq('name', 'ELEVEN_LABS_API_KEY')
      .maybeSingle();

    if (secretError) {
      console.error('Failed to fetch ElevenLabs API key:', secretError);
      throw new Error('Failed to fetch ElevenLabs API key');
    }

    if (!secretData?.value) {
      console.error('ElevenLabs API key not found');
      throw new Error('ElevenLabs API key not found. Please add it to your secrets.');
    }

    console.log("Making request to ElevenLabs API...");
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": secretData.value,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ElevenLabs API error:', errorData);
      throw new Error(`Failed to generate speech: ${errorData.detail?.message || 'Unknown error'}`);
    }

    console.log("Audio response received, creating blob...");
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    console.log("Playing audio response...");
    await audio.play();

    // Clean up the URL after playback
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
  } catch (error) {
    console.error("Text-to-speech error:", error);
    throw error;
  }
};