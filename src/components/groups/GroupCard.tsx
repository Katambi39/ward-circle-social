import { useState } from "react";
import { MapPin, Building2, Users, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface GroupCardProps {
  group: Tables<"groups">;
  onJoined?: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  ward: <MapPin className="h-4 w-4" />,
  county: <Building2 className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  community: <Users className="h-4 w-4" />,
  interest: <Users className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  ward: "Ward",
  county: "County",
  location: "Location",
  community: "Community",
  interest: "Interest",
  page: "Page",
};

const GroupCard = ({ group, onJoined }: GroupCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [joining, setJoining] = useState(false);

  const { data: membership, refetch: refetchMembership } = useQuery({
    queryKey: ["group-membership", group.id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", group.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
      });
      if (error) throw error;
      toast({ title: "Joined!", description: `You joined ${group.name}` });
      refetchMembership();
      onJoined?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Left group", description: `You left ${group.name}` });
      refetchMembership();
      onJoined?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const localityLabel = [group.ward, group.county, group.location].filter(Boolean).join(" · ");

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card hover:shadow-elevated transition-shadow">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl gradient-kenya flex items-center justify-center text-primary-foreground shrink-0">
          {typeIcons[group.group_type] || <Users className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-foreground truncate">{group.name}</h3>
            {group.is_verified && (
              <Shield className="h-4 w-4 text-primary shrink-0" />
            )}
            <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0 font-display">
              {typeLabels[group.group_type] || group.group_type}
            </Badge>
            {group.is_locality_restricted && (
              <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0 font-display border-secondary text-secondary">
                Restricted
              </Badge>
            )}
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{group.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {group.member_count} members
            </span>
            {localityLabel && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {localityLabel}
              </span>
            )}
            {membership?.role === "admin" && (
              <span className="flex items-center gap-1 text-secondary">
                <Crown className="h-3.5 w-3.5" /> Admin
              </span>
            )}
            {membership?.role === "moderator" && (
              <span className="flex items-center gap-1 text-secondary">
                <Shield className="h-3.5 w-3.5" /> Moderator
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {membership ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full font-display text-xs"
              onClick={handleLeave}
              disabled={joining}
            >
              {membership.role === "admin" ? "Admin" : "Joined"}
            </Button>
          ) : (
            <Button
              size="sm"
              className="rounded-full gradient-kenya text-primary-foreground font-display text-xs"
              onClick={handleJoin}
              disabled={joining}
            >
              Join
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
