import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingHashtag, TrendPreviewPost, categoryEmojis } from "@/data/trendingData";
import {
  ArrowUp, ArrowDown, Minus, Shield, ChevronDown, ChevronUp,
  MessageCircle, Heart, BarChart3, MapPin, Clock, Flame, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TrendCardProps {
  trend: TrendingHashtag;
  showAnalytics?: boolean;
}

const velocityConfig = {
  rising: { icon: ArrowUp, label: "Rising", color: "text-primary" },
  stable: { icon: Minus, label: "Stable", color: "text-muted-foreground" },
  cooling: { icon: ArrowDown, label: "Cooling", color: "text-accent" },
};

const TrendCard = ({ trend, showAnalytics = false }: TrendCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const vel = velocityConfig[trend.velocity];
  const VelIcon = vel.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: trend.rank * 0.04, duration: 0.3 }}
      className="bg-card border border-border rounded-xl shadow-card hover:shadow-elevated transition-all overflow-hidden"
    >
      <div className="p-4">
        {/* Main row */}
        <div className="flex items-start gap-3">
          {/* Rank */}
          <div className={cn(
            "flex items-center justify-center h-8 w-8 rounded-lg font-display font-bold text-sm shrink-0",
            trend.rank <= 3 ? "gradient-kenya text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {trend.rank}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{categoryEmojis[trend.category]}</span>
              <h3 className="font-display font-bold text-foreground">{trend.hashtag}</h3>
              {trend.isVerifiedTrend && (
                <Badge variant="outline" className="text-[10px] gap-1 text-primary border-primary/30 font-display">
                  <Shield className="h-3 w-3" /> Verified
                </Badge>
              )}
              <div className={cn("flex items-center gap-0.5 text-xs font-display font-semibold", vel.color)}>
                <VelIcon className="h-3.5 w-3.5" />
                {vel.label}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{trend.topic}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="font-display font-semibold text-foreground">
                {trend.postCount >= 1000 ? `${(trend.postCount / 1000).toFixed(1)}k` : trend.postCount} posts
              </span>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {trend.region === "nairobi" ? "Nairobi" : trend.region === "diaspora" ? "Diaspora" : "National"}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Started {trend.startedAt}
              </div>
            </div>
          </div>

          {/* Expand */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full shrink-0 text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Analytics bar (for premium) */}
        {showAnalytics && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
            <BarChart3 className="h-3.5 w-3.5 text-secondary shrink-0" />
            <span className="text-muted-foreground">
              Started in <span className="font-semibold text-foreground">{trend.startedIn}</span> · {trend.startedAt}
            </span>
            <div className="flex-1" />
            <SentimentBar sentiment={trend.sentiment} />
          </div>
        )}
      </div>

      {/* Expanded preview */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-4 space-y-3">
              {trend.topPosts.map((post) => (
                <PreviewPost key={post.id} post={post} />
              ))}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-full gradient-kenya text-primary-foreground font-display text-xs gap-1 flex-1"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Join the Conversation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full font-display text-xs gap-1"
                >
                  <Flame className="h-3.5 w-3.5" /> See All Posts
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PreviewPost = ({ post }: { post: TrendPreviewPost }) => (
  <div className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
    <div className="h-8 w-8 rounded-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-xs shrink-0">
      {post.author[0]}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="font-display font-semibold text-sm text-foreground">{post.author}</span>
        {post.isVerified && <Shield className="h-3.5 w-3.5 text-primary fill-primary/20" />}
        <span className="text-xs text-muted-foreground">· {post.timeAgo}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{post.content}</p>
      <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
        <Heart className="h-3.5 w-3.5" />
        <span>{post.likes.toLocaleString()}</span>
      </div>
    </div>
  </div>
);

const SentimentBar = ({ sentiment }: { sentiment: { positive: number; negative: number; neutral: number } }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] text-muted-foreground">Sentiment:</span>
    <div className="flex h-2 w-20 rounded-full overflow-hidden">
      <div className="bg-primary" style={{ width: `${sentiment.positive}%` }} />
      <div className="bg-muted-foreground/30" style={{ width: `${sentiment.neutral}%` }} />
      <div className="bg-accent" style={{ width: `${sentiment.negative}%` }} />
    </div>
    <span className="text-[10px] font-semibold text-primary">{sentiment.positive}%+</span>
  </div>
);

export default TrendCard;
