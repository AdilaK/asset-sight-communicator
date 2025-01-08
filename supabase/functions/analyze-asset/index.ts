import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    let systemPrompt = ''
    const lastImageAnalysis = conversationHistory?.find(msg => 
      msg.type === 'assistant' && msg.content.includes('Type and Model Identification')
    )

    if (image) {
      systemPrompt = `You are a precise industrial equipment analyst. Provide ultra-concise analysis (max 15 words per section):
      1) Type/Model - Core equipment specs only
      2) Safety - Critical risks and required measures
      3) Condition - Current state and urgent needs
      4) Environmental - Key efficiency metrics`
    } else if (lastImageAnalysis) {
      systemPrompt = `As a technical equipment analyst, provide a single, focused response (max 20 words) addressing only the specific query about:
      "${lastImageAnalysis.content}"`
    } else {
      systemPrompt = `Please upload equipment image for technical analysis. Voice or text queries require prior image analysis.`
    }

    const messages = [];
    messages.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });

    if (conversationHistory?.length) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    if (prompt) {
      messages.push({
        role: "user",
        parts: [{ text: prompt }]
      });
    }

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
          temperature: 0.4,
          topK: 16,
          topP: 0.8,
          maxOutputTokens: 150,
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