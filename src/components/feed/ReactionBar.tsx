import { useState } from "react";
import { cn } from "@/lib/utils";
import { REACTIONS, useReactions } from "@/hooks/useReactions";
import { motion, AnimatePresence } from "framer-motion";

interface ReactionBarProps {
  postId: string;
}

const ReactionBar = ({ postId }: ReactionBarProps) => {
  const { summary, myReaction, react, totalReactions } = useReactions(postId);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors",
          myReaction
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        {myReaction ? (
          <span className="text-sm">{myReaction}</span>
        ) : (
          <span className="text-sm">😀</span>
        )}
        {totalReactions > 0 && (
          <span className="font-display font-medium">{totalReactions}</span>
        )}
      </button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 5 }}
            className="absolute bottom-full left-0 mb-1 flex items-center gap-0.5 bg-card border border-border rounded-full px-2 py-1 shadow-elevated z-50"
          >
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { react(emoji); setShowPicker(false); }}
                className={cn(
                  "text-lg hover:scale-125 transition-transform p-0.5 rounded-full",
                  myReaction === emoji && "bg-primary/20"
                )}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show top reactions inline */}
      {totalReactions > 0 && (
        <div className="absolute -top-0.5 -right-1 flex">
          {Object.entries(summary)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([emoji]) => (
              <span key={emoji} className="text-[10px] -ml-0.5">{emoji}</span>
            ))}
        </div>
      )}
    </div>
  );
};

export default ReactionBar;
