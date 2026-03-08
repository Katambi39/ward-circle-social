import { cn } from "@/lib/utils";
import { usePostPoll } from "@/hooks/usePostPoll";
import { BarChart3 } from "lucide-react";

interface PostPollDisplayProps {
  postId: string;
}

const PostPollDisplay = ({ postId }: PostPollDisplayProps) => {
  const { poll, loading, vote } = usePostPoll(postId);

  if (loading || !poll) return null;

  const hasVoted = poll.myVote !== null;

  return (
    <div className="mt-3 p-3 rounded-lg border border-border bg-muted/30 space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-display font-medium">
        <BarChart3 className="h-3.5 w-3.5 text-accent" />
        Poll · {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
      </div>
      {poll.options.map((option, i) => {
        const pct = poll.totalVotes > 0 ? Math.round((poll.votes[i] / poll.totalVotes) * 100) : 0;
        return (
          <button
            key={i}
            onClick={() => !hasVoted && vote(i)}
            disabled={hasVoted}
            className={cn(
              "relative w-full text-left rounded-lg px-3 py-2 text-sm font-display overflow-hidden transition-colors",
              hasVoted
                ? "cursor-default"
                : "hover:bg-primary/10 cursor-pointer border border-border"
            )}
          >
            {hasVoted && (
              <div
                className={cn(
                  "absolute inset-0 rounded-lg transition-all",
                  poll.myVote === i ? "bg-primary/20" : "bg-muted/50"
                )}
                style={{ width: `${pct}%` }}
              />
            )}
            <span className="relative z-10 flex items-center justify-between">
              <span className={cn(poll.myVote === i && "font-semibold text-primary")}>
                {option}
              </span>
              {hasVoted && (
                <span className="text-xs text-muted-foreground font-medium">{pct}%</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PostPollDisplay;
