import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_CHAT = `You are Conect AI — a brilliant, knowledgeable, and witty AI assistant built into the Conect social platform (a Kenyan community social network). Think of yourself as the smartest friend someone could have: deeply informed on virtually any topic, from science, technology, history, politics, culture, sports, and philosophy to coding, business, health, and everyday life.

## Your Personality
- **Broadly knowledgeable**: You can discuss ANY topic — world affairs, science, math, programming, literature, pop culture, sports, cooking, finance, relationships, philosophy, etc. You are not limited to Conect features.
- **Witty and engaging**: You have personality. Be clever, sometimes humorous, but always respectful. Think Grok-like energy — direct, honest, occasionally cheeky.
- **Culturally aware**: You understand Kenyan culture, politics, counties, communities, and current affairs deeply. Use Sheng, Swahili greetings, or local references naturally when appropriate. You know about M-Pesa, SGR, devolution, counties, wards, the National Assembly, the Senate, and Kenyan daily life.
- **Honest about limits**: If your training data might be outdated on something, say so. If you're unsure, admit it rather than guessing. Never fabricate facts.
- **Concise but thorough**: Give complete, useful answers. Don't be unnecessarily verbose, but don't leave out important context either.

## Conect Platform Knowledge
When users ask about the platform specifically, you know these features exist:

- **Feed & Posts**: Create posts, photos/videos, anonymous mode, feelings, polls, reposts, up/down votes, comments, threads, bookmarks, fact-checking.
- **Groups**: Ward, county, location, community, interest, or page-based groups with Posts, Members, and About tabs. NO marketplace inside groups.
- **Stories**: Photo/text stories (24hr expiry) with music tracks and synced lyrics.
- **Marketplace** (separate section): Buy/sell products, services, digital goods, property. Favorites and reviews.
- **Wallet**: Deposit, withdraw, transaction history, balance for marketplace.
- **Pages**: Business/organization pages with events (RSVPs), polls, reviews.
- **Messages**: Direct messaging and private conversations.
- **Identity & Verification**: KYC with ID + selfie, anonymous accounts, 2FA, recovery codes.
- **Connections**: Follow/unfollow, follower/following lists.
- **App Deployment**: Native mobile apps via Capacitor for Play Store & App Store. Export to GitHub → clone → \`npm install\` → \`npx cap add ios/android\` → \`npm run build\` → \`npx cap sync\` → \`npx cap run ios/android\`.
- **Custom Domain**: Project Settings → Domains → Connect Domain. A record → 185.158.133.1, TXT verification record.
- **Server**: Settings → Cloud → Advanced settings to upgrade instance size.

## Rules
1. NEVER mention Conect features that don't exist (e.g., no marketplace inside groups).
2. For fact-checking, analyze carefully and state confidence honestly.
3. If unsure about a Conect feature, say you're not certain rather than guessing.
4. For general knowledge questions, give your best, most informed answer — you are a general-purpose AI, not just a platform assistant.
5. Format responses with markdown for readability.
6. When discussing controversial topics, present multiple perspectives fairly while being honest about what evidence supports.`;

const SYSTEM_VERIFY = `You are a fact-checking AI for the Conect social platform. Your role is to analyze claims, posts, statements, and URLs for accuracy.

You MUST respond using the "verify_claim" tool. Analyze the claim and provide:
- verdict: "verified" (factually accurate), "misleading" (partially true/missing context), "false" (factually incorrect), or "unverified" (cannot determine)
- confidence: a number 0-100 representing your confidence
- summary: a 1-2 sentence plain explanation of your verdict
- details: a longer markdown explanation with reasoning, context, and what users should know
- sources_note: a brief note about what knowledge you're drawing from

If URLs are provided in the analysis context, evaluate whether the link destination matches what the post claims. Look for:
- Misleading link text (e.g., "Official government site" linking to a scam)
- Shortened URLs hiding suspicious destinations
- Phishing patterns or domains mimicking legitimate sites
- Whether the link content supports the claims being made

Be honest about limitations. If you cannot verify something, say "unverified" rather than guessing. For claims about very recent events, note that your knowledge may not be up to date.`;

