import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    const { image_base64, style, bg_color } = await req.json();

    if (!image_base64) {
      throw new Error('No image provided');
    }

    // Use a background removal model on Replicate
    // cjwbw/rembg is a reliable background removal model
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        input: {
          image: image_base64,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Replicate create prediction failed [${createResponse.status}]: ${errorText}`);
    }

    const prediction = await createResponse.json();
    let result = prediction;

    // Poll for completion
    const maxAttempts = 60;
    let attempts = 0;

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        },
      });

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        throw new Error(`Replicate poll failed [${pollResponse.status}]: ${errorText}`);
      }

      result = await pollResponse.json();
      attempts++;
    }

    if (result.status === 'failed') {
      throw new Error(`Replicate processing failed: ${result.error || 'Unknown error'}`);
    }

    if (result.status !== 'succeeded') {
      throw new Error('Processing timed out');
    }

    // result.output is the URL of the processed image
    const outputUrl = typeof result.output === 'string' ? result.output : result.output?.[0] || result.output;

    return new Response(JSON.stringify({ success: true, output_url: outputUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error processing image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
