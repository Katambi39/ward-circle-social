import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, ArrowUp, ArrowDown, Share2, Pin } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  share_count: number;
  is_anonymous: boolean;
  created_at: string;
}

interface ProfilePostsTabProps {
  onPostCountChange: (count: number) => void;
}

const ProfilePostsTab = ({ onPostCountChange }: ProfilePostsTabProps) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setPosts(data || []);
      onPostCountChange(data?.length || 0);
      setLoading(false);
    };
    fetchPosts();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-card animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 shadow-card text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display font-bold text-foreground mb-1">No posts yet</h3>
        <p className="text-sm text-muted-foreground">Share your thoughts with the community!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-elevated transition-shadow"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-display font-bold text-foreground text-sm leading-snug flex-1">
              {post.title}
            </h3>
            {post.is_anonymous && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-display ml-2">
                Anonymous
              </span>
            )}
          </div>

          {post.content && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{post.content}</p>
          )}

          {post.image_url && (
            <div className="mb-3 rounded-lg overflow-hidden border border-border">
              <img src={post.image_url} alt="" className="w-full h-48 object-cover" />
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ArrowUp className="h-3.5 w-3.5" /> {post.upvotes}
              </span>
              <span className="flex items-center gap-1">
                <ArrowDown className="h-3.5 w-3.5" /> {post.downvotes}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" /> {post.comment_count}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="h-3.5 w-3.5" /> {post.share_count}
              </span>
            </div>
            <span className="font-display">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ProfilePostsTab;
