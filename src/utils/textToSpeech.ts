import { supabase } from "@/integrations/supabase/client";

export const speakText = async (text: string): Promise<void> => {
  try {
    console.log("Starting text-to-speech conversion...");
    
    // Fetch the API key from Supabase secrets
    const { data: secretData, error: secretError } = await supabase
      .from('secrets')
      .select('value')
      .eq('name', 'OPENAI_API_KEY')
      .maybeSingle();

    if (secretError) {
      console.error('Failed to fetch OpenAI API key:', secretError);
      throw new Error('Failed to fetch OpenAI API key');
    }

    if (!secretData?.value) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not found. Please add it to your secrets.');
    }

    console.log("Making request to OpenAI API...");
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretData.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy',
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`Failed to generate speech: ${errorData.error?.message || 'Unknown error'}`);
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