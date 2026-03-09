import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FREE_TRIAL_LIMIT = 5;

const BASE_PROMPT = `Edit this exact clothing image. Do the following steps:

1. Keep the EXACT same clothing from the uploaded image - same colors, same patterns

2. Make the clothing appear worn by an invisible human body - natural body shape inside, proper shoulder width, chest, waist

3. The clothing must look INFLATED and 3D - not flat

4. Person-like pose: standing straight, arms slightly away from body

5. The clothing should be the HERO of the image - large, centered, clear, filling at least 60% of the image frame

6. Professional fashion editorial lighting

7. The result should look like a real model is wearing it but the body is invisible`;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth: extract user from JWT ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user with their JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // --- Usage check with service role (bypasses RLS) ---
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('images_used, images_limit, plan_type')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return jsonResponse({ success: false, error: 'User profile not found' }, 404);
    }

    // Server-side enforcement: block free trial users at limit
    if (profile.plan_type === 'free_trial' && profile.images_used >= FREE_TRIAL_LIMIT) {
      return jsonResponse({
        success: false,
        error: "You've used all 5 free images. Upgrade to continue.",
        code: 'FREE_TRIAL_EXHAUSTED',
        images_used: profile.images_used,
      }, 403);
    }

    // Block any plan that has a non-unlimited limit
    if (profile.images_limit !== -1 && profile.images_used >= profile.images_limit) {
      return jsonResponse({
        success: false,
        error: 'Plan limit reached. Please upgrade.',
        code: 'PLAN_LIMIT_REACHED',
        images_used: profile.images_used,
      }, 403);
    }

    // --- Process image ---
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

    let imageUrl = image_base64;
    if (!imageUrl.startsWith('data:')) {
      imageUrl = `data:image/png;base64,${imageUrl}`;
    }

    console.log('Calling Lovable AI Gateway...');

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
              { type: 'text', text: finalPrompt },
              { type: 'image_url', image_url: { url: imageUrl } },
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
        return jsonResponse({ success: false, error: 'Rate limit exceeded. Please try again in a moment.' }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ success: false, error: 'AI credits exhausted.' }, 402);
      }
      throw new Error(`AI Gateway error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const outputImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!outputImage) {
      console.error('Response structure:', JSON.stringify(data).slice(0, 1000));
      throw new Error('No image returned from AI model');
    }

    // --- Increment usage AFTER successful generation ---
    const newCount = profile.images_used + 1;
    await adminClient
      .from('user_profiles')
      .update({ images_used: newCount })
      .eq('user_id', userId);

    console.log(`Image generated. User ${userId} usage: ${newCount}`);

    return jsonResponse({ success: true, output_url: outputImage, images_used: newCount });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ success: false, error: errorMessage }, 500);
  }
});
