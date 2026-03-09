import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ADMIN_EMAIL = 'seali870@gmail.com';

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
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Check admin by email
    if (user.email !== ADMIN_EMAIL) {
      return jsonResponse({ error: 'Forbidden: Admin access only' }, 403);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { action, ...params } = await req.json();

    // Ensure admin role exists for this user
    await adminClient.from('user_roles').upsert(
      { user_id: user.id, role: 'admin' },
      { onConflict: 'user_id,role' }
    );

    switch (action) {
      case 'list_users': {
        // Get all users from auth
        const { data: authUsers, error: authErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        if (authErr) throw authErr;

        // Get all profiles
        const { data: profiles, error: profErr } = await adminClient
          .from('user_profiles')
          .select('*');
        if (profErr) throw profErr;

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const users = authUsers.users.map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          profile: profileMap.get(u.id) || null,
        }));

        return jsonResponse({ users });
      }

      case 'update_plan': {
        const { user_id, plan_type, images_limit, images_used } = params;
        if (!user_id || !plan_type) {
          return jsonResponse({ error: 'user_id and plan_type required' }, 400);
        }

        const updateData: Record<string, unknown> = { plan_type, images_limit };
        if (images_used !== undefined) updateData.images_used = images_used;

        const { error } = await adminClient
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', user_id);

        if (error) throw error;
        return jsonResponse({ success: true });
      }

      case 'grant_access': {
        const { email, plan_type, images_limit } = params;
        if (!email || !plan_type) return jsonResponse({ error: 'email and plan_type required' }, 400);

        const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const targetUser = authUsers?.users.find(u => u.email === email);
        if (!targetUser) {
          return jsonResponse({ error: `User with email ${email} not found` }, 404);
        }

        const { error } = await adminClient
          .from('user_profiles')
          .update({ plan_type, images_limit: images_limit ?? -1, images_used: 0 })
          .eq('user_id', targetUser.id);

        if (error) throw error;
        return jsonResponse({ success: true, user_id: targetUser.id });
      }

      default:
        return jsonResponse({ error: 'Unknown action' }, 400);
    }
  } catch (error: unknown) {
    console.error('Admin error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: msg }, 500);
  }
});
