import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin, Shield, Flag, Trash2, Copy, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { DbPost } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";
import ReactionBar from "./ReactionBar";
import PostPollDisplay from "./PostPollDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Keep legacy interface for backward compat
export interface PostData {
  id: string;
  author: string;
  authorAvatar?: string;
  group: string;
  groupLocality?: string;
  timeAgo: string;
  title: string;
  content: string;
  image?: string;
  video?: string;
  upvotes: number;
  comments: number;
  shares: number;
  isVerified: boolean;
  isAnonymous?: boolean;
}

interface PostCardProps {
  post?: PostData;
  dbPost?: DbPost;
  index: number;
  isBookmarked?: boolean;
  onToggleBookmark?: (postId: string) => void;
}

function dbPostToDisplay(p: DbPost): PostData {
  return {
    id: p.id,
    author: p.is_anonymous ? "Anonymous" : p.author_name,
    authorAvatar: p.is_anonymous ? undefined : (p.author_avatar || undefined),
    group: p.group_name || "General",
    groupLocality: p.group_location || undefined,
    timeAgo: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
    title: p.title,
    content: p.content || "",
    image: p.image_url || undefined,
    video: p.video_url || undefined,
    upvotes: p.upvotes - p.downvotes,
    comments: p.comment_count,
    shares: p.share_count,
    isVerified: p.author_verified,
    isAnonymous: p.is_anonymous,
  };
}

const PostCard = ({ post: legacyPost, dbPost, index, isBookmarked = false, onToggleBookmark }: PostCardProps) => {
  const post = legacyPost || (dbPost ? dbPostToDisplay(dbPost) : null);
  
  if (!post) return null;

  return <PostCardInner post={post} postId={dbPost?.id || post.id} authorUserId={dbPost?.user_id} authorUsername={dbPost?.author_username} index={index} isBookmarked={isBookmarked} onToggleBookmark={onToggleBookmark} />;
};

const PostCardInner = ({ post, postId, authorUserId, authorUsername, index, isBookmarked, onToggleBookmark }: { post: PostData; postId: string; authorUserId?: string; authorUsername?: string; index: number; isBookmarked: boolean; onToggleBookmark?: (id: string) => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [votes, setVotes] = useState(post.upvotes);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [shareCount, setShareCount] = useState(post.shares);

  const isOwnPost = !!(user && authorUserId && user.id === authorUserId);

  const handleVote = (direction: "up" | "down") => {
    if (voted === direction) {
      setVotes(post.upvotes);
      setVoted(null);
    } else {
      setVotes(post.upvotes + (direction === "up" ? 1 : -1));
      setVoted(direction);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    toast.success("Link copied to clipboard");
    setShareCount((c) => c + 1);
    supabase.from("posts").update({ share_count: post.shares + 1 }).eq("id", postId).then();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      toast.error("Failed to delete post");
    } else {
      toast.success("Post deleted");
      setDeleted(true);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    toast.success("Link copied");
  };

  if (deleted) return null;

  // Strip poll text from content for display (shown as PostPollDisplay instead)
  const displayContent = post.content?.replace(/📊 Poll:\n[\s\S]*$/, "").trim();

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.08, 0.4), duration: 0.4 }}
      className="bg-card border border-border rounded-xl shadow-card hover:shadow-elevated transition-shadow"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          {post.authorAvatar ? (
            <img src={post.authorAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
              {post.isAnonymous ? "?" : post.author[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="font-display font-semibold text-sm text-foreground cursor-pointer hover:underline"
                onClick={(e) => { e.stopPropagation(); if (!post.isAnonymous && authorUsername) navigate(`/user/${authorUsername}`); }}
              >
                {post.isAnonymous ? "Anonymous" : post.author}
              </span>
              {post.isVerified && !post.isAnonymous && (
                <Shield className="h-3.5 w-3.5 text-primary fill-primary/20" />
              )}
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="font-medium text-secondary">{post.group}</span>
              {post.groupLocality && (
                <>
                  <span>·</span>
                  <MapPin className="h-3 w-3" />
                  <span>{post.groupLocality}</span>
                </>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              {isOwnPost && (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              )}
              {!isOwnPost && (
                <DropdownMenuItem onClick={() => toast.info("Report submitted")}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content - clickable to go to post detail */}
        <div className="cursor-pointer" onClick={() => navigate(`/post/${postId}`)}>
          {/* Show title only on anonymous posts where title differs from content */}
          {post.isAnonymous && post.title && post.title !== post.content?.substring(0, 100) && (
            <h3 className="font-display font-bold text-foreground mb-2 leading-snug">
              {post.title}
            </h3>
          )}
          {displayContent && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {displayContent}
            </p>
          )}
          {post.image && (
            <div className="rounded-lg overflow-hidden mb-3 border border-border">
              <img src={post.image} alt="" className="w-full h-48 object-cover" />
            </div>
          )}
          {post.video && (
            <div className="rounded-lg overflow-hidden mb-3 border border-border">
              <video src={post.video} controls className="w-full max-h-72" />
            </div>
          )}
        </div>

        {/* Poll Display */}
        <PostPollDisplay postId={postId} />

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2">
          <div className="flex items-center bg-muted rounded-full">
            <button
              onClick={() => handleVote("up")}
              className={cn(
                "p-1.5 rounded-l-full transition-colors",
                voted === "up" ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <ArrowBigUp className={cn("h-5 w-5", voted === "up" && "fill-primary animate-vote-pop")} />
            </button>
            <span className={cn(
              "text-sm font-display font-semibold min-w-[2rem] text-center",
              voted === "up" ? "text-primary" : voted === "down" ? "text-accent" : "text-foreground"
            )}>
              {votes}
            </span>
            <button
              onClick={() => handleVote("down")}
              className={cn(
                "p-1.5 rounded-r-full transition-colors",
                voted === "down" ? "text-accent" : "text-muted-foreground hover:text-accent"
              )}
            >
              <ArrowBigDown className={cn("h-5 w-5", voted === "down" && "fill-accent animate-vote-pop")} />
            </button>
          </div>

          {/* Emoji Reactions */}
          <ReactionBar postId={postId} />

          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground gap-1.5 px-2" onClick={() => navigate(`/post/${postId}`)}>
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-display">{post.comments}</span>
          </Button>

          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground gap-1.5 px-2" onClick={(e) => { e.stopPropagation(); handleShare(); }}>
            <Share2 className="h-4 w-4" />
            <span className="text-xs font-display">{shareCount}</span>
          </Button>

          <div className="flex-1" />

          <button
            onClick={() => onToggleBookmark?.(postId)}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              isBookmarked ? "text-kenya-gold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-kenya-gold")} />
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;
