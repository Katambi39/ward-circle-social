const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Parse LRC format lyrics into {time, text} array
function parseLrc(lrc: string): { time: number; text: string }[] {
  const lines = lrc.split('\n');
  const result: { time: number; text: string }[] = [];
  for (const line of lines) {
    const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/);
    if (match) {
      const mins = parseInt(match[1]);
      const secs = parseInt(match[2]);
      const ms = parseInt(match[3].padEnd(3, '0'));
      const time = mins * 60 + secs + ms / 1000;
      const text = match[4].trim();
      if (text) result.push({ time, text });
    }
  }
  return result;
}

async function fetchLyrics(title: string, artist: string, durationSecs: number): Promise<{ time: number; text: string }[] | null> {
  try {
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
      ...(durationSecs > 0 ? { duration: String(durationSecs) } : {}),
    });
    const res = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { 'User-Agent': 'ConectApp/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Prefer synced lyrics
    if (data.syncedLyrics) {
      const parsed = parseLrc(data.syncedLyrics);
      if (parsed.length > 0) return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

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

    const rawTracks = (data.data || []).map((t: any) => ({
      id: `deezer_${t.id}`,
      title: t.title_short || t.title,
      artist: t.artist?.name || 'Unknown',
      preview_url: t.preview,
      cover_url: t.album?.cover_medium || t.album?.cover_small || null,
      duration_seconds: t.duration || 30,
    }));

    // Fetch lyrics for all tracks in parallel (best effort)
    const tracks = await Promise.all(
      rawTracks.map(async (t: any) => {
        const lyrics = await fetchLyrics(t.title, t.artist, t.duration_seconds);
        return { ...t, lyrics: lyrics || [] };
      })
    );

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
