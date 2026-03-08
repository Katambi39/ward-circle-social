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
    if (data.syncedLyrics) {
      const parsed = parseLrc(data.syncedLyrics);
      if (parsed.length > 0) return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

interface RawTrack {
  id: string;
  title: string;
  artist: string;
  preview_url: string | null;
  cover_url: string | null;
  duration_seconds: number;
  source: 'deezer' | 'itunes';
}

async function searchDeezer(query: string): Promise<RawTrack[]> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const response = await fetch(`https://api.deezer.com/search?q=${encoded}&limit=15`);
    if (!response.ok) {
      await response.text(); // consume body
      return [];
    }
    const data = await response.json();
    return (data.data || []).map((t: any) => ({
      id: `deezer_${t.id}`,
      title: t.title_short || t.title,
      artist: t.artist?.name || 'Unknown',
      preview_url: t.preview || null,
      cover_url: t.album?.cover_medium || t.album?.cover_small || null,
      duration_seconds: t.duration || 30,
      source: 'deezer' as const,
    }));
  } catch (err) {
    console.error('Deezer search error:', err);
    return [];
  }
}

async function searchItunes(query: string): Promise<RawTrack[]> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const response = await fetch(`https://itunes.apple.com/search?term=${encoded}&media=music&entity=song&limit=15`);
    if (!response.ok) {
      await response.text();
      return [];
    }
    const data = await response.json();
    return (data.results || []).map((t: any) => ({
      id: `itunes_${t.trackId}`,
      title: t.trackName || 'Unknown',
      artist: t.artistName || 'Unknown',
      preview_url: t.previewUrl || null,
      cover_url: t.artworkUrl100?.replace('100x100', '300x300') || t.artworkUrl60 || null,
      duration_seconds: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : 30,
      source: 'itunes' as const,
    }));
  } catch (err) {
    console.error('iTunes search error:', err);
    return [];
  }
}

// Deduplicate by title+artist (case-insensitive), preferring tracks with previews
function deduplicateTracks(tracks: RawTrack[]): RawTrack[] {
  const seen = new Map<string, RawTrack>();
  for (const t of tracks) {
    const key = `${t.title.toLowerCase()}::${t.artist.toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, t);
    } else if (!existing.preview_url && t.preview_url) {
      // Prefer the one with a preview
      seen.set(key, t);
    }
  }
  return Array.from(seen.values());
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

    // Search both APIs in parallel
    const [deezerResults, itunesResults] = await Promise.all([
      searchDeezer(query),
      searchItunes(query),
    ]);

    // Merge: Deezer first, then iTunes-only tracks
    const merged = deduplicateTracks([...deezerResults, ...itunesResults]);

    // Filter to only tracks with previews, then add lyrics
    const withPreviews = merged.filter(t => t.preview_url);

    // Fetch lyrics in parallel (best effort)
    const tracks = await Promise.all(
      withPreviews.map(async (t) => {
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
