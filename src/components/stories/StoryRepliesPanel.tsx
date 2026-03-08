import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Reply {
  id: string;
  sender_id: string;
  reply_type: string;
  content: string;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
  username: string;
}

interface StoryRepliesPanelProps {
  storyId: string;
  onClose: () => void;
}

const StoryRepliesPanel = ({ storyId, onClose }: StoryRepliesPanelProps) => {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReplies = async () => {
    const { data } = await supabase
      .from("story_replies" as any)
      .select("id, sender_id, reply_type, content, created_at")
      .eq("story_id", storyId)
      .order("created_at", { ascending: false }) as any;

    if (!data || data.length === 0) {
      setReplies([]);
      setLoading(false);
      return;
    }

    const senderIds = [...new Set(data.map((r: any) => r.sender_id))] as string[];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, username")
      .in("user_id", senderIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    setReplies(
      data.map((r: any) => {
        const p = profileMap.get(r.sender_id);
        return {
          ...r,
          display_name: p?.display_name || "User",
          avatar_url: p?.avatar_url || null,
          username: p?.username || "",
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchReplies();

    // Realtime subscription
    const channel = supabase
      .channel(`story-replies-${storyId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "story_replies",
        filter: `story_id=eq.${storyId}`,
      }, () => {
        fetchReplies();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [storyId]);

  return (
    <div className="mx-4 mb-2 bg-black/70 backdrop-blur-md rounded-xl max-h-[40vh] overflow-y-auto">
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-display text-white/80 font-semibold">
          Replies ({replies.length})
        </span>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-white/50 text-center py-4 font-display">Loading...</p>
      ) : replies.length === 0 ? (
        <p className="text-xs text-white/50 text-center py-4 font-display">No replies yet</p>
      ) : (
        <div className="divide-y divide-white/5">
          {replies.map((r) => (
            <div key={r.id} className="flex items-start gap-2.5 px-3 py-2">
              <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 border border-white/20">
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-white/20 flex items-center justify-center text-white font-display font-bold text-[10px]">
                    {r.display_name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-xs font-display font-semibold truncate">{r.display_name}</span>
                  <span className="text-[10px] text-white/40 shrink-0">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </span>
                </div>
                {r.reply_type === "reaction" ? (
                  <span className="text-2xl">{r.content}</span>
                ) : (
                  <p className="text-white/80 text-xs mt-0.5">{r.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryRepliesPanel;
