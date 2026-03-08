import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface MusicStartTimePickerProps {
  audioUrl: string;
  durationSeconds: number;
  startTime: number;
  onStartTimeChange: (time: number) => void;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const MusicStartTimePicker = ({ audioUrl, durationSeconds, startTime, onStartTimeChange }: MusicStartTimePickerProps) => {
  const [playing, setPlaying] = useState(false);
  const [actualDuration, setActualDuration] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Detect actual audio file duration (preview may be ~30s, not full track)
  useEffect(() => {
    const audio = new Audio(audioUrl);
    let cancelled = false;
    const onLoaded = () => {
      if (cancelled) return;
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setActualDuration(audio.duration);
      }
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("canplaythrough", onLoaded);
    // Also handle durationchange for streams that update duration progressively
    audio.addEventListener("durationchange", onLoaded);
    audio.preload = "metadata";
    audio.load();

    return () => {
      cancelled = true;
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("canplaythrough", onLoaded);
      audio.removeEventListener("durationchange", onLoaded);
      audio.src = "";
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const togglePreview = () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(audioUrl);
    audio.currentTime = startTime;
    audio.volume = 0.5;
    audio.play().catch(() => {});
    audio.onended = () => setPlaying(false);
    audioRef.current = audio;
    setPlaying(true);
  };

  // Use actual audio duration if detected, otherwise fall back to metadata
  // Default to 30s if duration is unknown/zero (common with web previews)
  const rawDuration = actualDuration ?? (durationSeconds > 0 ? durationSeconds : 30);
  // Ensure minimum usable duration so the picker always shows
  const effectiveDuration = Math.max(rawDuration, 10);
  const maxStart = Math.max(0, effectiveDuration - 5);

  const handleDecrement = () => {
    const newVal = Math.max(0, startTime - 5);
    onStartTimeChange(newVal);
    if (audioRef.current) audioRef.current.currentTime = newVal;
  };

  const handleIncrement = () => {
    const newVal = Math.min(maxStart, startTime + 5);
    onStartTimeChange(newVal);
    if (audioRef.current) audioRef.current.currentTime = newVal;
  };

  return (
    <div className="bg-muted/50 rounded-xl p-3 space-y-2 overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">
          Start point
        </p>
        <span className="text-[10px] font-display text-muted-foreground">
          {formatTime(startTime)} / {formatTime(effectiveDuration)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full shrink-0"
          onClick={togglePreview}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </Button>
        <Slider
          value={[startTime]}
          min={0}
          max={maxStart}
          step={1}
          onValueChange={([v]) => {
            onStartTimeChange(v);
            if (audioRef.current) {
              audioRef.current.currentTime = v;
            }
          }}
          className="flex-1 min-w-0"
        />
      </div>
      {/* +/- buttons for easier mobile control */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px] font-display shrink-0" onClick={handleDecrement}>
          − 5s
        </Button>
        <span className="text-xs font-display font-semibold text-foreground min-w-[40px] text-center shrink-0">
          {formatTime(startTime)}
        </span>
        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px] font-display shrink-0" onClick={handleIncrement}>
          + 5s
        </Button>
      </div>
      <p className="text-[9px] text-muted-foreground/60 text-center font-display">
        Use slider or buttons to choose where music starts
      </p>
    </div>
  );
};

export default MusicStartTimePicker;
