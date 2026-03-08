import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, X, ChevronUp, ChevronDown, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import WaveformDisplay from "./WaveformDisplay";

interface MiniMusicPlayerProps {
  track: { title: string; artist: string; audio_url: string; duration_seconds?: number; cover_url?: string | null };
  startTime: number;
  onStartTimeChange: (time: number) => void;
  onRemoveTrack: () => void;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const MiniMusicPlayer = ({ track, startTime, onStartTimeChange, onRemoveTrack }: MiniMusicPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [playbackPos, setPlaybackPos] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [actualDuration, setActualDuration] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const rawDuration = actualDuration ?? (track.duration_seconds && track.duration_seconds > 0 ? track.duration_seconds : 30);
  const effectiveDuration = Math.max(rawDuration, 10);
  const maxStart = Math.max(0, effectiveDuration - 5);

  // Detect actual duration
  useEffect(() => {
    const audio = new Audio(track.audio_url);
    let cancelled = false;
    const onLoaded = () => {
      if (cancelled) return;
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setActualDuration(audio.duration);
      }
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("durationchange", onLoaded);
    audio.preload = "metadata";
    audio.load();
    return () => {
      cancelled = true;
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("durationchange", onLoaded);
      audio.src = "";
    };
  }, [track.audio_url]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const startTracking = useCallback((audio: HTMLAudioElement) => {
    const tick = () => {
      if (audio.paused || audio.ended) { setPlaybackPos(null); return; }
      setPlaybackPos(audio.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const togglePlay = () => {
    if (playing) {
      audioRef.current?.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setPlaying(false);
      setPlaybackPos(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(track.audio_url);
    audio.currentTime = startTime;
    audio.volume = 0.5;
    audio.play().catch(() => {});
    audio.onended = () => { setPlaying(false); setPlaybackPos(null); };
    audioRef.current = audio;
    setPlaying(true);
    startTracking(audio);
  };

  const handleSeek = (t: number) => {
    const clamped = Math.min(t, maxStart);
    onStartTimeChange(clamped);
    if (audioRef.current) audioRef.current.currentTime = clamped;
  };

  return (
    <div className="sticky bottom-0 z-10 -mx-3 -mb-3 animate-fade-in">
      <div className="bg-card/95 backdrop-blur-md border-t border-border/50 rounded-b-xl shadow-lg">
        {/* Compact bar */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full shrink-0 bg-primary/10 hover:bg-primary/20"
            onClick={togglePlay}
          >
            {playing ? (
              <Pause className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Play className="h-3.5 w-3.5 text-primary ml-0.5" />
            )}
          </Button>

          {/* Track info + mini waveform */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Music className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[11px] font-display font-medium text-foreground truncate">
                {track.title}
              </span>
              <span className="text-[10px] text-muted-foreground truncate shrink-0">
                – {track.artist}
              </span>
            </div>
            <WaveformDisplay
              audioUrl={track.audio_url}
              duration={effectiveDuration}
              startTime={startTime}
              playbackPosition={playbackPos}
              onSeek={handleSeek}
              className="h-6 w-full rounded"
            />
          </div>

          {/* Time badge */}
          <span className="text-[9px] font-display text-muted-foreground whitespace-nowrap shrink-0">
            {formatTime(startTime)}
          </span>

          {/* Expand / collapse */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full shrink-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>

          {/* Remove track */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => { audioRef.current?.pause(); onRemoveTrack(); }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Expanded: fine-tuning controls */}
        {expanded && (
          <div className="px-3 pb-2.5 pt-0.5 space-y-1.5 animate-fade-in border-t border-border/30">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-display text-muted-foreground uppercase tracking-wider">Start point</p>
              <span className="text-[9px] font-display text-muted-foreground">
                {formatTime(startTime)} / {formatTime(effectiveDuration)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[11px] font-display shrink-0"
                onClick={() => handleSeek(Math.max(0, startTime - 5))}
              >
                − 5s
              </Button>
              <span className="text-xs font-display font-semibold text-foreground min-w-[40px] text-center shrink-0">
                {formatTime(startTime)}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[11px] font-display shrink-0"
                onClick={() => handleSeek(Math.min(maxStart, startTime + 5))}
              >
                + 5s
              </Button>
            </div>
            <p className="text-[8px] text-muted-foreground/50 text-center font-display">
              Tap waveform or use buttons to set start point
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniMusicPlayer;
