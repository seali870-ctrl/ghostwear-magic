import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASE_PROMPT = `Edit this image: Remove the background completely. 

Keep only the clothing items. 

Make the clothes appear as if worn by an invisible ghost mannequin - 

give them a 3D inflated natural shape as if a body is inside them.

The jacket should be open and full, pants should have leg shape.

Float them slightly in the air.

Add professional studio lighting with soft shadows below.

Result must look like a professional e-commerce product photo.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { image_base64, background } = await req.json();
    if (!image_base64) throw new Error('No image provided');

    let finalPrompt = BASE_PROMPT;
    if (background) {
      finalPrompt += `\n\nPlace the floating ghost mannequin clothing in this setting: ${background}. Keep the clothing as the main focus, background should be artistic but not distracting.`;
    } else {
      finalPrompt += `\n\nPure white background.`;
    }

    // Ensure it's a proper data URL
    let imageUrl = image_base64;
    if (!imageUrl.startsWith('data:')) {
      imageUrl = `data:image/png;base64,${imageUrl}`;
    }

    console.log('Calling Lovable AI Gateway with gemini-2.5-flash-image...');

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
              { type: 'text', text: PROMPT },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI Gateway error:', response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    console.log('AI response received, checking for image...');

    // Extract the generated image from the response
    const outputImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!outputImage) {
      console.error('Response structure:', JSON.stringify(data).slice(0, 1000));
      throw new Error('No image returned from AI model');
    }

    console.log('Image generated successfully');

    return new Response(JSON.stringify({ success: true, output_url: outputImage }), {
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
