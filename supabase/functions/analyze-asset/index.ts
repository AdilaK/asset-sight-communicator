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

    console.log('Processing request with prompt:', prompt)
    console.log('Conversation history:', conversationHistory)
    console.log('Image data received:', image ? 'Yes' : 'No')

    let systemPrompt = ''
    if (image) {
      systemPrompt = `You are an industrial equipment analyst specializing in technical assessment. Analyze the image and provide a precise technical evaluation in these 4 sections (max 50 words each):

1) Assessment
- Equipment classification, model specifications, and key technical parameters
- Use industry-standard nomenclature and precise measurements

2) Asset Identification
- Critical specifications including power ratings, operational thresholds, and compliance standards
- Include relevant ISO/IEC standards where applicable

3) Safety Check
- Quantifiable safety metrics and compliance status
- Identify specific hazard categories per OSHA/ISO guidelines
- List exact clearance requirements and safety zone dimensions

4) Environmental Impact
- Measurable environmental parameters (emissions, energy efficiency)
- Specific regulatory compliance metrics
- Quantitative impact assessment values

Focus on technical precision. Use industry-standard units and terminology. Prioritize measurable data over qualitative assessments.`
    } else if (prompt) {
      systemPrompt = `You are an industrial equipment analyst. Respond with maximum technical precision in 50 words or less. 
Focus exclusively on:
- Quantifiable specifications and metrics
- Industry standards and compliance requirements
- Technical parameters and thresholds
- Exact measurements and operational values
Avoid qualitative descriptions. Use only industry-standard terminology.`
    } else {
      systemPrompt = `Industrial equipment analyst awaiting image or query for technical assessment. Please provide visual data or specific technical inquiry.`
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

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.1, // Reduced temperature for more precise, technical responses
          topK: 16, // Reduced for more focused responses
          topP: 0.8, // Adjusted for better technical precision
          maxOutputTokens: 256,
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