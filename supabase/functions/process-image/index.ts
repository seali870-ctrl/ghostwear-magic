import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FREE_TRIAL_LIMIT = 5;
const ADMIN_EMAIL = 'seali870@gmail.com';

const MODE_PROMPTS: Record<string, string> = {
  ghost: `Edit this exact clothing image. Do the following steps:
1. Keep the EXACT same clothing from the uploaded image - same colors, same patterns
2. Make the clothing appear worn by an invisible human body - natural body shape inside, proper shoulder width, chest, waist
3. The clothing must look INFLATED and 3D - not flat
4. Person-like pose: standing straight, arms slightly away from body
5. The clothing should be the HERO of the image - large, centered, clear, filling at least 60% of the image frame
6. Professional fashion editorial lighting
7. The result should look like a real model is wearing it but the body is invisible`,
  floating: `Edit this exact clothing image. Do the following steps:
1. Keep the EXACT same clothing - same colors, patterns, design
2. Make the clothing float in mid-air with a slight dynamic angle
3. Add subtle shadow below to show it's floating
4. The clothing must look 3D and have natural fabric draping
5. Professional fashion editorial lighting
6. The clothing should fill at least 60% of the frame`,
  flatlay: `Edit this exact clothing image. Do the following steps:
1. Keep the EXACT same clothing - same colors, patterns, design
2. Lay the clothing flat as seen from directly above (bird's eye view)
3. Neatly arranged with sleeves spread out symmetrically
4. Professional flat lay photography style
5. Clean, crisp lighting from above
6. The clothing should fill at least 60% of the frame`,
  female: `Place this exact clothing item on a professional female fashion model. Keep clothing identical - same color, design, text, patterns. The model should have a natural professional pose, confident stance. Studio lighting, professional fashion photography quality. The clothing should be clearly visible and be the main focus.`,
  male: `Place this exact clothing item on a professional male fashion model. Athletic build, professional pose, confident stance. Keep clothing identical - same color, design, text, patterns. Studio lighting, professional fashion photography quality. The clothing should be clearly visible and be the main focus.`,
  child_boy: `Place this exact clothing item on a cute child boy model age 6-8. Keep clothing identical - same color, design, text, patterns. Natural smile, playful but neat pose. Studio lighting, professional children's fashion photography quality. The clothing should be clearly visible and be the main focus.`,
  child_girl: `Place this exact clothing item on a cute child girl model age 6-8. Keep clothing identical - same color, design, text, patterns. Natural smile, playful but neat pose. Studio lighting, professional children's fashion photography quality. The clothing should be clearly visible and be the main focus.`,
  teen_boy: `Place this exact clothing item on a teenage male model age 13. Keep clothing identical - same color, design, text, patterns. Natural confident pose, modern and stylish stance. Studio lighting, professional teen fashion photography quality. The clothing should be clearly visible and be the main focus.`,
  teen_girl: `Place this exact clothing item on a teenage female model age 13. Keep clothing identical - same color, design, text, patterns. Natural confident pose, modern and stylish stance. Studio lighting, professional teen fashion photography quality. The clothing should be clearly visible and be the main focus.`,
  baby_boy: `Place this exact clothing item on a cute baby boy model age 0-12 months. Keep clothing identical - same color, design, text, patterns. Adorable natural pose, laying or sitting. Soft warm studio lighting, professional baby fashion photography quality. The clothing should be clearly visible and be the main focus.`,
  baby_girl: `Place this exact clothing item on a cute baby girl model age 0-12 months. Keep clothing identical - same color, design, text, patterns. Adorable natural pose, laying or sitting. Soft warm studio lighting, professional baby fashion photography quality. The clothing should be clearly visible and be the main focus.`,
};

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(userId);
    const isAdmin = authUser?.email === ADMIN_EMAIL;

    let currentUsage = 0;
    if (!isAdmin) {
      const { data: profile, error: profileError } = await adminClient
        .from('user_profiles')
        .select('images_used, images_limit, plan_type')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        return jsonResponse({ success: false, error: 'User profile not found' }, 404);
      }

      currentUsage = profile.images_used;

      if (profile.plan_type === 'free_trial' && profile.images_used >= FREE_TRIAL_LIMIT) {
        return jsonResponse({
          success: false,
          error: "You've used all 5 free images. Upgrade to continue.",
          code: 'FREE_TRIAL_EXHAUSTED',
          images_used: profile.images_used,
        }, 403);
      }

      if (profile.images_limit !== -1 && profile.images_used >= profile.images_limit) {
        return jsonResponse({
          success: false,
          error: 'Plan limit reached. Please upgrade.',
          code: 'PLAN_LIMIT_REACHED',
          images_used: profile.images_used,
        }, 403);
      }
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { image_base64, background, mode } = await req.json();
    if (!image_base64) throw new Error('No image provided');

    const selectedMode = mode && MODE_PROMPTS[mode] ? mode : 'ghost';
    let finalPrompt = MODE_PROMPTS[selectedMode];

    if (background) {
      finalPrompt += `\n\nPlace the clothing/model in this setting: ${background}. Keep the clothing as the main focus, background should be artistic but not distracting.`;
    } else {
      finalPrompt += `\n\nPure white background.`;
    }

    // Extract pure base64 data
    let pureBase64 = image_base64;
    let mimeType = 'image/png';
    if (pureBase64.startsWith('data:')) {
      const match = pureBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        pureBase64 = match[2];
      } else {
        pureBase64 = pureBase64.split(',')[1] || pureBase64;
      }
    }

    console.log(`Processing mode: ${selectedMode}, background: ${background ? 'custom' : 'white'}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: finalPrompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: pureBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI Gateway error status:', response.status);
      console.error('AI Gateway error body:', errText);
      
      let parsedError = errText;
      try {
        const errJson = JSON.parse(errText);
        parsedError = errJson.error?.message || errJson.message || errJson.error || errText;
      } catch { /* use raw text */ }

      if (response.status === 429) {
        return jsonResponse({ success: false, error: `Rate limit exceeded: ${parsedError}` }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ success: false, error: `AI credits exhausted: ${parsedError}` }, 402);
      }
      return jsonResponse({ success: false, error: `AI error (${response.status}): ${parsedError}` }, 500);
    }

    const data = await response.json();
    console.log('Gemini response keys:', Object.keys(data));
    
    // Extract image from Gemini response format
    let outputImage: string | undefined;
    const candidates = data.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inline_data) {
          outputImage = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
          break;
        }
      }
    }

    if (!outputImage) {
      console.error('Full Gemini response:', JSON.stringify(data).slice(0, 2000));
      return jsonResponse({ success: false, error: 'No image returned from Gemini. Try again.' }, 500);
    }

    let newCount = currentUsage + 1;
    if (!isAdmin) {
      await adminClient
        .from('user_profiles')
        .update({ images_used: newCount })
        .eq('user_id', userId);
    }

    console.log(`Image generated. User ${userId} (admin: ${isAdmin}) usage: ${newCount}`);

    return jsonResponse({ success: true, output_url: outputImage, images_used: newCount });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ success: false, error: errorMessage }, 500);
  }
});
