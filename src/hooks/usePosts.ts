import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DbPost {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  is_anonymous: boolean;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  share_count: number;
  group_id: string | null;
  created_at: string;
  repost_of: string | null;
  repost_comment: string | null;
  feeling: string | null;
  visibility: string;
  // Joined data
  author_name: string;
  author_username: string;
  author_avatar: string | null;
  author_verified: boolean;
  group_name: string | null;
  group_location: string | null;
}

const PAGE_SIZE = 10;

export function usePosts() {
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const fetchPosts = useCallback(async (page: number, append = false) => {
    if (page === 0) setLoading(true);
    else setLoadingMore(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        groups (name, location)
      `)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const postsData = data || [];
    
    // Fetch profiles for all unique user_ids
    const userIds = [...new Set(postsData.map((p: any) => p.user_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from("profiles").select("user_id, display_name, username, avatar_url, verification_status").in("user_id", userIds)
      : { data: [] };

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const mapped: DbPost[] = postsData.map((p: any) => {
      const profile = profileMap.get(p.user_id);
      return {
        id: p.id,
        user_id: p.user_id,
        title: p.title,
        content: p.content,
        image_url: p.image_url,
        video_url: p.video_url || null,
        link_url: p.link_url,
        is_anonymous: p.is_anonymous,
        upvotes: p.upvotes,
        downvotes: p.downvotes,
        comment_count: p.comment_count,
        share_count: p.share_count,
        group_id: p.group_id,
        created_at: p.created_at,
        author_name: profile?.display_name || "User",
        author_username: profile?.username || "user",
        author_avatar: profile?.avatar_url || null,
        author_verified: profile?.verification_status === "verified",
        group_name: p.groups?.name || null,
        group_location: p.groups?.location || null,
        repost_of: p.repost_of || null,
        repost_comment: p.repost_comment || null,
        feeling: p.feeling || null,
        visibility: p.visibility || "public",
      };
    });

    setHasMore(mapped.length === PAGE_SIZE);

    if (append) {
      setPosts((prev) => [...prev, ...mapped]);
    } else {
      setPosts(mapped);
    }

    setLoading(false);
    setLoadingMore(false);
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    pageRef.current += 1;
    fetchPosts(pageRef.current, true);
  }, [loadingMore, hasMore, fetchPosts]);

  // Initial fetch
  useEffect(() => {
    pageRef.current = 0;
    fetchPosts(0);
  }, [fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          const newId = (payload.new as any).id;
          const userId = (payload.new as any).user_id;
          
          // Fetch post and profile separately
          const [postRes, profileRes] = await Promise.all([
            supabase.from("posts").select("*, groups (name, location)").eq("id", newId).single(),
            supabase.from("profiles").select("display_name, username, avatar_url, verification_status").eq("user_id", userId).single(),
          ]);

          if (postRes.data) {
            const p = postRes.data as any;
            const profile = profileRes.data as any;
            const newPost: DbPost = {
              id: p.id,
              user_id: p.user_id,
              title: p.title,
              content: p.content,
              image_url: p.image_url,
              video_url: p.video_url || null,
              link_url: p.link_url,
              is_anonymous: p.is_anonymous,
              upvotes: p.upvotes,
              downvotes: p.downvotes,
              comment_count: p.comment_count,
              share_count: p.share_count,
              group_id: p.group_id,
              created_at: p.created_at,
              author_name: profile?.display_name || "User",
              author_username: profile?.username || "user",
              author_avatar: profile?.avatar_url || null,
              author_verified: profile?.verification_status === "verified",
              group_name: p.groups?.name || null,
              group_location: p.groups?.location || null,
              repost_of: p.repost_of || null,
              repost_comment: p.repost_comment || null,
              feeling: p.feeling || null,
              visibility: p.visibility || "public",
            };
            setPosts((prev) => [newPost, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === payload.new.id
                ? { ...p, upvotes: (payload.new as any).upvotes, downvotes: (payload.new as any).downvotes, comment_count: (payload.new as any).comment_count, share_count: (payload.new as any).share_count }
                : p
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { posts, loading, loadingMore, hasMore, loadMore, refetch: () => { pageRef.current = 0; fetchPosts(0); } };
}
