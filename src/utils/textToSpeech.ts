export const speakText = async (text: string): Promise<void> => {
  try {
    // Start speaking immediately with browser's TTS while API call is processing
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
    
    console.log("Starting immediate browser TTS while processing high-quality version...");
    
    // Simultaneously process high-quality TTS
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: {
        text: text.substring(0, 4000), // Limit text length
        voice: 'alloy'
      }
    });

    if (error) {
      console.error('Text-to-speech API error:', error);
      return; // Browser TTS will continue
    }

    if (!data?.audioContent) {
      console.warn('No audio content received');
      return; // Browser TTS will continue
    }

    // Once high-quality audio is ready, cancel browser TTS and play the better version
    window.speechSynthesis.cancel();
    
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
    // If high-quality TTS fails, browser TTS will have already started
  }
};