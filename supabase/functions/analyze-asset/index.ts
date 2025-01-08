import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { image, prompt, conversationHistory } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured')
    }

    console.log('Processing request with prompt:', prompt);
    console.log('Conversation history:', conversationHistory);
    console.log('Image data received:', image ? 'Yes' : 'No');

    // Create a context-aware system prompt
    let systemPrompt = ''
    const lastImageAnalysis = conversationHistory?.find(msg => 
      msg.type === 'assistant' && msg.content.includes('Type and Model Identification')
    )

    if (image) {
      systemPrompt = `You are an expert industrial equipment analyst providing very concise analysis (max 30 words per section). 
      Structure your response in these sections:
      1) Type and model identification - Brief equipment details
      2) Safety assessment - Key risks and measures
      3) Condition evaluation - Current state and needs
      4) Environmental impact - Key efficiency factors`
    } else if (lastImageAnalysis) {
      systemPrompt = `You are an expert industrial equipment analyst. Based on the previous image analysis:
      "${lastImageAnalysis.content}"
      
      Provide a very brief response (max 30 words) about the equipment, addressing the specific question or concern raised.`
    } else {
      systemPrompt = `You are an expert industrial equipment analyst. However, I notice no equipment has been analyzed yet. 
      Please ask the user to share an image of the equipment they'd like to discuss, either by uploading a photo or using the camera feature.`
    }

    // Build the conversation context
    const messages = [];
    
    // Add system prompt
    messages.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });

    // Add conversation history for context
    if (conversationHistory?.length) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current prompt/question
    if (prompt) {
      messages.push({
        role: "user",
        parts: [{ text: prompt }]
      });
    }

    // Add image if present
    if (image) {
      const currentMessage = messages[messages.length - 1];
      currentMessage.parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: image.split(',')[1]
        }
      });
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 32,
          topP: 1,
          maxOutputTokens: 256, // Reduced to get shorter responses
        },
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error}`);
    }

    const result = await response.json();
    console.log('Gemini API response:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-asset function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.status || 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});