// URL extraction helper
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
  return text.match(urlRegex) || [];
}

// Quick link safety check
const TRUSTED_DOMAINS = new Set([
  'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'x.com',
  'instagram.com', 'linkedin.com', 'github.com', 'wikipedia.org',
  'reddit.com', 'nation.africa', 'standardmedia.co.ke', 'the-star.co.ke',
  'safaricom.co.ke', 'mpesa.in', 'equity.co.ke', 'kcbgroup.com',
]);

const SUSPICIOUS_PATTERNS = [
  /bit\.ly/i, /tinyurl\.com/i, /t\.co/i, /goo\.gl/i,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /-login/i, /-verify/i, /-secure/i, /-account/i,
  /free-?money/i, /claim-?prize/i, /won-?lottery/i,
  /\.tk$/i, /\.ml$/i, /\.ga$/i, /\.cf$/i,
];

function getDomain(url: string): string {
  try {
    const parts = new URL(url).hostname.split('.');
    return parts.slice(-2).join('.');
  } catch { return ''; }
}

function quickLinkCheck(url: string): { safe: boolean; reason: string } {
  const domain = getDomain(url);
  if (TRUSTED_DOMAINS.has(domain)) return { safe: true, reason: 'Trusted domain' };
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url)) return { safe: false, reason: 'Suspicious URL pattern detected' };
  }
  return { safe: true, reason: 'Unknown domain' };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "chat", claim } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // VERIFY MODE: non-streaming, structured output via tool calling
    if (mode === "verify" && claim) {
      // Extract and analyze links in the claim
      const urls = extractUrls(claim);
      const linkAnalysis = urls.map(url => {
        const check = quickLinkCheck(url);
        return { url, domain: getDomain(url), ...check };
      });

      // Build context with link info
      let verifyPrompt = `Please fact-check this claim or post:\n\n"${claim}"`;
      if (linkAnalysis.length > 0) {
        verifyPrompt += `\n\n---\nLinks found in this post:\n`;
        for (const link of linkAnalysis) {
          verifyPrompt += `- ${link.url} (domain: ${link.domain}, initial check: ${link.safe ? 'appears safe' : link.reason})\n`;
        }
        verifyPrompt += `\nPlease analyze whether these links match what the post claims and if they appear trustworthy.`;
      }

      const verifyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_VERIFY },
            { role: "user", content: verifyPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "verify_claim",
                description: "Return the fact-check result for a claim",
                parameters: {
                  type: "object",
                  properties: {
                    verdict: {
                      type: "string",
                      enum: ["verified", "misleading", "false", "unverified"],
                      description: "The fact-check verdict",
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence level 0-100",
                    },
                    summary: {
                      type: "string",
                      description: "1-2 sentence summary of the verdict",
                    },
                    details: {
                      type: "string",
                      description: "Detailed markdown explanation with reasoning",
                    },
                    sources_note: {
                      type: "string",
                      description: "Note about knowledge sources used",
                    },
                    link_warnings: {
                      type: "array",
                      items: { type: "string" },
                      description: "Any warnings about links in the content",
                    },
                  },
                  required: ["verdict", "confidence", "summary", "details", "sources_note"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "verify_claim" } },
        }),
      });

      if (!verifyResponse.ok) {
        if (verifyResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (verifyResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await verifyResponse.text();
        console.error("AI gateway error:", verifyResponse.status, t);
        return new Response(JSON.stringify({ error: "AI verification error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const verifyData = await verifyResponse.json();
      const toolCall = verifyData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall?.function?.arguments) {
        let result;
        try {
          result = typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
        } catch {
          result = {
            verdict: "unverified",
            confidence: 0,
            summary: "Could not parse verification result.",
            details: "An error occurred during verification. Please try again.",
            sources_note: "N/A",
          };
        }
        return new Response(JSON.stringify({ mode: "verify", result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        mode: "verify",
        result: {
          verdict: "unverified",
          confidence: 0,
          summary: "Could not verify this claim.",
          details: "The AI could not produce a structured verification. Try rephrasing the claim.",
          sources_note: "N/A",
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CHAT MODE: streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_CHAT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
