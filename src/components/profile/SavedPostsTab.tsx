import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import PostCard from "@/components/feed/PostCard";
import { DbPost } from "@/hooks/usePosts";
import { Loader2, Bookmark } from "lucide-react";

const SavedPostsTab = () => {
  const { user } = useAuth();
  const { bookmarkedIds, toggle } = useBookmarks();
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSaved = async () => {
      setLoading(true);
      const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!bookmarks || bookmarks.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const postIds = bookmarks.map((b: any) => b.post_id);
      const { data: postsData } = await supabase
        .from("posts")
        .select("*, groups(name, location)")
        .in("id", postIds);

      if (!postsData) { setPosts([]); setLoading(false); return; }

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
        };
      });

      // Maintain bookmark order
      const orderMap = new Map(postIds.map((id: string, i: number) => [id, i]));
      mapped.sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));

      setPosts(mapped);
      setLoading(false);
    };

    fetchSaved();
  }, [user, bookmarkedIds.size]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-xl shadow-card">
        <Bookmark className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-display text-lg text-muted-foreground">No saved posts yet</p>
        <p className="text-sm text-muted-foreground mt-1">Bookmark posts to find them here later</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          dbPost={post}
          index={index}
          isBookmarked={bookmarkedIds.has(post.id)}
          onToggleBookmark={toggle}
        />
      ))}
    </div>
  );
};

export default SavedPostsTab;
