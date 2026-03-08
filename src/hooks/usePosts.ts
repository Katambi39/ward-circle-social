import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DbPost {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  is_anonymous: boolean;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  share_count: number;
  group_id: string | null;
  created_at: string;
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
          // Fetch the full post with joined data
          const { data } = await supabase
            .from("posts")
            .select(`
              *,
              profiles!posts_user_id_fkey (display_name, username, avatar_url, verification_status),
              groups (name, location)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            const newPost: DbPost = {
              id: data.id,
              user_id: data.user_id,
              title: data.title,
              content: data.content,
              image_url: data.image_url,
              link_url: data.link_url,
              is_anonymous: data.is_anonymous,
              upvotes: data.upvotes,
              downvotes: data.downvotes,
              comment_count: data.comment_count,
              share_count: data.share_count,
              group_id: data.group_id,
              created_at: data.created_at,
              author_name: (data as any).profiles?.display_name || "User",
              author_username: (data as any).profiles?.username || "user",
              author_avatar: (data as any).profiles?.avatar_url,
              author_verified: (data as any).profiles?.verification_status === "verified",
              group_name: (data as any).groups?.name || null,
              group_location: (data as any).groups?.location || null,
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
