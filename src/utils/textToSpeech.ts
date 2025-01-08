export const speakText = async (text: string): Promise<void> => {
  try {
    console.log("Starting text-to-speech conversion...");
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate speech: ${error.error?.message || 'Unknown error'}`);
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