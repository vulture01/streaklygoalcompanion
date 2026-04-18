import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller
    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabaseAnon.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const uid = user.id;

    // Delete all user data across tables (service role bypasses RLS)
    const tables = [
      "session_sets",
      "workout_sessions",
      "routine_exercises",
      "routines",
      "habit_completions",
      "habits",
      "logs",
      "badges",
      "todos",
      "physique_logs",
      "goals",
      "ai_usage",
      "profiles",
    ];

    // Remove user's physique photos from storage
    try {
      const { data: files } = await admin.storage.from("physique-photos").list(uid);
      if (files && files.length > 0) {
        await admin.storage
          .from("physique-photos")
          .remove(files.map((f) => `${uid}/${f.name}`));
      }
    } catch (storageErr) {
      console.error("Failed to clean physique photos:", storageErr);
    }

    for (const t of tables) {
      const { error } = await admin.from(t).delete().eq("user_id", uid);
      if (error) {
        console.error(`Failed to delete from ${t}:`, error);
      }
    }

    // Delete the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      console.error("Failed to delete auth user:", delErr);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in delete-account:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
