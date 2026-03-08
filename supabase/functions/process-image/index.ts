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
    if (!image_base64) throw new Error('No image provided');

    let imageUrl = image_base64;
    if (!imageUrl.startsWith('data:')) {
      imageUrl = `data:image/png;base64,${imageUrl}`;
    }

    // Upload image to fal.ai storage
    console.log('Uploading image to fal.ai storage...');
    const imageBlob = await (await fetch(imageUrl)).blob();

    // Try REST upload endpoint
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
      const uploadErr = await uploadResp.text();
      console.log('CDN upload response:', uploadResp.status, uploadErr);
      console.log('Using data URL directly');
    }

    // Call fal.ai synchronously (blocking call, returns when done)
    console.log('Calling fal-ai/image-apps-v2/product-photography synchronously...');
    const result = await fetch('https://fal.run/fal-ai/image-apps-v2/product-photography', {
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

    if (!result.ok) {
      const errText = await result.text();
      console.error('fal.ai error:', result.status, errText);
      throw new Error(`fal.ai failed [${result.status}]: ${errText}`);
    }

    const data = await result.json();
    console.log('Result keys:', Object.keys(data));

    const outputUrl = data.image?.url || data.images?.[0]?.url || data.output?.url || data.url;
    if (!outputUrl) {
      console.error('Result structure:', JSON.stringify(data).slice(0, 500));
      throw new Error('No output image found in response');
    }

    return new Response(JSON.stringify({ success: true, output_url: outputUrl }), {
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
