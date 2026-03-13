import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Send, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceNoteRecorderProps {
  conversationId: string;
  senderId: string;
  onSent: () => void;
}

const MAX_DURATION = 300; // 5 minutes

const VoiceNoteRecorder = ({ conversationId, senderId, onSent }: VoiceNoteRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [levels, setLevels] = useState<number[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Audio visualization
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateLevels = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setLevels(prev => [...prev.slice(-40), avg / 255]);
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
      setLevels([]);

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= MAX_DURATION - 1) {
            mediaRecorder.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const cancelRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    setIsRecording(false);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setLevels([]);
  };

  const sendVoiceNote = async () => {
    if (!audioBlob) return;
    setSending(true);
    try {
      const path = `${senderId}/${conversationId}/${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage.from("voice-notes").upload(path, audioBlob);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("voice-notes").getPublicUrl(path);

      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: `🎤 Voice note (${formatTime(duration)})`,
        media_url: urlData.publicUrl,
      } as any);
      if (error) throw error;

      await supabase.from("conversations").update({ last_message_at: new Date().toISOString() } as any).eq("id", conversationId);
      cancelRecording();
      onSent();
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Not recording and no blob = show mic button
  if (!isRecording && !audioBlob) {
    return (
      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full shrink-0 text-muted-foreground hover:text-primary" onClick={startRecording}>
        <Mic className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-1 bg-muted/50 rounded-xl px-3 py-2">
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" onClick={cancelRecording}>
        <Trash2 className="h-4 w-4" />
      </Button>

      {isRecording ? (
        <>
          <div className="flex items-end gap-[2px] flex-1 h-8">
            {levels.slice(-30).map((l, i) => (
              <div key={i} className="w-1 rounded-full bg-destructive transition-all" style={{ height: `${Math.max(4, l * 32)}px` }} />
            ))}
          </div>
          <span className="text-xs font-mono text-destructive font-bold animate-pulse">{formatTime(duration)}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-foreground" onClick={stopRecording}>
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </>
      ) : (
        <>
          <audio src={audioUrl!} controls className="flex-1 h-8" style={{ maxHeight: 32 }} />
          <span className="text-xs text-muted-foreground font-mono">{formatTime(duration)}</span>
          <Button size="icon" className="h-8 w-8 rounded-full gradient-kenya text-primary-foreground" onClick={sendVoiceNote} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </>
      )}
    </div>
  );
};

export default VoiceNoteRecorder;
