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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    

    const prompt = `Take this clothing item and generate a professional fashion photo showing it worn by an invisible ghost mannequin floating in the air. The clothing should look naturally worn with 3D shape, on a clean ${bg_color === 'grey' ? 'grey studio' : 'white/studio'} background. Professional e-commerce style.`;

    console.log('Calling Lovable AI Gateway for image generation...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits in your Lovable workspace settings.');
      }
      throw new Error(`AI Gateway failed [${response.status}]: ${errorText}`);
    }

    const data = await response.json();
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error('Unexpected response structure:', JSON.stringify(data).slice(0, 500));
      throw new Error('No image was generated. Please try again.');
    }

    return new Response(JSON.stringify({ success: true, output_url: generatedImage }), {
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
