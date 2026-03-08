import { useState } from "react";
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  upvotes: number;
  comments: number;
  shares: number;
  isVerified: boolean;
  isAnonymous?: boolean;
}

interface PostCardProps {
  post: PostData;
  index: number;
}

const PostCard = ({ post, index }: PostCardProps) => {
  const [votes, setVotes] = useState(post.upvotes);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [saved, setSaved] = useState(false);

  const handleVote = (direction: "up" | "down") => {
    if (voted === direction) {
      setVotes(post.upvotes);
      setVoted(null);
    } else {
      setVotes(post.upvotes + (direction === "up" ? 1 : -1));
      setVoted(direction);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="bg-card border border-border rounded-xl shadow-card hover:shadow-elevated transition-shadow"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
            {post.isAnonymous ? "?" : post.author[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-semibold text-sm text-foreground">
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

        {/* Content */}
        <h3 className="font-display font-bold text-foreground mb-2 leading-snug">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          {post.content}
        </p>

        {post.image && (
          <div className="rounded-lg overflow-hidden mb-3 border border-border">
            <img src={post.image} alt="" className="w-full h-48 object-cover" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Vote */}
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

          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground gap-1.5">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-display">{post.comments}</span>
          </Button>

          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground gap-1.5">
            <Share2 className="h-4 w-4" />
            <span className="text-xs font-display">{post.shares}</span>
          </Button>

          <div className="flex-1" />

          <button
            onClick={() => setSaved(!saved)}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              saved ? "text-kenya-gold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bookmark className={cn("h-5 w-5", saved && "fill-kenya-gold")} />
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;
