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
      const hasExistingAnalysis = conversationHistory && conversationHistory.length > 0
      
      // Enhanced prompt for better follow-up analysis
      systemPrompt = `You are a technical equipment analyst. ${hasExistingAnalysis ? 'This is a follow-up analysis of the same equipment from a different angle or time. Your task is to compare with previous observations and highlight new findings.' : ''} 

Provide a detailed technical analysis in 4 sections:

1) Assessment
- Equipment identification and specifications
${hasExistingAnalysis ? `- IMPORTANT: Compare with previous analysis and explicitly state:
  * New visible features or components
  * Different angles or perspectives providing new information
  * Any changes in condition or status` : '- Identify key features and specifications'}

2) Asset Identification
- Technical specifications and standards
${hasExistingAnalysis ? `- Compare with previous data:
  * Confirm or update previous measurements
  * Note any additional visible specifications
  * Highlight any discrepancies or new findings` : '- Document all visible specifications'}

3) Safety Check
- Hazard assessment and safety requirements
${hasExistingAnalysis ? `- Update safety analysis:
  * New safety concerns from this angle
  * Changes in condition affecting safety
  * Additional hazards not visible in previous images` : '- Identify all safety concerns'}

4) Environmental Impact
- Environmental considerations and compliance
${hasExistingAnalysis ? `- Compare environmental factors:
  * New environmental impacts visible
  * Changes in compliance status
  * Additional environmental considerations` : '- Assess environmental impact'}

${hasExistingAnalysis ? 'CRITICAL: Your response must explicitly reference previous observations and clearly indicate what is new or different in this image. Use phrases like "In this new image..." or "Unlike the previous view..."' : 'Provide a comprehensive initial analysis.'}

Use technical terminology and focus on measurable data.`
    } else if (prompt) {
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
      // Include only the last 5 messages to maintain context without exceeding token limits
      const recentHistory = conversationHistory.slice(-5)
      recentHistory.forEach(msg => {
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
          temperature: 0.7,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 2048,
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

    // Validate the response format
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid response format:', result)
      throw new Error('Invalid or empty response from Gemini API')
    }

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