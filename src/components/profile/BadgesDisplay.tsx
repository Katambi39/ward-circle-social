import { useBadges, useAllBadges } from "@/hooks/useBadges";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BadgesDisplayProps {
  userId: string;
  compact?: boolean;
}

const BadgesDisplay = ({ userId, compact = false }: BadgesDisplayProps) => {
  const { badges, loading } = useBadges(userId);
  const allBadges = useAllBadges();

  if (loading) return null;

  if (compact) {
    if (badges.length === 0) return null;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {badges.slice(0, 5).map((badge) => (
          <Tooltip key={badge.id}>
            <TooltipTrigger>
              <span className="text-base cursor-default">{badge.icon}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-display font-semibold text-xs">{badge.name}</p>
              {badge.description && <p className="text-[10px] text-muted-foreground">{badge.description}</p>}
            </TooltipContent>
          </Tooltip>
        ))}
        {badges.length > 5 && (
          <span className="text-xs text-muted-foreground font-display">+{badges.length - 5}</span>
        )}
      </div>
    );
  }

  const earnedIds = new Set(badges.map((b) => b.name));

  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold text-foreground">Badges & Achievements</h3>
      
      {badges.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-display font-medium">Earned ({badges.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {badges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-2xl">{badge.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-display font-semibold text-foreground truncate">{badge.name}</p>
                  {badge.description && (
                    <p className="text-[10px] text-muted-foreground truncate">{badge.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {allBadges.filter((b) => !earnedIds.has(b.name)).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-display font-medium">Locked</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allBadges
              .filter((b) => !earnedIds.has(b.name))
              .map((badge) => (
                <div key={badge.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border opacity-50">
                  <span className="text-2xl grayscale">{badge.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-display font-semibold text-muted-foreground truncate">{badge.name}</p>
                    {badge.description && (
                      <p className="text-[10px] text-muted-foreground truncate">{badge.description}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgesDisplay;
