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
    const REMOVE_BG_API_KEY = Deno.env.get('REMOVE_BG_API_KEY');
    if (!REMOVE_BG_API_KEY) {
      throw new Error('REMOVE_BG_API_KEY is not configured');
    }

    const { image_base64, bg_color } = await req.json();

    if (!image_base64) {
      throw new Error('No image provided');
    }

    // Strip data URL prefix if present
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');

    const formData = new FormData();
    // Convert base64 to blob
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });
    formData.append('image_file', blob, 'image.png');
    formData.append('size', 'auto');

    // Set background color
    if (bg_color === 'white') {
      formData.append('bg_color', 'FFFFFF');
    } else if (bg_color === 'grey') {
      formData.append('bg_color', 'E5E5E5');
    }
    // transparent = no bg_color param (default)

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Remove.bg API failed [${response.status}]: ${errorText}`);
    }

    // Response is the image binary
    const imageBuffer = await response.arrayBuffer();
    const resultBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const resultDataUrl = `data:image/png;base64,${resultBase64}`;

    return new Response(JSON.stringify({ success: true, output_url: resultDataUrl }), {
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
