import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import CreatePostBar from "@/components/feed/CreatePostBar";
import StoryBar from "@/components/stories/StoryBar";
import FeedTabs from "@/components/feed/FeedTabs";
import PostCard from "@/components/feed/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { posts, loading, loadingMore, hasMore, loadMore } = usePosts();
  const { bookmarkedIds, toggle: toggleBookmark } = useBookmarks();
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const verifiedOnly = searchParams.get("filter") === "verified";
  const followingOnly = searchParams.get("filter") === "following";
  const localityOnly = searchParams.get("filter") === "locality";
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [followingIds, setFollowingIds] = useState<string[]>([]);

  // Fetch following IDs for "Following" tab
  useEffect(() => {
    if (user && followingOnly) {
      supabase.from("connections").select("following_id").eq("follower_id", user.id)
        .then(({ data }) => setFollowingIds((data || []).map((c: any) => c.following_id)));
    }
  }, [user, followingOnly]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (verifiedOnly) result = result.filter((p) => p.author_verified);
    if (followingOnly) result = result.filter((p) => followingIds.includes(p.user_id));
    if (localityOnly && profile?.county) result = result.filter((p) => p.group_location?.includes(profile.county!) || false);
    return result;
  }, [posts, verifiedOnly, followingOnly, localityOnly, followingIds, profile]);

  // Infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loadingMore) loadMore();
    },
    [hasMore, loadingMore, loadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const filterLabel = verifiedOnly ? "verified users" : followingOnly ? "people you follow" : localityOnly ? profile?.county || "your area" : null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-4 px-4 overflow-x-hidden">
        <FeedTabs />

        {filterLabel && (
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-display font-medium text-primary">Showing {filterLabel} only</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSearchParams({})} className="text-xs font-display rounded-full h-7">
              Clear
            </Button>
          </div>
        )}

        <StoryBar />
        <CreatePostBar />

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-display text-lg text-muted-foreground">
              {filterLabel ? `No posts from ${filterLabel} yet` : "No posts yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {followingOnly ? "Follow more people to see their posts here" : "Be the first to share something with your community!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post, index) => (
              <PostCard
                key={post.id}
                dbPost={post}
                index={index}
                isBookmarked={bookmarkedIds.has(post.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-4 font-display">You've reached the end</p>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
