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
    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setActualDuration(audio.duration);
        // Clamp startTime if it exceeds actual duration
        if (startTime > Math.max(0, audio.duration - 5)) {
          onStartTimeChange(0);
        }
      }
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    // Also try canplaythrough for reliability
    audio.addEventListener("canplaythrough", onLoaded);
    audio.preload = "metadata";
    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("canplaythrough", onLoaded);
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
  const effectiveDuration = actualDuration ?? durationSeconds;
  const maxStart = Math.max(0, effectiveDuration - 5);

  // Don't show if audio is too short to adjust
  if (effectiveDuration <= 6) {
    return null;
  }

  return (
    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
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
          className="flex-1"
        />
      </div>
      <p className="text-[9px] text-muted-foreground/60 text-center font-display">
        Drag to choose where the music starts playing
      </p>
    </div>
  );
};

export default MusicStartTimePicker;
