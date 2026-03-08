import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Eye, Pause, Play, Music, Trash2, ChevronUp, Send } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import SyncedLyrics from "./SyncedLyrics";
import StoryReplyBar from "./StoryReplyBar";
import StoryRepliesPanel from "./StoryRepliesPanel";

interface StoryItem {
  id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  music_track_id?: string | null;
  music_start_time?: number;
}

interface MusicTrackData {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  lyrics: { time: number; text: string }[];
}

interface StoryGroup {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  username: string;
  stories: StoryItem[];
  hasUnviewed: boolean;
}

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onDeleted?: () => void;
}

const STORY_DURATION_DEFAULT = 5000; // 5 seconds per story
const STORY_DURATION_MUSIC = 30000; // 30 seconds for music stories

const StoryViewer = ({ groups, initialGroupIndex, onClose, onDeleted }: StoryViewerProps) => {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const [musicTrack, setMusicTrack] = useState<MusicTrackData | null>(null);
  const [musicTime, setMusicTime] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [viewers, setViewers] = useState<Array<{ viewer_id: string; viewed_at: string; display_name: string; avatar_url: string | null; username: string }>>([]);
  const [showViewers, setShowViewers] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Record view
  useEffect(() => {
    if (!currentStory || !user || currentGroup.user_id === user.id) return;
    supabase
      .from("story_views")
      .upsert({ story_id: currentStory.id, viewer_id: user.id }, { onConflict: "story_id,viewer_id" })
      .then(() => {});
  }, [currentStory?.id]);

  // Fetch view count and viewers for own stories
  useEffect(() => {
    if (!currentStory || !user || currentGroup.user_id !== user.id) {
      setViewCount(0);
      setViewers([]);
      setShowViewers(false);
      return;
    }
    const fetchViewers = async () => {
      const { data: views } = await supabase
        .from("story_views")
        .select("viewer_id, viewed_at")
        .eq("story_id", currentStory.id)
        .order("viewed_at", { ascending: false });

      if (!views || views.length === 0) {
        setViewCount(0);
        setViewers([]);
        return;
      }

      setViewCount(views.length);

      const viewerIds = views.map((v) => v.viewer_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, username")
        .in("user_id", viewerIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      setViewers(
        views.map((v) => {
          const p = profileMap.get(v.viewer_id);
          return {
            viewer_id: v.viewer_id,
            viewed_at: v.viewed_at,
            display_name: p?.display_name || "User",
            avatar_url: p?.avatar_url || null,
            username: p?.username || "",
          };
        })
      );
    };
    fetchViewers();
  }, [currentStory?.id]);

  // Load music track
  useEffect(() => {
    const trackId = currentStory?.music_track_id;
    if (!trackId) {
      setMusicTrack(null);
      musicAudioRef.current?.pause();
      musicAudioRef.current = null;
      return;
    }
    supabase.from("music_tracks").select("*").eq("id", trackId).single()
      .then(({ data }) => {
        if (data) setMusicTrack(data as any);
      });
  }, [currentStory?.music_track_id]);

  // Play/pause music
  useEffect(() => {
    if (!musicTrack) return;
    musicAudioRef.current?.pause();
    const audio = new Audio(musicTrack.audio_url);
    audio.currentTime = currentStory?.music_start_time || 0;
    audio.loop = true;
    audio.volume = 0.6;
    musicAudioRef.current = audio;

    const updateTime = () => setMusicTime(audio.currentTime);
    audio.addEventListener("timeupdate", updateTime);

    if (!paused) audio.play().catch(() => {});

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.pause();
    };
  }, [musicTrack?.id, groupIndex, storyIndex]);

  // Sync pause state with music
  useEffect(() => {
    if (!musicAudioRef.current) return;
    if (paused) musicAudioRef.current.pause();
    else musicAudioRef.current.play().catch(() => {});
  }, [paused]);

  // Cleanup music on unmount
  useEffect(() => {
    return () => { musicAudioRef.current?.pause(); };
  }, []);

  const goNext = useCallback(() => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((i) => i + 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      onClose();
    }
  }, [storyIndex, groupIndex, currentGroup, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else if (groupIndex > 0) {
      setGroupIndex((i) => i - 1);
      const prevGroup = groups[groupIndex - 1];
      setStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
      elapsedRef.current = 0;
    }
  }, [storyIndex, groupIndex, groups]);

  // Determine duration based on whether story has music
  const storyDuration = currentStory?.music_track_id ? STORY_DURATION_MUSIC : STORY_DURATION_DEFAULT;

  // Auto-advance timer
  useEffect(() => {
    if (paused) return;

    startTimeRef.current = Date.now();
    const remaining = storyDuration - elapsedRef.current;

    const animate = () => {
      const now = Date.now();
      const total = elapsedRef.current + (now - startTimeRef.current);
      const pct = Math.min((total / storyDuration) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        goNext();
      } else {
        timerRef.current = requestAnimationFrame(animate);
      }
    };

    timerRef.current = requestAnimationFrame(animate);

    const timeout = setTimeout(goNext, remaining);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      clearTimeout(timeout);
      elapsedRef.current += Date.now() - startTimeRef.current;
    };
  }, [groupIndex, storyIndex, paused, goNext, storyDuration]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
      else if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  const handleDelete = async () => {
    if (!currentStory || !user) return;
    const confirmed = window.confirm("Delete this story?");
    if (!confirmed) return;
    
    setPaused(true);
    const { error } = await supabase.from("stories").delete().eq("id", currentStory.id);
    if (error) {
      toast.error("Failed to delete story");
      setPaused(false);
      return;
    }
    toast.success("Story deleted");
    onDeleted?.();
    
    // Navigate away from deleted story
    if (currentGroup.stories.length <= 1) {
      // Last story in group
      if (groups.length <= 1) {
        onClose();
      } else if (groupIndex < groups.length - 1) {
        setGroupIndex(groupIndex);
        setStoryIndex(0);
        setProgress(0);
        elapsedRef.current = 0;
      } else {
        setGroupIndex(groupIndex - 1);
        setStoryIndex(0);
        setProgress(0);
        elapsedRef.current = 0;
      }
    } else {
      goNext();
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white/80 hover:text-white">
        <X className="h-7 w-7" />
      </button>

      {/* Navigation arrows */}
      {(groupIndex > 0 || storyIndex > 0) && (
        <button onClick={goPrev} className="absolute left-2 md:left-6 z-50 text-white/60 hover:text-white">
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      {(groupIndex < groups.length - 1 || storyIndex < currentGroup.stories.length - 1) && (
        <button onClick={goNext} className="absolute right-2 md:right-6 z-50 text-white/60 hover:text-white">
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Story container */}
      <div className="relative w-full max-w-sm h-full max-h-[90vh] mx-auto">
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 z-40 flex gap-1">
          {currentGroup.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-5 left-2 right-12 z-40 flex items-center gap-2.5 px-1">
          <div className="h-9 w-9 rounded-full overflow-hidden border border-white/30 shrink-0">
            {currentGroup.avatar_url ? (
              <img src={currentGroup.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-white/20 flex items-center justify-center text-white font-display font-bold text-sm">
                {currentGroup.display_name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-display font-semibold truncate">
              {currentGroup.display_name}
            </p>
            <p className="text-white/60 text-[10px]">
              {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {user && currentGroup.user_id === user.id && (
              <button
                onClick={handleDelete}
                className="text-white/70 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setPaused((p) => !p)}
              className="text-white/70 hover:text-white"
            >
              {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Media */}
        <div
          className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-black"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 3) goPrev();
            else goNext();
          }}
        >
          {currentStory.media_type === "video" ? (
            <video
              key={currentStory.id}
              src={currentStory.media_url}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.media_url}
              alt=""
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Synced Lyrics */}
        {musicTrack && musicTrack.lyrics && (musicTrack.lyrics as any[]).length > 0 && (
          <SyncedLyrics
            lyrics={musicTrack.lyrics as any[]}
            currentTime={musicTime}
            isPlaying={!paused}
          />
        )}

        {/* Music indicator */}
        {musicTrack && (
          <div className="absolute top-14 right-2 z-40 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Music className="h-3 w-3 text-white animate-pulse" />
            <span className="text-[10px] text-white/80 font-display truncate max-w-[100px]">
              {musicTrack.title}
            </span>
          </div>
        )}

        {/* Caption */}
        {currentStory.caption && !musicTrack?.lyrics?.length && (
          <div className={`absolute left-0 right-0 z-40 px-4 ${user && currentGroup.user_id !== user.id ? 'bottom-28' : 'bottom-4'}`}>
            <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <p className="text-white text-sm font-display text-center">{currentStory.caption}</p>
            </div>
          </div>
        )}

        {/* View count + viewers/replies panel for own stories */}
        {user && currentGroup.user_id === user.id && (
          <div className="absolute bottom-0 left-0 right-0 z-40">
            {/* Viewers list panel */}
            {showViewers && (
              <div className="mx-4 mb-2 bg-black/70 backdrop-blur-md rounded-xl max-h-[40vh] overflow-y-auto">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-xs font-display text-white/80 font-semibold">
                    {viewCount} {viewCount === 1 ? "viewer" : "viewers"}
                  </span>
                  <button onClick={() => setShowViewers(false)} className="text-white/60 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {viewers.length === 0 ? (
                  <p className="text-xs text-white/50 text-center py-4 font-display">No viewers yet</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {viewers.map((v) => (
                      <div key={v.viewer_id} className="flex items-center gap-2.5 px-3 py-2">
                        <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-white/20">
                          {v.avatar_url ? (
                            <img src={v.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-white/20 flex items-center justify-center text-white font-display font-bold text-xs">
                              {v.display_name[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-display font-semibold truncate">{v.display_name}</p>
                          <p className="text-white/50 text-[10px]">@{v.username}</p>
                        </div>
                        <span className="text-[10px] text-white/40 shrink-0">
                          {formatDistanceToNow(new Date(v.viewed_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Replies panel for own stories */}
            {showReplies && (
              <StoryRepliesPanel
                storyId={currentStory.id}
                onClose={() => setShowReplies(false)}
              />
            )}

            {/* Clickable view count + replies buttons */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => { setPaused(true); setShowViewers(!showViewers); setShowReplies(false); }}
                className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                <Eye className="h-3.5 w-3.5 text-white/80" />
                <span className="text-xs text-white/80 font-display">{viewCount} {viewCount === 1 ? 'view' : 'views'}</span>
                <ChevronUp className={`h-3 w-3 text-white/60 transition-transform ${showViewers ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => { setPaused(true); setShowReplies(!showReplies); setShowViewers(false); }}
                className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                <Send className="h-3.5 w-3.5 text-white/80" />
                <span className="text-xs text-white/80 font-display">Replies</span>
                <ChevronUp className={`h-3 w-3 text-white/60 transition-transform ${showReplies ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* Reply bar for viewers (non-owners) */}
        {user && currentGroup.user_id !== user.id && (
          <div className="absolute bottom-0 left-0 right-0 z-40">
            <StoryReplyBar
              storyId={currentStory.id}
              senderId={user.id}
              onFocus={() => { setPaused(true); setIsTyping(true); }}
              onBlur={() => { setIsTyping(false); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
