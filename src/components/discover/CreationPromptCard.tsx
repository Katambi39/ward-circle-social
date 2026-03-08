import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export interface CreationPrompt {
  id: string;
  title: string;
  description: string;
  emoji: string;
  action: string;
  gradient: string;
}

interface CreationPromptCardProps {
  prompt: CreationPrompt;
  index: number;
}

const CreationPromptCard = ({ prompt, index }: CreationPromptCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`relative rounded-2xl p-4 min-w-[200px] shrink-0 overflow-hidden cursor-pointer group ${prompt.gradient}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
      <div className="relative z-10">
        <span className="text-2xl mb-2 block">{prompt.emoji}</span>
        <h4 className="font-display font-bold text-sm text-white mb-1">{prompt.title}</h4>
        <p className="text-[11px] text-white/70 mb-3 line-clamp-2">{prompt.description}</p>
        <Button
          size="sm"
          className="h-7 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-display gap-1"
        >
          <Sparkles className="h-3 w-3" />
          {prompt.action}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
};

export default CreationPromptCard;
