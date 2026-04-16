import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_LIMIT = 15;

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use anon client for user auth check
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabaseAnon.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for ai_usage table operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has their own Groq API key
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("groq_api_key")
      .eq("user_id", user.id)
      .single();

    const userHasOwnKey = !!profile?.groq_api_key;
    const sharedKey = Deno.env.get("GROQ_API_KEY");

    const groqApiKey = userHasOwnKey ? profile.groq_api_key : sharedKey;

    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: "No Groq API key available. Please contact support." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting only for shared key users
    if (!userHasOwnKey) {
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabaseAdmin
        .from("ai_usage")
        .select("call_count")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      const currentCount = usage?.call_count || 0;

      if (currentCount >= DAILY_LIMIT) {
        return new Response(JSON.stringify({
          error: "rate_limit",
          message: "You've used all 15 AI calls for today. Come back tomorrow or add your own Groq API key in settings for unlimited access.",
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { type, context } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "suggestions":
        systemPrompt = "You are a personal habit coach. Based on the user's recent logs, provide exactly 2 short, actionable suggestions to improve their habit. Be specific and encouraging. Return only the 2 suggestions as bullet points.";
        userPrompt = `Here are my last 14 days of logs:\n${context}\n\nGive me 2 personalized suggestions.`;
        break;
      case "weekly-review":
        systemPrompt = "You are a motivational coach. Write a short motivational paragraph (3-4 sentences) reviewing the user's week, then add 1 key insight. Be warm and encouraging.";
        userPrompt = `Here is my 7-day summary:\n${context}\n\nWrite my weekly review.`;
        break;
      case "prediction":
        systemPrompt = "You are a data analyst. Based on the streak data, write one natural language sentence predicting when they'll hit a 30-day streak. Be encouraging. Return only one sentence.";
        userPrompt = context;
        break;
      case "correlation":
        systemPrompt = "You are a data analyst. Find one interesting correlation between the user's goals. Return one sentence observation.";
        userPrompt = `Goal data:\n${context}\n\nFind a correlation.`;
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq error:", groqResponse.status, errText);
      return new Response(JSON.stringify({ error: "Groq API error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqResponse.json();
    const result = groqData.choices?.[0]?.message?.content || "";

    // Increment usage count for shared key users after successful call
    if (!userHasOwnKey) {
      const today = new Date().toISOString().split("T")[0];
      await supabaseAdmin.rpc("increment_ai_usage", { _user_id: user.id, _date: today });
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
