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
      systemPrompt = `You are a technical industrial equipment analyst. Analyze the image and provide a highly technical but concise assessment (STRICTLY under 50 words) in exactly these 4 sections:

1) Asset Identification
- Equipment type, model, specs (be specific with technical terms)

2) Safety Check
- Critical safety concerns using industry-standard terminology

3) Condition Assessment
- Technical evaluation of wear patterns and operational status

4) Environmental Impact
- Quantifiable environmental metrics and compliance status

Format response in clear paragraphs. Use precise technical terminology. Be extremely concise but maintain technical depth. NEVER exceed 50 words per section.`
    } else if (prompt) {
      systemPrompt = `You are a technical industrial equipment analyst. Provide a highly technical response (STRICTLY under 50 words) using industry-standard terminology and precise technical specifications. Format in clear paragraphs. Focus on quantifiable metrics and technical parameters. Response MUST be under 50 words total.`
    } else {
      systemPrompt = `You are a technical industrial equipment analyst. Please request an equipment image for technical analysis.`
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
          temperature: 0.2,
          topK: 32,
          topP: 1,
          maxOutputTokens: 100, // Reduced to enforce brevity while maintaining technical depth
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

    // Validate response length
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = result.candidates[0].content.parts[0].text;
      const wordCount = text.split(/\s+/).length;
      
      if (wordCount > 50) {
        console.warn(`Response exceeded 50 words (${wordCount} words). Truncating...`);
        // Truncate to roughly 50 words while maintaining sentence structure
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        let truncatedText = '';
        let currentWordCount = 0;
        
        for (const sentence of sentences) {
          const sentenceWordCount = sentence.trim().split(/\s+/).length;
          if (currentWordCount + sentenceWordCount <= 50) {
            truncatedText += sentence;
            currentWordCount += sentenceWordCount;
          } else {
            break;
          }
        }
        
        result.candidates[0].content.parts[0].text = truncatedText.trim();
      }
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