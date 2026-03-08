import { MapPin, Shield, Calendar, Users, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export interface NearbyItem {
  id: string;
  type: "event" | "business" | "meetup";
  name: string;
  location: string;
  distance: string;
  description: string;
  attendees?: number;
  isVerified: boolean;
  emoji: string;
}

interface NearYouCardProps {
  item: NearbyItem;
  index: number;
}

const typeIcons = {
  event: Calendar,
  business: Building2,
  meetup: Users,
};

const NearYouCard = ({ item, index }: NearYouCardProps) => {
  const Icon = typeIcons[item.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-4 shadow-card hover:shadow-elevated transition-shadow min-w-[260px] shrink-0"
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
          {item.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4 className="font-display font-bold text-sm text-foreground truncate">{item.name}</h4>
            {item.isVerified && <Shield className="h-3.5 w-3.5 text-primary fill-primary/20 shrink-0" />}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{item.location}</span>
            <span className="text-primary font-semibold">· {item.distance}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] gap-1 font-display">
              <Icon className="h-3 w-3" />
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Badge>
            {item.attendees && (
              <span className="text-[10px] text-muted-foreground">
                {item.attendees} attending
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NearYouCard;
