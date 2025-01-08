export const speakText = async (text: string): Promise<void> => {
  try {
    console.log("Starting text-to-speech conversion...");
    
    // Split text into chunks of maximum 4000 characters (leaving some buffer)
    const MAX_CHUNK_SIZE = 4000;
    const textChunks = [];
    
    // Split by sentences to maintain natural breaks
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= MAX_CHUNK_SIZE) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) {
          textChunks.push(currentChunk);
        }
        currentChunk = sentence;
      }
    }
    if (currentChunk) {
      textChunks.push(currentChunk);
    }

    // Process each chunk sequentially
    for (const chunk of textChunks) {
      const response = await fetch('https://oaetcqwattvzzuseqwfl.supabase.co/functions/v1/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXRjcXdhdHR2enp1c2Vxd2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNTUzOTksImV4cCI6MjA1MTczMTM5OX0.XKsBfu_F7B9v2RHF5WPxhmQ_t32awvR5vVYDPjJaSi8`,
        },
        body: JSON.stringify({
          text: chunk,
          voice: 'alloy'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const responseData = await response.json();
      console.log("Audio response received, creating audio...");

      if (!responseData.audioContent) {
        throw new Error('No audio content received');
      }

      // Convert base64 to audio
      const audioData = atob(responseData.audioContent);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Wait for the current chunk to finish playing before proceeding to the next
      await new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(null);
        };
        audio.play();
      });
    }
  } catch (error) {
    console.error("Text-to-speech error:", error);
    throw error;
  }
};