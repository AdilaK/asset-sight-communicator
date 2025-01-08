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
    const { prompt, image, conversationHistory } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('Missing Gemini API key')
    }

    let messages = []
    
    if (image) {
      // System prompt for image analysis
      const systemPrompt = `You are a precise industrial equipment analyst. Provide ultra-concise analysis (max 6 words per section):
      1) Type/Model - Key equipment identifiers
      2) Safety - Critical risks only
      3) Condition - Core maintenance needs
      4) Impact - Essential environmental factors`

      messages = [{
        role: "user",
        parts: [
          { text: systemPrompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: image.split(',')[1]
            }
          }
        ]
      }]
    } else if (prompt) {
      // System prompt for chat
      const systemPrompt = `You are a technical equipment expert. Respond with:
      - Maximum 6 words per point
      - Only essential technical details
      - Actionable insights
      - No explanations or context`

      messages = [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        }
      ]

      // Add conversation history for context
      if (conversationHistory) {
        conversationHistory.forEach(msg => {
          messages.push({
            role: msg.type === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          })
        })
      }

      // Add current prompt
      messages.push({
        role: "user",
        parts: [{ text: prompt }]
      })
    }

    console.log('Sending request to Gemini API with messages:', messages)

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.3,
          topK: 16,
          topP: 0.8,
          maxOutputTokens: 64,
        },
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      throw new Error(`Gemini API error: ${error}`)
    }

    const result = await response.json()
    console.log('Gemini API response:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-asset function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})