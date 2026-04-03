import { Trophy, Users, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  participants: number;
  reward: string;
  daysLeft: number;
  progress: number;
}

interface ChallengeCardProps {
  challenge: Challenge;
  index: number;
  onJoin?: () => void;
}

const ChallengeCard = ({ challenge, index, onJoin }: ChallengeCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-4 shadow-card hover:shadow-elevated transition-shadow"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="h-11 w-11 rounded-xl gradient-earth flex items-center justify-center text-xl shrink-0">
          {challenge.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-bold text-sm text-foreground">{challenge.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{challenge.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {challenge.participants.toLocaleString()} joined
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {challenge.daysLeft}d left
        </div>
        <Badge variant="outline" className="text-[10px] gap-1 text-kenya-gold border-kenya-gold/30">
          <Trophy className="h-3 w-3" /> {challenge.reward}
        </Badge>
      </div>

      <Progress value={challenge.progress} className="h-1.5 mb-3" />

      <Button
        size="sm"
        className="w-full rounded-full gradient-kenya text-primary-foreground font-display text-xs gap-1"
        onClick={onJoin}
      >
        Join Challenge <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </motion.div>
  );
};

export default ChallengeCard;
