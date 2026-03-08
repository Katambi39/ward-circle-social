import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { DbPost } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";
import ReactionBar from "./ReactionBar";
import PostPollDisplay from "./PostPollDisplay";

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

  return <PostCardInner post={post} postId={dbPost?.id || post.id} authorUsername={dbPost?.author_username} index={index} isBookmarked={isBookmarked} onToggleBookmark={onToggleBookmark} />;
};

const PostCardInner = ({ post, postId, authorUsername, index, isBookmarked, onToggleBookmark }: { post: PostData; postId: string; authorUsername?: string; index: number; isBookmarked: boolean; onToggleBookmark?: (id: string) => void }) => {
  const navigate = useNavigate();
  const [votes, setVotes] = useState(post.upvotes);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);

  const handleVote = (direction: "up" | "down") => {
    if (voted === direction) {
      setVotes(post.upvotes);
      setVoted(null);
    } else {
      setVotes(post.upvotes + (direction === "up" ? 1 : -1));
      setVoted(direction);
    }
  };

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
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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

          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground gap-1.5 px-2">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-display">{post.comments}</span>
          </Button>

          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground gap-1.5 px-2">
            <Share2 className="h-4 w-4" />
            <span className="text-xs font-display">{post.shares}</span>
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
