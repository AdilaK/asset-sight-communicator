import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.20.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const chunks: string[] = [];
  const uint8Array = new Uint8Array(buffer);
  const chunkSize = 32768; // Process in smaller chunks
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    chunks.push(String.fromCharCode.apply(null, chunk));
  }
  
  return btoa(chunks.join(''));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice } = await req.json()
    console.log('Received text-to-speech request:', { textLength: text?.length, voice })

    if (!text) {
      throw new Error('Text is required')
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    console.log('Generating speech from text...')
    
    // Generate speech from text
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.substring(0, 4096), // OpenAI limit
        voice: voice || 'alloy',
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      throw new Error(error.error?.message || 'Failed to generate speech')
    }

    console.log('Successfully generated speech, converting to base64...')
    
    // Convert audio buffer to base64 using chunked processing
    const arrayBuffer = await response.arrayBuffer()
    const base64Audio = arrayBufferToBase64(arrayBuffer)

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Text-to-speech error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})