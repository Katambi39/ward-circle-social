import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

interface VoiceNotePlayerProps {
  url: string;
  duration?: string;
  isMe: boolean;
}

const VoiceNotePlayer = ({ url, duration, isMe }: VoiceNotePlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className={`flex items-center gap-2 min-w-[180px] rounded-xl px-3 py-2 ${isMe ? "bg-white/15" : "bg-muted"}`}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          setCurrentTime(audioRef.current.currentTime);
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setTotalDuration(audioRef.current.duration);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
      />
      <button onClick={toggle} className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary"}`}>
        {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className={`h-1 rounded-full overflow-hidden ${isMe ? "bg-white/20" : "bg-border"}`}>
          <div className={`h-full rounded-full transition-all ${isMe ? "bg-primary-foreground" : "bg-primary"}`} style={{ width: `${progress}%` }} />
        </div>
        <span className={`text-[10px] font-mono ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {playing || currentTime > 0 ? formatTime(currentTime) : (duration || formatTime(totalDuration))}
        </span>
      </div>
    </div>
  );
};

export default VoiceNotePlayer;
