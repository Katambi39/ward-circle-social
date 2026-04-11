import { useNavigate } from "react-router-dom";
import { LiveTrend } from "@/hooks/useTrending";
import {
  ArrowUp, Minus, MessageCircle, Heart, Share2, TrendingUp, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Props {
  trend: LiveTrend;
  rank: number;
}

const LiveTrendCard = ({ trend, rank }: Props) => {
  const navigate = useNavigate();

  const velocity = (() => {
    const firstSeen = new Date(trend.first_seen).getTime();
    const hoursOld = (Date.now() - firstSeen) / 3_600_000;
    if (hoursOld < 3) return "rising";
    if (hoursOld < 12) return "stable";
    return "cooling";
  })();

  const velConfig = {
    rising: { icon: ArrowUp, label: "Rising", color: "text-primary" },
    stable: { icon: Minus, label: "Stable", color: "text-muted-foreground" },
    cooling: { icon: TrendingUp, label: "Cooling", color: "text-accent" },
  };
  const vel = velConfig[velocity];
  const VelIcon = vel.icon;

  const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.04, duration: 0.3 }}
      className="bg-card border border-border rounded-xl shadow-card hover:shadow-elevated transition-all p-4"
    >
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-lg font-display font-bold text-sm shrink-0",
            rank <= 3
              ? "gradient-kenya text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-display font-bold text-primary cursor-pointer hover:underline"
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(trend.trend_type === "hashtag" ? "#" + trend.hashtag : trend.hashtag)}`)
              }
            >
              {trend.trend_type === "hashtag" ? `#${trend.hashtag}` : trend.hashtag}
            </h3>
            {trend.trend_type === "keyword" && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-display text-muted-foreground">
                topic
              </Badge>
            )}
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-display font-semibold",
                vel.color
              )}
            >
              <VelIcon className="h-3.5 w-3.5" />
              {vel.label}
            </div>
          </div>

          {/* Engagement stats */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="font-display font-semibold text-foreground">
              {formatCount(Number(trend.post_count))} posts
            </span>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {formatCount(Number(trend.total_upvotes))}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {formatCount(Number(trend.total_comments))}
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              {formatCount(Number(trend.total_shares))}
            </div>
          </div>

          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Started{" "}
            {formatDistanceToNow(new Date(trend.first_seen), {
              addSuffix: true,
            })}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="rounded-full font-display text-xs gap-1 shrink-0"
          onClick={() =>
            navigate(`/search?q=${encodeURIComponent(trend.trend_type === "hashtag" ? "#" + trend.hashtag : trend.hashtag)}`)
          }
        >
          <MessageCircle className="h-3.5 w-3.5" /> View
        </Button>
      </div>
    </motion.div>
  );
};

export default LiveTrendCard;
