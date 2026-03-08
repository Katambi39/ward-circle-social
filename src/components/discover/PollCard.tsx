import { useState } from "react";
import { Shield, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface Poll {
  id: string;
  question: string;
  options: { label: string; votes: number }[];
  totalVotes: number;
  creator: string;
  isVerified: boolean;
  emoji?: string;
}

interface PollCardProps {
  poll: Poll;
}

const PollCard = ({ poll }: PollCardProps) => {
  const [voted, setVoted] = useState<number | null>(null);
  const total = voted !== null
    ? poll.totalVotes + 1
    : poll.totalVotes;

  const handleVote = (idx: number) => {
    if (voted !== null) return;
    setVoted(idx);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-secondary" />
        <span className="font-display font-semibold text-sm text-foreground">{poll.creator}</span>
        {poll.isVerified && <Shield className="h-3.5 w-3.5 text-primary fill-primary/20" />}
      </div>
      <p className="font-display font-bold text-foreground mb-3">
        {poll.emoji} {poll.question}
      </p>
      <div className="space-y-2">
        {poll.options.map((opt, idx) => {
          const optVotes = voted === idx ? opt.votes + 1 : opt.votes;
          const pct = total > 0 ? Math.round((optVotes / total) * 100) : 0;
          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={voted !== null}
              className={cn(
                "w-full relative rounded-lg overflow-hidden text-left transition-all",
                voted !== null ? "cursor-default" : "cursor-pointer hover:ring-2 hover:ring-primary/30"
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-lg transition-all",
                  voted === idx ? "bg-primary/20" : "bg-muted"
                )}
                style={voted !== null ? { width: `${pct}%` } : { width: "100%" }}
              />
              <div className="relative px-3 py-2.5 flex items-center justify-between">
                <span className={cn(
                  "text-sm font-medium",
                  voted === idx ? "text-primary font-semibold" : "text-foreground"
                )}>
                  {opt.label}
                </span>
                {voted !== null && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-display font-semibold text-muted-foreground"
                  >
                    {pct}%
                  </motion.span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 font-display">
        {total.toLocaleString()} votes
      </p>
    </div>
  );
};

export default PollCard;
