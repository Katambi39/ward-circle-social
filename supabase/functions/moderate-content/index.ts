import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, content_type, content_id, user_id } = await req.json();

    if (!text || !content_type) {
      return new Response(JSON.stringify({ error: "text and content_type are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a content moderation AI for a Kenyan community social platform called Conect. 
Your job is to analyze user-generated content and determine if it violates community guidelines.

Flag content that contains:
- Hate speech, tribalism, or ethnic discrimination
- Threats of violence or incitement
- Explicit sexual content
- Spam or scam attempts (e.g. fake investments, phishing)
- Harassment, bullying, or targeted abuse
- Misinformation about health or elections
- Personal information exposure (doxxing)

Do NOT flag:
- Political opinions or criticism (unless inciting violence)
- Strong language that isn't directed at individuals
- Satire or humor
- Legitimate marketplace posts
- Cultural or religious discussions

You must respond using the provided tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this ${content_type} content:\n\n"${text}"` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "moderation_result",
              description: "Return the moderation analysis result",
              parameters: {
                type: "object",
                properties: {
                  is_flagged: {
                    type: "boolean",
                    description: "Whether the content violates community guidelines",
                  },
                  severity: {
                    type: "string",
                    enum: ["none", "low", "medium", "high", "critical"],
                    description: "Severity of the violation. none if not flagged.",
                  },
                  reason: {
                    type: "string",
                    description: "Brief explanation of why content was flagged, or 'Content is acceptable' if not flagged",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score 0-1 of the moderation decision",
                  },
                  should_block: {
                    type: "boolean",
                    description: "Whether the content should be blocked from posting (only for high/critical severity)",
                  },
                },
                required: ["is_flagged", "severity", "reason", "confidence", "should_block"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "moderation_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          is_flagged: false, 
          severity: "none", 
          reason: "Rate limited - content allowed", 
          confidence: 0, 
          should_block: false 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          is_flagged: false, 
          severity: "none", 
          reason: "Credits exhausted - content allowed", 
          confidence: 0, 
          should_block: false 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      // Fail open - allow content if AI is unavailable
      return new Response(JSON.stringify({ 
        is_flagged: false, 
        severity: "none", 
        reason: "Moderation unavailable - content allowed", 
        confidence: 0, 
        should_block: false 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ 
        is_flagged: false, 
        severity: "none", 
        reason: "Could not parse moderation result", 
        confidence: 0, 
        should_block: false 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // If flagged and we have content details, log to moderation_flags table
    if (result.is_flagged && content_id && user_id) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (SUPABASE_URL && SERVICE_ROLE_KEY) {
        await fetch(`${SUPABASE_URL}/rest/v1/moderation_flags`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            content_type,
            content_id,
            user_id,
            flagged_text: text.substring(0, 500),
            reason: result.reason,
            severity: result.severity,
            ai_confidence: result.confidence,
          }),
        });
      }

      // Update post moderation_status if it's a post
      if (content_type === "post" && SUPABASE_URL && SERVICE_ROLE_KEY) {
        await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${content_id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            moderation_status: result.should_block ? "blocked" : "flagged",
            moderation_reason: result.reason,
          }),
        });
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Moderation error:", e);
    // Fail open
    return new Response(JSON.stringify({ 
      is_flagged: false, 
      severity: "none", 
      reason: "Error occurred - content allowed", 
      confidence: 0, 
      should_block: false 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
