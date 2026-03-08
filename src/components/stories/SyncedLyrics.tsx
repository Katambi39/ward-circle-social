import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LyricLine {
  time: number;
  text: string;
}

interface SyncedLyricsProps {
  lyrics: LyricLine[];
  currentTime: number;
  isPlaying: boolean;
}

const SyncedLyrics = ({ lyrics, currentTime, isPlaying }: SyncedLyricsProps) => {
  if (!lyrics || lyrics.length === 0 || !isPlaying) return null;

  // Find the current lyric line based on time
  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
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
          {lyrics.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-4 bg-white"
                  : i < activeIndex
                  ? "w-1.5 bg-white/40"
                  : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SyncedLyrics;
