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
    const { image, prompt, conversationHistory, isVoiceInput } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured')
    }

    console.log('Processing request with prompt:', prompt)
    console.log('Conversation history:', conversationHistory)
    console.log('Image data received:', image ? 'Yes' : 'No')
    console.log('Is voice input:', isVoiceInput)

    let systemPrompt = ''
    if (image) {
      systemPrompt = `You are a technical equipment analyst. Provide detailed technical analysis in 4 sections:

1) Assessment
- Equipment type, model, key specs
- Use precise technical terms

2) Asset Identification
- Power ratings, thresholds
- Relevant standards

3) Safety Check
- Critical hazards
- Required clearances

4) Environmental Impact
- Emissions data
- Compliance status

Use only technical terms. Focus on measurable data.`
    } else if (prompt) {
      // Enhanced concise conversation mode with formatting
      systemPrompt = `You are a technical equipment specialist. Your role is to:

1. Give brief, precise responses
2. Ask 1-2 focused follow-up questions
3. Guide efficiently to solutions

Format responses with:
- **Bold** for key terms
- Bullet points for lists
- \`code blocks\` for critical values
- Keep responses under 100 words when possible
- End with one clear follow-up question

${isVoiceInput ? 'For voice: be concise while emphasizing key terms.' : 'For text: use formatting to highlight key points briefly.'}`
    } else {
      systemPrompt = `Technical analyst ready. Awaiting data.`
    }

    const messages = []
    
    messages.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    })

    if (conversationHistory?.length) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })
      })
    }

    if (prompt) {
      messages.push({
        role: "user",
        parts: [{ text: prompt }]
      })
    }

    if (image) {
      const currentMessage = messages[messages.length - 1]
      currentMessage.parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: image.split(',')[1]
        }
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
          temperature: 0.7,  // Slightly reduced for more concise responses
          topK: 40,
          topP: 0.9,
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
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in analyze-asset function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.status || 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )
  }
})