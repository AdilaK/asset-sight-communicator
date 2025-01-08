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
    if (image) {
      systemPrompt = `You are an expert industrial equipment analyst. Analyze the image and provide a detailed yet concise assessment in exactly these 4 sections:

1) Asset Identification
- Equipment type and model number (if visible)
- Key specifications and features
- Primary function and purpose

2) Safety Check
- Visible safety risks or hazards
- Missing safety features (guards, emergency stops)
- Compliance concerns or violations
- Required safety measures

3) Condition Assessment
- Signs of wear or damage
- Maintenance needs
- Operational status
- Performance concerns

4) Environmental Impact
- Energy efficiency indicators
- Emissions or waste concerns
- Sustainability considerations
- Environmental compliance status

Keep each section focused and technical. Use bullet points for clarity. Highlight critical findings.`
    } else if (prompt) {
      systemPrompt = `You are an expert industrial equipment analyst. Based on the previous conversation, provide a technical response addressing the specific question about the equipment. Focus on actionable insights and safety considerations.`
    } else {
      systemPrompt = `You are an expert industrial equipment analyst. However, I notice no equipment has been analyzed yet. Please ask the user to share an image of the equipment they'd like to discuss.`
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
          temperature: 0.3, // Lower temperature for more technical and precise responses
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024, // Increased to accommodate detailed analysis
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