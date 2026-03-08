import { useState, useEffect, useRef } from "react";
import { Music, Play, Pause, Check, X, Search, Globe, Library, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number;
  lyrics: { time: number; text: string }[];
}

interface WebTrack {
  id: string;
  title: string;
  artist: string;
  preview_url: string;
  cover_url: string | null;
  duration_seconds: number;
}

interface MusicPickerProps {
  selectedTrack: MusicTrack | null;
  onSelect: (track: MusicTrack | null) => void;
}

const GENRE_LABELS: Record<string, string> = {
  afrobeat: "🥁 Afrobeat",
  afropop: "🎵 Afropop",
  bongo: "🌊 Bongo",
  gospel: "🙏 Gospel",
  chill: "🌙 Chill",
  gengetone: "🔥 Gengetone",
};

const MusicPicker = ({ selectedTrack, onSelect }: MusicPickerProps) => {
  const [tab, setTab] = useState<"library" | "web">("library");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web search state
  const [webQuery, setWebQuery] = useState("");
  const [webResults, setWebResults] = useState<WebTrack[]>([]);
  const [webSearching, setWebSearching] = useState(false);
  const [webSearched, setWebSearched] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("music_tracks")
      .select("*")
      .order("title")
      .then(({ data }) => {
        setTracks((data as any as MusicTrack[]) || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePreview = (url: string, id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(id);
  };

  const handleWebSearch = async () => {
    if (!webQuery.trim()) return;
    setWebSearching(true);
    setWebSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("music-search", {
        body: { query: webQuery.trim() },
      });
      if (error) throw error;
      setWebResults(data?.tracks || []);
    } catch (err) {
      console.error("Web music search failed:", err);
      setWebResults([]);
    } finally {
      setWebSearching(false);
    }
  };

  const selectWebTrack = (wt: WebTrack) => {
    const asTrack: MusicTrack = {
      id: wt.id,
      title: wt.title,
      artist: wt.artist,
      genre: "web",
      audio_url: wt.preview_url,
      cover_url: wt.cover_url,
      duration_seconds: wt.duration_seconds,
      lyrics: [],
    };
    onSelect(selectedTrack?.id === wt.id ? null : asTrack);
  };

  const saveToLibrary = async (wt: WebTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedIds.has(wt.id) || savingId === wt.id) return;
    setSavingId(wt.id);
    const { error } = await supabase.from("music_tracks").insert({
      title: wt.title,
      artist: wt.artist,
      audio_url: wt.preview_url,
      cover_url: wt.cover_url,
      duration_seconds: wt.duration_seconds,
      genre: "saved",
    });
    setSavingId(null);
    if (error) {
      toast.error("Failed to save track");
      return;
    }
    setSavedIds((prev) => new Set(prev).add(wt.id));
    // Refresh library
    const { data } = await supabase.from("music_tracks").select("*").order("title");
    setTracks((data as any as MusicTrack[]) || []);
    toast.success(`"${wt.title}" saved to library!`);
  };

  const genres = [...new Set(tracks.map((t) => t.genre))];

  const filtered = tracks.filter((t) => {
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase());
    const matchGenre = !activeGenre || t.genre === activeGenre;
    return matchSearch && matchGenre;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Music className="h-4 w-4 text-primary" />
        <span className="text-sm font-display font-semibold">Add Music</span>
        {selectedTrack && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2 text-xs rounded-full"
            onClick={() => {
              audioRef.current?.pause();
              setPlayingId(null);
              onSelect(null);
            }}
          >
            <X className="h-3 w-3 mr-1" /> Remove
          </Button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
        <button
          onClick={() => setTab("library")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-display transition-colors",
            tab === "library"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Library className="h-3.5 w-3.5" />
          Library
        </button>
        <button
          onClick={() => setTab("web")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-display transition-colors",
            tab === "web"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          Search Web
        </button>
      </div>

      {tab === "library" && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tracks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs rounded-full"
            />
          </div>

          {/* Genre chips */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveGenre(null)}
              className={cn(
                "text-[10px] font-display px-2.5 py-1 rounded-full whitespace-nowrap transition-colors",
                !activeGenre
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              All
            </button>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGenre(activeGenre === g ? null : g)}
                className={cn(
                  "text-[10px] font-display px-2.5 py-1 rounded-full whitespace-nowrap transition-colors",
                  activeGenre === g
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {GENRE_LABELS[g] || g}
              </button>
            ))}
          </div>

          {/* Track list */}
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Loading tracks...</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No tracks found</p>
            ) : (
              filtered.map((track) => {
                const isSelected = selectedTrack?.id === track.id;
                const isPlaying = playingId === track.id;
                return (
                  <div
                    key={track.id}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg transition-colors cursor-pointer",
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/60"
                    )}
                    onClick={() => onSelect(isSelected ? null : track)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePreview(track.audio_url, track.id);
                      }}
                      className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 hover:bg-primary/20 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Play className="h-3.5 w-3.5 text-primary ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-display font-medium truncate">{track.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-display">
                      {GENRE_LABELS[track.genre] || track.genre}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {tab === "web" && (
        <>
          {/* Web search input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleWebSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search any song..."
                value={webQuery}
                onChange={(e) => setWebQuery(e.target.value)}
                className="pl-8 h-8 text-xs rounded-full"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={webSearching || !webQuery.trim()}
              className="rounded-full h-8 px-3 text-xs font-display"
            >
              {webSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
            </Button>
          </form>

          {/* Web results */}
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {webSearching ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-display">Searching...</span>
              </div>
            ) : webResults.length === 0 && webSearched ? (
              <p className="text-xs text-muted-foreground text-center py-4">No results found. Try a different search.</p>
            ) : !webSearched ? (
              <div className="text-center py-6">
                <Globe className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-display">Search for any song, artist, or album</p>
              </div>
            ) : (
              webResults.map((wt) => {
                const isSelected = selectedTrack?.id === wt.id;
                const isPlaying = playingId === wt.id;
                return (
                  <div
                    key={wt.id}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg transition-colors cursor-pointer",
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/60"
                    )}
                    onClick={() => selectWebTrack(wt)}
                  >
                    {/* Cover + play button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (wt.preview_url) togglePreview(wt.preview_url, wt.id);
                      }}
                      className="h-10 w-10 rounded-lg overflow-hidden shrink-0 relative group"
                    >
                      {wt.cover_url ? (
                        <img src={wt.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          <Music className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPlaying ? (
                          <Pause className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="h-4 w-4 text-white ml-0.5" />
                        )}
                      </div>
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-display font-medium truncate">{wt.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{wt.artist}</p>
                    </div>

                    {!wt.preview_url && (
                      <span className="text-[9px] text-muted-foreground/60 font-display">No preview</span>
                    )}

                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          <p className="text-[9px] text-muted-foreground/50 text-center font-display">
            30-second previews powered by Deezer
          </p>
        </>
      )}

      {/* Lyrics preview */}
      {selectedTrack && selectedTrack.lyrics && (selectedTrack.lyrics as any[]).length > 0 && (
        <div className="bg-muted/50 rounded-lg p-2.5">
          <p className="text-[10px] font-display font-semibold text-muted-foreground mb-1">🎤 Lyrics Preview</p>
          <p className="text-[10px] text-muted-foreground italic line-clamp-2">
            {(selectedTrack.lyrics as any[]).slice(0, 3).map((l: any) => l.text).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
};

export default MusicPicker;
