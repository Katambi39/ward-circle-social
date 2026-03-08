const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Well-known trusted domains
const TRUSTED_DOMAINS = new Set([
  'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'x.com',
  'instagram.com', 'linkedin.com', 'github.com', 'wikipedia.org',
  'reddit.com', 'stackoverflow.com', 'medium.com', 'bbc.com', 'cnn.com',
  'nation.africa', 'standardmedia.co.ke', 'the-star.co.ke', 'capitalfm.co.ke',
  'citizen.digital', 'kbc.co.ke', 'pd.co.ke',
  'safaricom.co.ke', 'mpesa.in', 'equity.co.ke', 'kcbgroup.com',
  'amazon.com', 'apple.com', 'microsoft.com', 'netflix.com', 'spotify.com',
  'whatsapp.com', 'tiktok.com', 'telegram.org', 'signal.org',
]);

// Known explicit/adult content domains (blocked entirely)
const EXPLICIT_DOMAINS = new Set([
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'redtube.com',
  'youporn.com', 'tube8.com', 'spankbang.com', 'eporner.com', 'hqporner.com',
  'txxx.com', 'porn.com', 'brazzers.com', 'bangbros.com', 'naughtyamerica.com',
  'realitykings.com', 'mofos.com', 'fakehub.com', 'onlyfans.com', 'fansly.com',
  'stripchat.com', 'chaturbate.com', 'livejasmin.com', 'bongacams.com',
  'cam4.com', 'camsoda.com', 'myfreecams.com', 'flirt4free.com',
  'rule34.xxx', 'e-hentai.org', 'nhentai.net', 'hanime.tv',
  'motherless.com', 'literotica.com', 'imagefap.com',
]);

// Explicit content URL patterns
const EXPLICIT_PATTERNS = [
  /\bporn\b/i, /\bxxx\b/i, /\bhentai\b/i, /\bnude[s]?\b/i,
  /\bnsfw\b/i, /\badult[\-_]?(content|video|film)/i,
  /\bsex[\-_]?(video|tape|cam)/i, /\bescort[s]?\b/i,
  /\berotic[a]?\b/i, /\bfetish\b/i, /\bcamgirl/i, /\blivecam/i,
  /\bonlyfan/i, /\bfansly/i,
];

// Known suspicious patterns
const SUSPICIOUS_PATTERNS = [
  /bit\.ly/i, /tinyurl\.com/i, /t\.co/i, /goo\.gl/i, /ow\.ly/i,
  /is\.gd/i, /buff\.ly/i, /adf\.ly/i, /shorte\.st/i,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
  /-login/i, /-verify/i, /-secure/i, /-account/i,
  /free-?money/i, /claim-?prize/i, /won-?lottery/i,
  /\.tk$/i, /\.ml$/i, /\.ga$/i, /\.cf$/i, // Free TLDs often used for phishing
];

function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.hostname.split('.');
    // Get root domain (e.g., "sub.example.com" -> "example.com")
    return parts.slice(-2).join('.');
  } catch {
    return '';
  }
}

function quickCheck(url: string): { level: 'safe' | 'warning' | 'danger'; reason: string; blocked?: boolean } | null {
  const domain = getDomain(url);
  
  // Block explicit/adult content
  if (EXPLICIT_DOMAINS.has(domain)) {
    return { level: 'danger', reason: 'Explicit/adult content is not allowed on this platform', blocked: true };
  }
  
  for (const pattern of EXPLICIT_PATTERNS) {
    if (pattern.test(url) || pattern.test(domain)) {
      return { level: 'danger', reason: 'Link appears to contain explicit/adult content', blocked: true };
    }
  }
  
  if (TRUSTED_DOMAINS.has(domain)) {
    return { level: 'safe', reason: 'Well-known trusted website' };
  }
  
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url)) {
      return { level: 'warning', reason: 'URL contains suspicious patterns' };
    }
  }
  
  return null; // Need AI analysis
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Quick pattern-based check first
    const quick = quickCheck(url);
    if (quick) {
      return new Response(
        JSON.stringify({ success: true, ...quick, domain: getDomain(url) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AI analysis for unknown domains
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      // Fallback: unknown domain without AI
      return new Response(
        JSON.stringify({ success: true, level: 'warning', reason: 'Unknown domain — proceed with caution', domain: getDomain(url) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a URL safety analyzer. Analyze the given URL and determine if it's safe, suspicious, or dangerous.
Consider: domain reputation, URL structure, potential phishing indicators, known scam patterns, URL shorteners, social engineering tricks, and explicit/adult/pornographic content.
URLs pointing to adult content, pornography, escort services, or explicit material should ALWAYS be marked as "danger".
You must respond using the provided tool.`
          },
          {
            role: 'user',
            content: `Analyze this URL for safety: ${url}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'report_safety',
            description: 'Report the safety analysis of a URL',
            parameters: {
              type: 'object',
              properties: {
                level: { type: 'string', enum: ['safe', 'warning', 'danger'], description: 'Safety level' },
                reason: { type: 'string', description: 'Brief explanation (max 80 chars)' }
              },
              required: ['level', 'reason'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'report_safety' } },
      }),
    });

    if (!aiResponse.ok) {
      // Fallback on AI failure
      return new Response(
        JSON.stringify({ success: true, level: 'warning', reason: 'Could not verify — proceed with caution', domain: getDomain(url) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ success: true, level: args.level, reason: args.reason, domain: getDomain(url) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, level: 'warning', reason: 'Unknown domain — proceed with caution', domain: getDomain(url) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Link check error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
