const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const encoded = encodeURIComponent(query.trim());
    const response = await fetch(`https://api.deezer.com/search?q=${encoded}&limit=20`);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Deezer API returned ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    const tracks = (data.data || []).map((t: any) => ({
      id: `deezer_${t.id}`,
      title: t.title_short || t.title,
      artist: t.artist?.name || 'Unknown',
      preview_url: t.preview, // 30s preview MP3
      cover_url: t.album?.cover_medium || t.album?.cover_small || null,
      duration_seconds: t.duration || 30,
    }));

    return new Response(
      JSON.stringify({ success: true, tracks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Music search error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
