import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const REACTIONS = ["❤️", "😂", "😮", "😢", "🔥"] as const;
export type ReactionEmoji = typeof REACTIONS[number];

export interface ReactionSummary {
  [emoji: string]: number;
}

export function useReactions(postId: string) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReactionSummary>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);

  const fetchReactions = useCallback(async () => {
    const { data } = await supabase
      .from("post_reactions")
      .select("reaction, user_id")
      .eq("post_id", postId);
    
    if (data) {
      const counts: ReactionSummary = {};
      let mine: string | null = null;
      data.forEach((r: any) => {
        counts[r.reaction] = (counts[r.reaction] || 0) + 1;
        if (user && r.user_id === user.id) mine = r.reaction;
      });
      setSummary(counts);
      setMyReaction(mine);
    }
  }, [postId, user]);

  useEffect(() => { fetchReactions(); }, [fetchReactions]);

  const react = useCallback(async (emoji: string) => {
    if (!user) return;
    
    if (myReaction === emoji) {
      // Remove reaction
      setMyReaction(null);
      setSummary((prev) => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 1) - 1) }));
      await supabase.from("post_reactions").delete().eq("user_id", user.id).eq("post_id", postId);
    } else if (myReaction) {
      // Change reaction
      const old = myReaction;
      setMyReaction(emoji);
      setSummary((prev) => ({
        ...prev,
        [old]: Math.max(0, (prev[old] || 1) - 1),
        [emoji]: (prev[emoji] || 0) + 1,
      }));
      await supabase.from("post_reactions").update({ reaction: emoji }).eq("user_id", user.id).eq("post_id", postId);
    } else {
      // New reaction
      setMyReaction(emoji);
      setSummary((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      await supabase.from("post_reactions").insert({ user_id: user.id, post_id: postId, reaction: emoji });
    }
  }, [user, postId, myReaction]);

  const totalReactions = Object.values(summary).reduce((a, b) => a + b, 0);

  return { summary, myReaction, react, totalReactions };
}
