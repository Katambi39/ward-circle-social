import { motion, AnimatePresence } from "framer-motion";

interface LyricLine {
  time: number;
  text: string;
}

interface SyncedLyricsProps {
  lyrics: LyricLine[];
  currentTime: number;
  isPlaying: boolean;
  /** Offset in seconds added to currentTime to align with lyrics timestamps (e.g., Deezer previews start ~30s into the song) */
  timeOffset?: number;
}

const SyncedLyrics = ({ lyrics, currentTime, isPlaying, timeOffset = 0 }: SyncedLyricsProps) => {
  if (!lyrics || lyrics.length === 0 || !isPlaying) return null;

  // Apply offset: the audio currentTime is relative to the preview,
  // but lyrics timestamps are relative to the full song
  const adjustedTime = currentTime + timeOffset;

  // Find the current lyric line based on adjusted time
  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (adjustedTime >= lyrics[i].time) {
      activeIndex = i;
      break;
    }
  }

  if (activeIndex === -1) return null;

  const activeLine = lyrics[activeIndex];
  const nextLine = lyrics[activeIndex + 1];

  return (
    <div className="absolute bottom-16 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="bg-black/40 backdrop-blur-md rounded-2xl px-5 py-4 max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-center space-y-1.5"
          >
            <p className="text-white text-sm font-display font-bold leading-snug">
              {activeLine.text}
            </p>
            {nextLine && (
              <p className="text-white/40 text-xs font-display leading-snug">
                {nextLine.text}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-3">
          {lyrics.slice(
            Math.max(0, activeIndex - 5),
            Math.min(lyrics.length, activeIndex + 6)
          ).map((_, i) => {
            const realIndex = Math.max(0, activeIndex - 5) + i;
            return (
              <div
                key={realIndex}
                className={`h-1 rounded-full transition-all duration-300 ${
                  realIndex === activeIndex
                    ? "w-4 bg-white"
                    : realIndex < activeIndex
                    ? "w-1.5 bg-white/40"
                    : "w-1.5 bg-white/20"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SyncedLyrics;
