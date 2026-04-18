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

    const { type, context, history, message, mode } = await req.json();

    let systemPrompt = "";
    let messages: Array<{ role: string; content: string }> = [];
    let maxTokens = 300;

    switch (type) {
      case "suggestions":
        systemPrompt = "You are a personal habit coach. Based on the user's recent logs, provide exactly 2 short, actionable suggestions to improve their habit. Be specific and encouraging. Return only the 2 suggestions as bullet points.";
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here are my last 14 days of logs:\n${context}\n\nGive me 2 personalized suggestions.` },
        ];
        break;
      case "weekly-review":
        systemPrompt = "You are a motivational coach. Write a short motivational paragraph (3-4 sentences) reviewing the user's week, then add 1 key insight. Be warm and encouraging.";
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is my 7-day summary:\n${context}\n\nWrite my weekly review.` },
        ];
        break;
      case "prediction":
        systemPrompt = "You are a data analyst. Based on the streak data, write one natural language sentence predicting when they'll hit a 30-day streak. Be encouraging. Return only one sentence.";
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: context },
        ];
        break;
      case "correlation":
        systemPrompt = "You are a data analyst. Find one interesting correlation between the user's goals. Return one sentence observation.";
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Goal data:\n${context}\n\nFind a correlation.` },
        ];
        break;
      case "coach": {
        // Modes: 'briefing' (daily greeting), 'plan' (full day plan), 'chat' (free Q&A)
        const baseSystem = `You are an elite personal coach for training, nutrition, habits, and mindset. You speak warmly, like iMessage — concise, friendly, no fluff. Use short paragraphs and the occasional emoji. NEVER use markdown headers (#) or long bullet dumps; keep it conversational.

You have full context about the user below. Refer to it naturally — don't restate it as a list unless asked.

USER CONTEXT:
${context || "No additional context."}`;

        let modeInstruction = "";
        if (mode === "briefing") {
          modeInstruction = "Give a short personalized daily briefing (3-5 sentences). Mention 1-2 specific things from their data (a streak, a recent workout, today's habits) and end with one focused suggestion for today.";
          maxTokens = 350;
        } else if (mode === "plan") {
          modeInstruction = "Generate a full day plan tailored to this user's goals, habits, recent training, and physique trend. Format as a simple time-blocked list (Morning / Midday / Afternoon / Evening) with 1-2 lines per block. Be realistic and specific.";
          maxTokens = 600;
        } else {
          modeInstruction = "Answer the user's question directly and helpfully. Reference their data when relevant.";
          maxTokens = 500;
        }

        messages = [{ role: "system", content: `${baseSystem}\n\nINSTRUCTION: ${modeInstruction}` }];

        // Include up to last 10 messages of history
        if (Array.isArray(history)) {
          const recent = history.slice(-10).filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
          messages.push(...recent);
        }

        if (typeof message === "string" && message.trim()) {
          messages.push({ role: "user", content: message });
        }
        break;
      }
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
        messages,
        max_tokens: maxTokens,
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
    console.error("Unhandled error in groq-ai:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
