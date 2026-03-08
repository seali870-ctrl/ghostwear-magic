import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    const { image_base64, bg_color } = await req.json();

    if (!image_base64) {
      throw new Error('No image provided');
    }

    // Ensure proper data URL format
    let imageUrl = image_base64;
    if (!imageUrl.startsWith('data:')) {
      imageUrl = `data:image/png;base64,${imageUrl}`;
    }

    // Step 1: Upload image to fal.ai storage
    console.log('Uploading image to fal.ai storage...');
    const imageBlob = await (await fetch(imageUrl)).blob();
    const uploadForm = new FormData();
    uploadForm.append('file', imageBlob, 'clothing.png');

    const uploadResp = await fetch('https://fal.run/fal-ai/file-upload', {
      method: 'POST',
      headers: { 'Authorization': `Key ${FAL_API_KEY}` },
      body: uploadForm,
    });

    let productImageUrl = imageUrl;
    if (uploadResp.ok) {
      const uploadData = await uploadResp.json();
      productImageUrl = uploadData.url || imageUrl;
      console.log('Image uploaded to fal storage:', productImageUrl);
    } else {
      console.log('File upload failed, using data URL directly');
    }

    // Step 2: Submit to fal.ai queue
    console.log('Submitting to fal-ai/fashion-product-photos...');
    const submitResp = await fetch('https://queue.fal.run/fal-ai/fashion-product-photos', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_image_url: productImageUrl,
        background_color: bg_color === 'grey' ? 'grey' : 'white',
      }),
    });

    if (!submitResp.ok) {
      const errText = await submitResp.text();
      console.error('fal.ai submit error:', submitResp.status, errText);
      throw new Error(`fal.ai submit failed [${submitResp.status}]: ${errText}`);
    }

    const { request_id } = await submitResp.json();
    console.log('Request submitted, ID:', request_id);

    // Step 3: Poll for completion
    const maxWait = 120000; // 2 minutes
    const pollInterval = 2000;
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      await new Promise(r => setTimeout(r, pollInterval));

      const statusResp = await fetch(
        `https://queue.fal.run/fal-ai/fashion-product-photos/requests/${request_id}/status`,
        { headers: { 'Authorization': `Key ${FAL_API_KEY}` } }
      );

      if (!statusResp.ok) continue;
      const status = await statusResp.json();
      console.log('Status:', status.status);

      if (status.status === 'COMPLETED') {
        // Fetch result
        const resultResp = await fetch(
          `https://queue.fal.run/fal-ai/fashion-product-photos/requests/${request_id}`,
          { headers: { 'Authorization': `Key ${FAL_API_KEY}` } }
        );

        if (!resultResp.ok) {
          throw new Error('Failed to fetch result from fal.ai');
        }

        const result = await resultResp.json();
        console.log('Result keys:', Object.keys(result));

        // Extract output image URL - check common fal.ai response structures
        const outputUrl = result.image?.url || result.images?.[0]?.url || result.output?.url || result.url;

        if (!outputUrl) {
          console.error('Unexpected result structure:', JSON.stringify(result).slice(0, 500));
          throw new Error('No output image found in fal.ai response');
        }

        return new Response(JSON.stringify({ success: true, output_url: outputUrl }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (status.status === 'FAILED') {
        throw new Error('fal.ai processing failed: ' + (status.error || 'Unknown error'));
      }
    }

    throw new Error('Processing timed out after 2 minutes');

  } catch (error: unknown) {
    console.error('Error processing image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
