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

    const response = await fetch('https://oaetcqwattvzzuseqwfl.supabase.co/functions/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXRjcXdhdHR2enp1c2Vxd2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNTUzOTksImV4cCI6MjA1MTczMTM5OX0.XKsBfu_F7B9v2RHF5WPxhmQ_t32awvR5vVYDPjJaSi8`,
      },
      body: JSON.stringify({
        text: truncatedText,
        voice: 'alloy'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Text-to-speech API error:', errorData);
      throw new Error(errorData.error || 'Failed to generate speech');
    }

    const responseData = await response.json();
    console.log("Audio response received, creating audio...");

    if (!responseData.audioContent) {
      throw new Error('No audio content received');
    }

    // Convert base64 to audio and play it
    const audioData = atob(responseData.audioContent);
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