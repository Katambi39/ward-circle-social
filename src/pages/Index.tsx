import { useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import CreatePostBar from "@/components/feed/CreatePostBar";
import FeedTabs from "@/components/feed/FeedTabs";
import PostCard from "@/components/feed/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { posts, loading, loadingMore, hasMore, loadMore } = usePosts();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loadingMore) {
        loadMore();
      }
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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-4 px-4">
        <FeedTabs />
        <CreatePostBar />

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-display text-lg text-muted-foreground">No posts yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to share something with your community!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post, index) => (
              <PostCard key={post.id} dbPost={post} index={index} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
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
