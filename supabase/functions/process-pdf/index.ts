import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const assetId = formData.get('assetId') as string

    if (!file || !assetId) {
      throw new Error('Missing required fields')
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const numberOfPages = pdfDoc.getPageCount()
    
    // Extract text content from PDF
    let content = ''
    for (let i = 0; i < numberOfPages; i++) {
      const page = pdfDoc.getPage(i)
      const textContent = await page.getTextContent()
      content += textContent + '\n'
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Store the extracted content in the equipment_documentation table
    const { error: insertError } = await supabase
      .from('equipment_documentation')
      .insert({
        asset_id: assetId,
        title: file.name,
        content: content,
        document_type: 'manual',
        metadata: {
          original_filename: file.name,
          page_count: numberOfPages,
          file_size: file.size,
          mime_type: file.type,
        }
      })

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})