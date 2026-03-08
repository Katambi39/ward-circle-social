import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setBookmarkedIds(new Set((data || []).map((b: any) => b.post_id)));
      });
  }, [user]);

  const toggle = useCallback(async (postId: string) => {
    if (!user) return;
    const isBookmarked = bookmarkedIds.has(postId);
    
    if (isBookmarked) {
      setBookmarkedIds((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("post_id", postId);
    } else {
      setBookmarkedIds((prev) => new Set(prev).add(postId));
      await supabase.from("bookmarks").insert({ user_id: user.id, post_id: postId });
    }
  }, [user, bookmarkedIds]);

  return { bookmarkedIds, toggle };
}
