import { useState } from "react";
import { Bell, BellOff, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface Category {
  id: string;
  name: string;
  description: string;
  emoji: string;
  postCount: number;
  subscriberCount: number;
  gradient: string;
  isVerifiedOnly?: boolean;
}

interface CategoryCardProps {
  category: Category;
  index: number;
}

const CategoryCard = ({ category, index }: CategoryCardProps) => {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={cn(
        "relative min-w-[200px] sm:min-w-[220px] rounded-2xl p-4 text-white cursor-pointer group overflow-hidden shrink-0",
        category.gradient
      )}
    >
      {/* Decorative overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{category.emoji}</span>
          {category.isVerifiedOnly && (
            <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px] gap-1">
              <Shield className="h-3 w-3" /> Verified
            </Badge>
          )}
        </div>

        <h3 className="font-display font-bold text-sm mb-1 leading-tight">{category.name}</h3>
        <p className="text-[11px] text-white/70 line-clamp-2 mb-3">{category.description}</p>

        <div className="flex items-center justify-between">
          <div className="text-[10px] text-white/60">
            <span className="font-semibold text-white/90">{category.subscriberCount.toLocaleString()}</span> subscribers
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 rounded-full text-[11px] px-3 font-display",
              subscribed
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-white text-black hover:bg-white/90"
            )}
            onClick={(e) => { e.stopPropagation(); setSubscribed(!subscribed); }}
          >
            {subscribed ? (
              <><BellOff className="h-3 w-3 mr-1" /> Subscribed</>
            ) : (
              <><Bell className="h-3 w-3 mr-1" /> Subscribe</>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryCard;
