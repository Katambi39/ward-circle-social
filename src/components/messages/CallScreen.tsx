import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface CallScreenProps {
  callId: string;
  conversationId: string;
  callType: "voice" | "video";
  isIncoming: boolean;
  callerId: string;
  calleeId: string;
  currentUserId: string;
  otherUser: { display_name: string; avatar_url: string | null; username: string };
  onEnd: () => void;
}

const CallScreen = ({
  callId, conversationId, callType, isIncoming,
  callerId, calleeId, currentUserId, otherUser, onEnd,
}: CallScreenProps) => {
  const [status, setStatus] = useState<"ringing" | "connecting" | "connected" | "ended">(
    isIncoming ? "ringing" : "connecting"
  );
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const endCall = useCallback(async (newStatus = "ended") => {
    setStatus("ended");
    cleanup();
    await supabase.from("call_signals").update({
      status: newStatus,
      ended_at: new Date().toISOString(),
    } as any).eq("id", callId);
    setTimeout(onEnd, 1000);
  }, [callId, cleanup, onEnd]);

  const setupPeerConnection = useCallback(async () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    pcRef.current = pc;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      localStreamRef.current = stream;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream;
      }
    } catch {
      await endCall("ended");
      return;
    }

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        const { data: current } = await supabase.from("call_signals").select("signal_data").eq("id", callId).single();
        const signalData = (current?.signal_data as any) || {};
        const candidates = signalData.candidates || [];
        candidates.push(e.candidate.toJSON());
        await supabase.from("call_signals").update({
          signal_data: { ...signalData, candidates },
        } as any).eq("id", callId);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setStatus("connected");
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      }
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        endCall("ended");
      }
    };

    return pc;
  }, [callId, callType, endCall]);

  // Caller: create offer
  const createOffer = useCallback(async () => {
    const pc = await setupPeerConnection();
    if (!pc) return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await supabase.from("call_signals").update({
      signal_data: { offer: offer },
    } as any).eq("id", callId);
  }, [callId, setupPeerConnection]);

  // Callee: answer
  const answerCall = useCallback(async () => {
    setStatus("connecting");
    const pc = await setupPeerConnection();
    if (!pc) return;

    // Get the offer
    const { data } = await supabase.from("call_signals").select("signal_data").eq("id", callId).single();
    const signalData = data?.signal_data as any;
    if (signalData?.offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(signalData.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await supabase.from("call_signals").update({
        status: "answered",
        signal_data: { ...signalData, answer },
      } as any).eq("id", callId);
    }

    // Add any existing ICE candidates
    if (signalData?.candidates) {
      for (const c of signalData.candidates) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      }
    }
  }, [callId, setupPeerConnection]);

  // Listen for signal changes via realtime
  useEffect(() => {
    const channel = supabase
      .channel(`call-${callId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "call_signals",
        filter: `id=eq.${callId}`,
      }, async (payload) => {
        const updated = payload.new as any;

        if (updated.status === "ended" || updated.status === "rejected" || updated.status === "missed") {
          setStatus("ended");
          cleanup();
          setTimeout(onEnd, 1000);
          return;
        }

        const signalData = updated.signal_data || {};
        const pc = pcRef.current;
        if (!pc) return;

        // Caller receives answer
        if (signalData.answer && !pc.remoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.answer));
        }

        // Both sides receive ICE candidates
        if (signalData.candidates) {
          for (const c of signalData.candidates) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [callId, cleanup, onEnd]);

  // Auto-start for caller
  useEffect(() => {
    if (!isIncoming) createOffer();
  }, [isIncoming, createOffer]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(!isVideoOff);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center"
    >
      {/* Remote video (full bg) */}
      {callType === "video" && status === "connected" && (
        <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* Local video (pip) */}
      {callType === "video" && (
        <video ref={localVideoRef} autoPlay playsInline muted
          className="absolute top-20 right-4 w-28 h-40 rounded-xl object-cover border-2 border-primary shadow-lg z-10"
        />
      )}

      {/* Avatar & info overlay */}
      <div className={`relative z-10 flex flex-col items-center ${callType === "video" && status === "connected" ? "mt-auto mb-32" : ""}`}>
        {(callType === "voice" || status !== "connected") && (
          <>
            <div className="h-24 w-24 rounded-full overflow-hidden bg-muted mb-4 border-4 border-primary/30">
              {otherUser.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display text-3xl font-bold">
                  {otherUser.display_name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">{otherUser.display_name}</h2>
            <p className="text-sm text-muted-foreground mb-2">@{otherUser.username}</p>
          </>
        )}

        <p className="text-sm font-display text-muted-foreground">
          {status === "ringing" && (isIncoming ? "Incoming call..." : "Calling...")}
          {status === "connecting" && "Connecting..."}
          {status === "connected" && formatTime(duration)}
          {status === "ended" && "Call ended"}
        </p>

        {status === "ringing" && isIncoming && (
          <p className="text-xs text-muted-foreground mt-1">
            {callType === "video" ? "📹 Video call" : "📞 Voice call"}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center gap-4 mt-8">
        {status === "ringing" && isIncoming ? (
          <>
            <Button onClick={() => endCall("rejected")} className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90">
              <PhoneOff className="h-7 w-7 text-destructive-foreground" />
            </Button>
            <Button onClick={answerCall} className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600">
              <Phone className="h-7 w-7 text-white" />
            </Button>
          </>
        ) : status !== "ended" ? (
          <>
            <Button onClick={toggleMute} variant="outline" className={`h-14 w-14 rounded-full ${isMuted ? "bg-destructive/10 border-destructive" : ""}`}>
              {isMuted ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
            </Button>
            {callType === "video" && (
              <Button onClick={toggleVideo} variant="outline" className={`h-14 w-14 rounded-full ${isVideoOff ? "bg-destructive/10 border-destructive" : ""}`}>
                {isVideoOff ? <VideoOff className="h-5 w-5 text-destructive" /> : <Video className="h-5 w-5" />}
              </Button>
            )}
            <Button onClick={() => endCall("ended")} className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90">
              <PhoneOff className="h-7 w-7 text-destructive-foreground" />
            </Button>
          </>
        ) : (
          <Button onClick={onEnd} variant="outline" className="rounded-xl">
            <X className="h-4 w-4 mr-2" /> Close
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default CallScreen;
