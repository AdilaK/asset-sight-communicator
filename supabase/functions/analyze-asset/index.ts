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
    const { image, prompt } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured')
    }

    console.log('Processing request with prompt:', prompt);
    console.log('Image data received:', image ? 'Yes' : 'No');

    const defaultPrompt = `Please analyze this equipment in detail and provide:
1) Type and model identification - Include specific details about make, model, and key specifications
2) Safety assessment - Evaluate current safety status, potential risks, and recommended safety measures
3) Condition evaluation - Assess current operational state, wear patterns, and maintenance needs
4) Environmental impact analysis - Consider energy efficiency, emissions, and sustainability aspects
5) Optimization recommendations - Suggest improvements for performance, efficiency, and longevity
Please be specific and detailed in your analysis, providing actionable insights and recommendations.`

    let requestBody;
    if (image) {
      requestBody = {
        contents: [{
          parts: [
            {
              text: prompt || defaultPrompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: image.split(',')[1]
              }
            }
          ]
        }]
      };
    } else {
      // For text-only analysis, create a more conversational prompt
      requestBody = {
        contents: [{
          parts: [
            {
              text: `You are an expert industrial equipment analyst. Please provide detailed, technical, yet understandable responses to questions about equipment maintenance, optimization, and troubleshooting. Consider safety implications, efficiency improvements, and best practices in your response. Here is the user's question: ${prompt}`
            }
          ]
        }]
      };
    }

    console.log('Sending request to Gemini API...');
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      
      try {
        const parsedError = JSON.parse(error)
        if (parsedError.error?.code === 429) {
          return new Response(
            JSON.stringify({ 
              error: "Rate limit exceeded. Please try again in a few minutes.",
              retryAfter: 60
            }),
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      } catch (e) {
        throw new Error(`Gemini API error: ${error}`)
      }
      
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
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})