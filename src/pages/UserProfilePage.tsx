import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import PostCard from "@/components/feed/PostCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DbPost } from "@/hooks/usePosts";
import StartChatButton from "@/components/messages/StartChatButton";
import {
  ArrowLeft, CheckCircle2, Shield, MapPin, Users, FileText, UserPlus, UserMinus, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface PublicProfile {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  county: string | null;
  ward: string | null;
  verification_status: string;
  created_at: string;
}

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (username) fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    const { data: p } = await supabase.from("profiles")
      .select("*")
      .eq("username", username!)
      .single();
    if (!p) { setLoading(false); return; }
    setProfile(p as unknown as PublicProfile);

    // Fetch posts
    const { data: postsData } = await supabase.from("posts")
      .select("*, groups(name, location)")
      .eq("user_id", (p as any).user_id)
      .eq("is_anonymous", false)
      .order("created_at", { ascending: false })
      .limit(20);

    const mapped: DbPost[] = (postsData || []).map((post: any) => ({
      ...post,
      author_name: (p as any).display_name,
      author_username: (p as any).username,
      author_avatar: (p as any).avatar_url,
      author_verified: (p as any).verification_status === "verified",
      group_name: post.groups?.name || null,
      group_location: post.groups?.location || null,
    }));
    setPosts(mapped);

    // Counts
    const [{ count: fc }, { count: fgc }] = await Promise.all([
      supabase.from("connections").select("*", { count: "exact", head: true }).eq("following_id", (p as any).user_id),
      supabase.from("connections").select("*", { count: "exact", head: true }).eq("follower_id", (p as any).user_id),
    ]);
    setFollowerCount(fc || 0);
    setFollowingCount(fgc || 0);

    // Check if following
    if (user) {
      const { data: conn } = await supabase.from("connections")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", (p as any).user_id)
        .maybeSingle();
      setIsFollowing(!!conn);
    }

    setLoading(false);
  };

  const toggleFollow = async () => {
    if (!user || !profile) return;
    setToggling(true);
    if (isFollowing) {
      await supabase.from("connections").delete().eq("follower_id", user.id).eq("following_id", profile.user_id);
      setIsFollowing(false);
      setFollowerCount((c) => c - 1);
    } else {
      await supabase.from("connections").insert({ follower_id: user.id, following_id: profile.user_id });
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
    }
    setToggling(false);
  };

  const isOwn = user?.id === profile?.user_id;

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-6 px-4 space-y-4 animate-pulse">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-16 bg-muted rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <p className="font-display text-lg text-muted-foreground">User not found</p>
          <Button variant="outline" onClick={() => navigate("/")} className="mt-4 rounded-full font-display">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  const verified = profile.verification_status === "verified";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full font-display gap-1 text-muted-foreground -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl shadow-card overflow-hidden"
        >
          {/* Cover */}
          <div className="h-28 bg-gradient-to-br from-primary/20 to-secondary/20 relative">
            {profile.cover_url && <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />}
          </div>

          <div className="px-5 pb-5">
            <div className="flex items-end gap-4 -mt-10">
              <div className="h-20 w-20 rounded-full border-4 border-card overflow-hidden bg-muted flex-shrink-0 relative">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-2xl">
                    {profile.display_name[0]?.toUpperCase()}
                  </div>
                )}
                {verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                    <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-1.5">
                  {profile.display_name}
                  {verified && <Shield className="h-4 w-4 text-primary" />}
                </h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
            </div>

            {profile.bio && <p className="text-sm text-muted-foreground mt-3">{profile.bio}</p>}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
              {profile.county && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.ward ? `${profile.ward}, ` : ""}{profile.county}</span>
              )}
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {followerCount} followers</span>
              <span>{followingCount} following</span>
            </div>

            {!isOwn && (
              <div className="flex items-center gap-2 mt-4">
                <Button
                  onClick={toggleFollow}
                  disabled={toggling}
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className={`rounded-xl font-display gap-1.5 flex-1 ${!isFollowing ? "gradient-kenya text-primary-foreground" : ""}`}
                >
                  {isFollowing ? <><UserMinus className="h-4 w-4" /> Unfollow</> : <><UserPlus className="h-4 w-4" /> Follow</>}
                </Button>
                <StartChatButton targetUserId={profile.user_id} label="Message" />
              </div>
            )}
            {isOwn && (
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="mt-4 rounded-xl font-display w-full">
                Edit Profile
              </Button>
            )}
          </div>
        </motion.div>

        {/* Posts */}
        <div>
          <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-primary" /> Posts ({posts.length})
          </h3>
          {posts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8 font-display">No public posts yet</p>
          ) : (
            <div className="space-y-3">
              {posts.map((p, i) => (
                <PostCard key={p.id} dbPost={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default UserProfilePage;
