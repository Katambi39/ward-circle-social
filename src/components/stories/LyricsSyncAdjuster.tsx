import { useState, useRef, useEffect } from "react";
import { Play, Pause, Minus, Plus, Wand2, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsSyncAdjusterProps {
  audioUrl: string;
  lyrics: LyricLine[];
  lyricsOffset: number;
  onOffsetChange: (offset: number) => void;
}

/**
 * Auto-detect the best lyrics offset for a ~30s preview clip.
 * Strategy: Deezer previews pick the most musically dense part of the song.
 * We slide a 30s window across the lyrics timeline and find the offset
 * that maximises the number of lyric lines within the window — that's
 * likely where the preview starts.
 */
export function autoDetectLyricsOffset(lyrics: LyricLine[], previewDuration = 30): number {
  if (!lyrics.length) return 0;

  const lastTime = lyrics[lyrics.length - 1].time;
  if (lastTime <= previewDuration) return 0;

  let bestOffset = 0;
  let bestCount = 0;

  // Scan in 1-second steps
  for (let offset = 0; offset <= lastTime - previewDuration; offset += 1) {
    const windowEnd = offset + previewDuration;
    let count = 0;
    for (const line of lyrics) {
      if (line.time >= offset && line.time < windowEnd) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestOffset = offset;
    }
  }

  return Math.round(bestOffset);
}

const LyricsSyncAdjuster = ({ audioUrl, lyrics, lyricsOffset, onOffsetChange }: LyricsSyncAdjusterProps) => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [detecting, setDetecting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  // Auto-detect on mount
  useEffect(() => {
    if (lyrics.length > 0 && lyricsOffset === 30) {
      const detected = autoDetectLyricsOffset(lyrics);
      onOffsetChange(detected);
    }
  }, []);

  const togglePlay = () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(audioUrl);
    audio.volume = 0.5;
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.onended = () => setPlaying(false);
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlaying(true);
  };

  const handleAutoDetect = () => {
    setDetecting(true);
    // Small delay for visual feedback
    setTimeout(() => {
      const detected = autoDetectLyricsOffset(lyrics);
      onOffsetChange(detected);
      setDetecting(false);
    }, 300);
  };

  // Find active lyric based on currentTime + offset
  const adjustedTime = currentTime + lyricsOffset;
  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (adjustedTime >= lyrics[i].time) {
      activeIndex = i;
      break;
    }
  }

  const activeLine = activeIndex >= 0 ? lyrics[activeIndex] : null;
  const nextLine = activeIndex >= 0 ? lyrics[activeIndex + 1] : lyrics[0];

  return (
    <div className="bg-muted/50 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">
          🎤 Lyrics Sync
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 gap-1 rounded-full px-2 text-[10px] font-display"
            onClick={handleAutoDetect}
            disabled={detecting}
          >
            {detecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            Auto
          </Button>
          <span className="text-[10px] font-display text-muted-foreground">
            {lyricsOffset >= 0 ? "+" : ""}{lyricsOffset.toFixed(0)}s
          </span>
        </div>
      </div>

      {/* Lyrics preview window */}
      <div className="bg-background/80 rounded-lg px-3 py-2.5 min-h-[48px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-center space-y-0.5"
          >
            {activeLine ? (
              <p className="text-xs font-display font-semibold text-foreground leading-snug">
                {activeLine.text}
              </p>
            ) : (
              <p className="text-xs font-display text-muted-foreground italic">
                {playing ? "Waiting for lyrics..." : "Play to preview lyrics"}
              </p>
            )}
            {nextLine && activeLine && (
              <p className="text-[10px] font-display text-muted-foreground/60 leading-snug">
                {nextLine.text}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full shrink-0"
          onClick={togglePlay}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full shrink-0"
          onClick={() => onOffsetChange(Math.max(-120, lyricsOffset - 5))}
        >
          <Minus className="h-3 w-3" />
        </Button>

        <Slider
          value={[lyricsOffset]}
          min={-60}
          max={120}
          step={1}
          onValueChange={([v]) => onOffsetChange(v)}
          className="flex-1"
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full shrink-0"
          onClick={() => onOffsetChange(Math.min(120, lyricsOffset + 5))}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <p className="text-[9px] text-muted-foreground/60 text-center font-display">
        Tap <strong>Auto</strong> to detect, or play and adjust manually
      </p>
    </div>
  );
};

export default LyricsSyncAdjuster;
