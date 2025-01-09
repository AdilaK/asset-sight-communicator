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
    console.log('Conversation history length:', conversationHistory?.length || 0)
    console.log('Image data received:', image ? 'Yes' : 'No')

    let systemPrompt = ''
    if (image) {
      const hasExistingAnalysis = conversationHistory && conversationHistory.length > 0
      const previousAnalysis = hasExistingAnalysis ? 
        conversationHistory[conversationHistory.length - 2]?.content || '' : '';
      
      systemPrompt = `You are a technical equipment analyst. ${hasExistingAnalysis ? 
        'This is a follow-up analysis of the same equipment. Compare with the previous analysis and highlight new findings.' : 
        'Provide an initial detailed analysis.'} 

Analyze the equipment in these 4 sections:

1) Assessment
- Equipment identification and specifications
${hasExistingAnalysis ? `- Compare with previous analysis:
  * New visible features or components
  * Different angles showing new details
  * Changes in condition or status
  * Confirm or update previous observations` : '- Identify key features and specifications'}

2) Asset Identification
- Technical specifications and standards
${hasExistingAnalysis ? `- Compare with previous data:
  * New visible specifications
  * Additional components or features
  * Confirmation or updates to previous measurements
  * Any discrepancies found` : '- Document all visible specifications'}

3) Safety Check
- Hazard assessment and safety requirements
${hasExistingAnalysis ? `- Update safety analysis:
  * New safety concerns from this angle
  * Changes in condition affecting safety
  * Additional hazards not previously visible
  * Confirmation of previous safety issues` : '- Identify all safety concerns'}

4) Environmental Impact
- Environmental considerations and compliance
${hasExistingAnalysis ? `- Compare environmental factors:
  * New environmental impacts visible
  * Changes in compliance status
  * Additional environmental considerations
  * Updates to previous environmental observations` : '- Assess environmental impact'}

${hasExistingAnalysis ? 
`Previous Analysis Summary:
${previousAnalysis}

CRITICAL: Your response must explicitly reference the previous analysis and clearly indicate what is new or different in this image. Use phrases like "In this new angle..." or "This view reveals..." and make direct comparisons.` : 
'Provide a comprehensive initial analysis.'}

Use technical terminology and focus on measurable data. Be specific about what you observe.`
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
      // Include relevant context from conversation history
      const recentHistory = conversationHistory.slice(-4)
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

    console.log('Sending request to Gemini API with message count:', messages.length)

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
    console.log('Gemini API response received')

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