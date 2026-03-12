import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_CHAT = `You are Conect AI, a helpful assistant built into the Conect social platform — a Kenyan community social network.

You help users with understanding the following Conect features:

**Feed & Posts:** Create posts, share photos/videos, use anonymous mode, add feelings, create polls, repost content, vote on posts (up/down), comment and reply to threads, bookmark posts, and fact-check content.

**Groups:** Join ward, county, location, community, interest, or page-based groups. Groups have Posts, Members, and About tabs. Group admins and moderators manage membership. There is NO marketplace inside groups — the marketplace is a separate section.

**Stories:** Share photo or text stories that expire after 24 hours. Add music tracks with synced lyrics to stories, adjust start times and sync timing.

**Marketplace:** Buy and sell items (products, services, digital goods, property). Listings can be favorited and reviewed by buyers. The marketplace is separate from groups and pages.

**Wallet:** Deposit and withdraw funds, view transaction history (purchases, sales, refunds), check balance. Used for marketplace transactions.

**Pages:** Create and follow business/organization pages. Pages can host events with RSVPs, run polls, and receive reviews.

**Messages:** Send direct messages to other users, have private conversations.

**Identity & Verification:** Complete KYC verification with ID and selfie for verified status. Use anonymous accounts when privacy is needed. Set up 2FA and recovery codes for security.

**Connections:** Follow/unfollow users, view follower/following lists.

**App Setup & Deployment:**
Users can run Conect as a native mobile app on Android (Google Play Store) and iOS (Apple App Store) using Capacitor. Here's the setup process:

1. **Export to GitHub**: Go to Project Settings → GitHub → Connect project, then create/link a repository.
2. **Clone and install locally**:
   - \`git clone <YOUR_REPO_URL>\`
   - \`cd <PROJECT_NAME>\`
   - \`npm install\`
3. **Add mobile platforms**:
   - For iOS (requires a Mac with Xcode): \`npx cap add ios\`
   - For Android (requires Android Studio): \`npx cap add android\`
4. **Build and sync**:
   - \`npm run build\`
   - \`npx cap sync\`
5. **Run on device or emulator**:
   - iOS: \`npx cap run ios\`
   - Android: \`npx cap run android\`
6. After any code changes, always run \`npm run build && npx cap sync\` before running again.

**Custom Domain**: To connect your own domain (e.g., conect.co.ke), go to Project Settings → Domains → Connect Domain. You'll need to add DNS records (A record pointing to 185.158.133.1 and a TXT verification record) at your domain registrar. SSL is provisioned automatically. Both root domain and www subdomain should be added.

**Server & Performance**: To upgrade server resources for better performance, go to Settings → Cloud → Advanced settings and increase the instance size. Changes take up to 10 minutes to apply.

You also help with general questions about Kenya, local communities, and civic topics. Be friendly, concise, and culturally aware. When relevant, use Swahili greetings or phrases naturally. Format responses with markdown where helpful.

IMPORTANT RULES:
1. NEVER mention features that don't exist (like a marketplace inside groups).
2. When users ask you to verify claims, you MUST analyze carefully and state your confidence honestly — never fabricate verification.
3. If unsure about a feature's existence, say you're not certain rather than guessing.`;

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
        model: "google/gemini-3-flash-preview",
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
