import { useState, useEffect, useRef } from "react";
import { Music, Play, Pause, Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const togglePreview = (track: MusicTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(track.audio_url);
    audio.volume = 0.5;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(track.id);
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
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
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
                {/* Play preview */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePreview(track);
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
