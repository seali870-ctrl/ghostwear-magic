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

    const body = await req.json();
    const { action } = body;

    // ACTION: check-status — single poll for a given request_id
    if (action === 'check-status') {
      const { request_id } = body;
      if (!request_id) throw new Error('Missing request_id');

      const statusResp = await fetch(
        `https://queue.fal.run/fal-ai/image-apps-v2/product-photography/requests/${request_id}/status`,
        { method: 'GET', headers: { 'Authorization': `Key ${FAL_API_KEY}` } }
      );

      if (!statusResp.ok) {
        const errText = await statusResp.text();
        throw new Error(`Status check failed [${statusResp.status}]: ${errText}`);
      }

      const status = await statusResp.json();
      console.log('Status check:', status.status);

      if (status.status === 'COMPLETED') {
        // Fetch result
        const resultResp = await fetch(
          `https://queue.fal.run/fal-ai/image-apps-v2/product-photography/requests/${request_id}`,
          { headers: { 'Authorization': `Key ${FAL_API_KEY}` } }
        );
        if (!resultResp.ok) throw new Error('Failed to fetch result');
        const result = await resultResp.json();
        console.log('Result keys:', Object.keys(result));

        const outputUrl = result.image?.url || result.images?.[0]?.url || result.output?.url || result.url;
        if (!outputUrl) {
          console.error('Result structure:', JSON.stringify(result).slice(0, 500));
          throw new Error('No output image found in response');
        }

        return new Response(JSON.stringify({ status: 'COMPLETED', output_url: outputUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (status.status === 'FAILED') {
        return new Response(JSON.stringify({ status: 'FAILED', error: status.error || 'Processing failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Still processing
      return new Response(JSON.stringify({ status: status.status || 'IN_PROGRESS' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: submit (default) — upload image and submit to queue
    const { image_base64, bg_color } = body;
    if (!image_base64) throw new Error('No image provided');

    let imageUrl = image_base64;
    if (!imageUrl.startsWith('data:')) {
      imageUrl = `data:image/png;base64,${imageUrl}`;
    }

    // Upload image to fal.ai storage
    console.log('Uploading image to fal.ai storage...');
    const imageBlob = await (await fetch(imageUrl)).blob();
    
    const uploadResp = await fetch('https://fal.ai/api/cdn/upload', {
      method: 'PUT',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': imageBlob.type || 'image/png',
      },
      body: imageBlob,
    });

    let productImageUrl = imageUrl;
    if (uploadResp.ok) {
      const uploadData = await uploadResp.json();
      productImageUrl = uploadData.access_url || uploadData.url || imageUrl;
      console.log('Image uploaded:', productImageUrl);
    } else {
      console.log('CDN upload failed, trying multipart...');
      // Fallback: try multipart upload
      const form = new FormData();
      form.append('file', imageBlob, 'clothing.png');
      const upload2 = await fetch('https://fal.ai/api/cdn/upload', {
        method: 'POST',
        headers: { 'Authorization': `Key ${FAL_API_KEY}` },
        body: form,
      });
      if (upload2.ok) {
        const d = await upload2.json();
        productImageUrl = d.access_url || d.url || imageUrl;
        console.log('Multipart upload succeeded:', productImageUrl);
      } else {
        console.log('All uploads failed, using data URL');
      }
    }

    // Submit to fal.ai queue
    console.log('Submitting to fal-ai queue...');
    const submitResp = await fetch('https://queue.fal.run/fal-ai/image-apps-v2/product-photography', {
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
      console.error('Submit error:', submitResp.status, errText);
      throw new Error(`fal.ai submit failed [${submitResp.status}]: ${errText}`);
    }

    const { request_id } = await submitResp.json();
    console.log('Request submitted, ID:', request_id);

    // Return immediately with request_id
    return new Response(JSON.stringify({ success: true, request_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
