import { useEffect, useRef, useState } from "react";

interface WaveformDisplayProps {
  audioUrl: string;
  duration: number;
  startTime: number;
  playbackPosition?: number | null; // real-time position during preview
  onSeek: (time: number) => void;
  className?: string;
}

const BAR_COUNT = 80;
const BAR_GAP = 1.5;

const WaveformDisplay = ({ audioUrl, duration, startTime, onSeek, className }: WaveformDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [dragging, setDragging] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 300, h: 48 });

  // Decode audio and extract peaks
  useEffect(() => {
    let cancelled = false;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    fetch(audioUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        if (cancelled) return;
        const raw = decoded.getChannelData(0);
        const step = Math.floor(raw.length / BAR_COUNT);
        const result: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += Math.abs(raw[i * step + j]);
          }
          result.push(sum / step);
        }
        // Normalize
        const max = Math.max(...result, 0.01);
        setPeaks(result.map((v) => v / max));
      })
      .catch(() => {
        // Fallback: random-ish bars so UI still looks nice
        if (!cancelled) {
          setPeaks(Array.from({ length: BAR_COUNT }, (_, i) =>
            0.2 + 0.6 * Math.abs(Math.sin(i * 0.4))
          ));
        }
      })
      .finally(() => ctx.close().catch(() => {}));

    return () => { cancelled = true; };
  }, [audioUrl]);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setCanvasSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const { w, h } = canvasSize;
    ctx.clearRect(0, 0, w, h);

    const barW = (w - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT;
    const progress = duration > 0 ? startTime / duration : 0;

    for (let i = 0; i < peaks.length; i++) {
      const x = i * (barW + BAR_GAP);
      const barH = Math.max(2, peaks[i] * (h - 4));
      const y = (h - barH) / 2;
      const barProgress = i / peaks.length;

      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 1);

      if (barProgress <= progress) {
        // Played region — use primary color
        ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--waveform-active").trim() || "hsl(142 76% 36%)";
      } else {
        ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--waveform-inactive").trim() || "hsl(0 0% 50% / 0.3)";
      }
      ctx.fill();
    }

    // Draw playhead line
    const px = progress * w;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue("--waveform-active").trim() || "hsl(142 76% 36%)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [peaks, startTime, duration, canvasSize]);

  const handlePointer = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || duration <= 0) return;
    const clientX = "touches" in e ? (e as React.TouchEvent).touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(Math.round(ratio * duration));
  };

  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer touch-none select-none ${className ?? ""}`}
      style={{
        ["--waveform-active" as any]: "hsl(var(--primary))",
        ["--waveform-inactive" as any]: "hsl(var(--muted-foreground) / 0.25)",
      }}
      onPointerDown={(e) => { setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e); }}
      onPointerMove={(e) => { if (dragging) handlePointer(e); }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: canvasSize.w, height: canvasSize.h }}
      />
      {peaks.length === 0 && (
        <div className="absolute inset-0 flex items-center gap-[1.5px] px-1 overflow-hidden">
          {Array.from({ length: BAR_COUNT }, (_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-muted-foreground/15 animate-pulse"
              style={{
                height: `${20 + 50 * Math.abs(Math.sin(i * 0.45))}%`,
                animationDelay: `${i * 25}ms`,
              }}
            />
          ))}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.12) 50%, transparent 100%)",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default WaveformDisplay;
