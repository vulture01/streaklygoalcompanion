import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DAILY_LIMIT = 15;
const MODEL = "llama-3.3-70b-versatile";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid body. Expected { messages, systemPrompt? }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { messages, systemPrompt } = body as {
      messages: Array<{ role: string; content: string }>;
      systemPrompt?: string;
    };

    const MAX_MESSAGES = 20;
    const MAX_CONTENT = 2000;
    const MAX_SYSTEM_PROMPT = 4000;

    if (systemPrompt && (typeof systemPrompt !== "string" || systemPrompt.length > MAX_SYSTEM_PROMPT)) {
      return new Response(JSON.stringify({ error: "System prompt too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Too many messages (max ${MAX_MESSAGES})` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate messages shape and length
    const cleanMessages = messages.filter(
      (m) =>
        m &&
        typeof m.content === "string" &&
        m.content.length <= MAX_CONTENT &&
        ["system", "user", "assistant"].includes(m.role),
    );
    if (cleanMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages (each content must be <= 2000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (cleanMessages.length !== messages.length) {
      return new Response(JSON.stringify({ error: "One or more messages exceed 2000 chars or have invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await admin
      .from("profiles")
      .select("groq_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    const userHasOwnKey = !!profile?.groq_api_key;
    const sharedKey = Deno.env.get("GROQ_API_KEY");
    const groqApiKey = userHasOwnKey ? profile!.groq_api_key : sharedKey;

    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: "No Groq API key configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Daily rate-limit only when using shared key
    if (!userHasOwnKey) {
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await admin
        .from("ai_usage")
        .select("call_count")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      const currentCount = usage?.call_count ?? 0;
      if (currentCount >= DAILY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "rate_limit",
            message: `Daily free limit reached (${DAILY_LIMIT}/${DAILY_LIMIT}). Add your own Groq key for unlimited access.`,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const finalMessages =
      systemPrompt && typeof systemPrompt === "string"
        ? [{ role: "system", content: systemPrompt }, ...cleanMessages.filter((m) => m.role !== "system")]
        : cleanMessages;

    const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: finalMessages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!groqResp.ok) {
      const errText = await groqResp.text();
      console.error("Groq API error:", groqResp.status, errText);
      return new Response(JSON.stringify({ error: "Groq API error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqResp.json();
    const result = groqData.choices?.[0]?.message?.content ?? "";

    if (!userHasOwnKey) {
      const today = new Date().toISOString().split("T")[0];
      await admin.rpc("increment_ai_usage", { _user_id: user.id, _date: today });
    }

    return new Response(JSON.stringify({ result, model: MODEL }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("groq-proxy unhandled:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
