import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, UserMinus, Shield, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface ConnectionProfile {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  verification_status: string;
  county: string | null;
}

interface ProfileConnectionsTabProps {
  onCountsChange: (followers: number, following: number) => void;
}

const ProfileConnectionsTab = ({ onCountsChange }: ProfileConnectionsTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followers, setFollowers] = useState<ConnectionProfile[]>([]);
  const [following, setFollowing] = useState<ConnectionProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = async () => {
    if (!user) return;

    // Fetch followers (people following me)
    const { data: followerRows } = await supabase
      .from("connections")
      .select("follower_id")
      .eq("following_id", user.id);

    // Fetch following (people I follow)
    const { data: followingRows } = await supabase
      .from("connections")
      .select("following_id")
      .eq("follower_id", user.id);

    const followerIds = (followerRows || []).map((r: any) => r.follower_id);
    const followingIds = (followingRows || []).map((r: any) => r.following_id);

    // Fetch profiles
    if (followerIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, display_name, username, avatar_url, verification_status, county").in("user_id", followerIds);
      setFollowers((data as ConnectionProfile[]) || []);
    } else {
      setFollowers([]);
    }

    if (followingIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, display_name, username, avatar_url, verification_status, county").in("user_id", followingIds);
      setFollowing((data as ConnectionProfile[]) || []);
    } else {
      setFollowing([]);
    }

    onCountsChange(followerIds.length, followingIds.length);
    setLoading(false);
  };

  useEffect(() => {
    fetchConnections();
  }, [user]);

  const handleUnfollow = async (targetId: string) => {
    if (!user) return;
    const { error } = await supabase.from("connections").delete().eq("follower_id", user.id).eq("following_id", targetId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Unfollowed" });
    fetchConnections();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-card animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-32 mb-1" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Find mutual connections
  const followerIds = new Set(followers.map(f => f.user_id));
  const mutualConnections = following.filter(f => followerIds.has(f.user_id));

  return (
    <Tabs defaultValue="followers" className="w-full">
      <TabsList className="w-full bg-muted/50 rounded-xl p-1 mb-4">
        <TabsTrigger value="followers" className="flex-1 rounded-lg font-display text-xs data-[state=active]:bg-card data-[state=active]:shadow-card">
          Followers ({followers.length})
        </TabsTrigger>
        <TabsTrigger value="following" className="flex-1 rounded-lg font-display text-xs data-[state=active]:bg-card data-[state=active]:shadow-card">
          Following ({following.length})
        </TabsTrigger>
        <TabsTrigger value="mutual" className="flex-1 rounded-lg font-display text-xs data-[state=active]:bg-card data-[state=active]:shadow-card">
          Mutual ({mutualConnections.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="followers">
        <ConnectionList profiles={followers} type="followers" />
      </TabsContent>

      <TabsContent value="following">
        <ConnectionList profiles={following} type="following" onUnfollow={handleUnfollow} />
      </TabsContent>

      <TabsContent value="mutual">
        <ConnectionList profiles={mutualConnections} type="mutual" />
      </TabsContent>
    </Tabs>
  );
};

const ConnectionList = ({
  profiles,
  type,
  onUnfollow,
}: {
  profiles: ConnectionProfile[];
  type: "followers" | "following" | "mutual";
  onUnfollow?: (userId: string) => void;
}) => {
  if (profiles.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 shadow-card text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display font-bold text-foreground mb-1">
          No {type} yet
        </h3>
        <p className="text-sm text-muted-foreground">
          {type === "followers" ? "When people Konect with you, they'll appear here." : "Start connecting with the community!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {profiles.map((p, i) => (
        <motion.div
          key={p.user_id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="bg-card border border-border rounded-xl p-4 shadow-card flex items-center gap-3"
        >
          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                {p.display_name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            {p.verification_status === "verified" && (
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center border border-card">
                <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-foreground flex items-center gap-1 truncate">
              {p.display_name}
              {p.verification_status === "verified" && <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
            </p>
            <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
          </div>

          {p.county && (
            <Badge variant="outline" className="text-xs font-display rounded-full hidden sm:flex">
              {p.county}
            </Badge>
          )}

          {type === "following" && onUnfollow && (
            <Button variant="ghost" size="sm" onClick={() => onUnfollow(p.user_id)} className="rounded-full text-xs font-display gap-1 text-muted-foreground hover:text-accent">
              <UserMinus className="h-3.5 w-3.5" /> Unfollow
            </Button>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default ProfileConnectionsTab;
