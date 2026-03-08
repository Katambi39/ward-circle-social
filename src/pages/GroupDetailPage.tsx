import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import PostCard from "@/components/feed/PostCard";
import CreatePostBar from "@/components/feed/CreatePostBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Shield, Users, MapPin, Crown, MessageSquare, FileText, Settings, Pin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { DbPost } from "@/hooks/usePosts";

const GroupDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch group
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch membership
  const { data: membership, refetch: refetchMembership } = useQuery({
    queryKey: ["group-membership", group?.id, user?.id],
    enabled: !!group && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", group!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // Fetch members with profiles (separate queries since no FK)
  const { data: members = [] } = useQuery({
    queryKey: ["group-members", group?.id],
    enabled: !!group,
    queryFn: async () => {
      const { data: memberRows, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", group!.id)
        .order("joined_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      if (!memberRows || memberRows.length === 0) return [];

      const userIds = memberRows.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, verification_status")
        .in("user_id", userIds);

      const profilesMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });

      return memberRows.map((m: any) => ({
        ...m,
        profiles: profilesMap[m.user_id] || null,
      }));
    },
  });

  // Fetch group posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["group-posts", group?.id],
    enabled: !!group,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, groups(name, location)")
        .eq("group_id", group!.id)
        .eq("moderation_status", "approved")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      // Map to DbPost format
      const userIds = [...new Set((data || []).map((p: any) => p.user_id))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url, verification_status")
          .in("user_id", userIds);
        (profiles || []).forEach((p: any) => {
          profilesMap[p.user_id] = p;
        });
      }

      return (data || []).map((post: any) => {
        const profile = profilesMap[post.user_id];
        return {
          ...post,
          author_name: profile?.display_name || "Unknown",
          author_username: profile?.username || "unknown",
          author_avatar: profile?.avatar_url || null,
          author_verified: profile?.verification_status === "verified",
          group_name: post.groups?.name || null,
          group_location: post.groups?.location || null,
        } as DbPost;
      });
    },
  });

  // Realtime subscription for group posts
  useEffect(() => {
    if (!group?.id) return;
    const channel = supabase
      .channel(`group-posts-${group.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts", filter: `group_id=eq.${group.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["group-posts", group.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [group?.id, queryClient]);

  const handleJoin = async () => {
    if (!user || !group) return;
    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
      });
      if (error) throw error;
      toast({ title: "Joined!", description: `You joined ${group.name}` });
      refetchMembership();
      queryClient.invalidateQueries({ queryKey: ["group-members", group.id] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleLeave = async () => {
    if (!user || !group) return;
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Left group", description: `You left ${group.name}` });
      refetchMembership();
      queryClient.invalidateQueries({ queryKey: ["group-members", group.id] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const typeLabels: Record<string, string> = {
    ward: "Ward",
    county: "County",
    location: "Constituency",
    community: "Community",
    interest: "Interest",
    page: "Page",
  };

  if (groupLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-display font-semibold text-foreground">Group not found</p>
          <Button variant="outline" className="mt-4 rounded-full font-display" onClick={() => navigate("/groups")}>
            Back to Groups
          </Button>
        </div>
      </AppLayout>
    );
  }

  const localityLabel = [group.ward, group.county, group.location].filter(Boolean).join(" · ");

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-4 px-4">
        {/* Header */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 rounded-full font-display gap-1.5 text-muted-foreground"
          onClick={() => navigate("/groups")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Groups
        </Button>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          {/* Banner */}
          <div className="h-32 gradient-kenya relative">
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          </div>

          <div className="px-5 pb-5 -mt-10 relative">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl gradient-kenya border-4 border-card flex items-center justify-center text-primary-foreground shadow-elevated">
                <Users className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-xl font-bold text-foreground truncate">{group.name}</h1>
                  {group.is_verified && <Shield className="h-5 w-5 text-primary shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0 font-display">
                    {typeLabels[group.group_type] || group.group_type}
                  </Badge>
                  {group.is_locality_restricted && (
                    <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0 font-display border-secondary text-secondary">
                      Restricted
                    </Badge>
                  )}
                </div>
              </div>
              <div className="shrink-0 pb-1">
                {membership ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full font-display text-xs"
                    onClick={handleLeave}
                  >
                    {membership.role === "admin" ? "Admin" : "Joined"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="rounded-full gradient-kenya text-primary-foreground font-display text-xs"
                    onClick={handleJoin}
                  >
                    Join Group
                  </Button>
                )}
              </div>
            </div>

            {group.description && (
              <p className="text-sm text-muted-foreground mt-3">{group.description}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {members.length} members
              </span>
              {localityLabel && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {localityLabel}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> {posts.length} posts
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="mt-4">
          <TabsList className="bg-muted w-full justify-start gap-1 h-auto p-1">
            <TabsTrigger value="posts" className="rounded-full text-xs font-display gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="h-3.5 w-3.5" /> Posts
            </TabsTrigger>
            <TabsTrigger value="members" className="rounded-full text-xs font-display gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-3.5 w-3.5" /> Members
            </TabsTrigger>
            <TabsTrigger value="about" className="rounded-full text-xs font-display gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-3.5 w-3.5" /> About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-3">
            {membership && (
              <CreatePostBar groupId={group.id} groupName={group.name} />
            )}

            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="font-display font-semibold text-foreground text-sm">No posts yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {membership ? "Be the first to post in this group!" : "Join the group to start posting."}
                </p>
              </div>
            ) : (
              posts.map((post, idx) => {
                const canPin = membership?.role === "moderator";
                return (
                  <div key={post.id} className="relative">
                    {(post as any).is_pinned && (
                      <div className="flex items-center gap-1 text-xs text-primary font-display font-semibold px-4 pt-2">
                        <Pin className="h-3 w-3" /> Pinned
                      </div>
                    )}
                    <PostCard dbPost={post} index={idx} />
                    {canPin && (
                      <div className="absolute top-2 right-12">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary"
                          title={(post as any).is_pinned ? "Unpin post" : "Pin post"}
                          onClick={async () => {
                            const newPinned = !(post as any).is_pinned;
                            await supabase.from("posts").update({ is_pinned: newPinned } as any).eq("id", post.id);
                            queryClient.invalidateQueries({ queryKey: ["group-posts", group!.id] });
                          }}
                        >
                          <Pin className={`h-3.5 w-3.5 ${(post as any).is_pinned ? "text-primary fill-primary" : ""}`} />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="font-display font-semibold text-foreground text-sm">No members yet</p>
                </div>
              ) : (
                members.map((member: any) => {
                  const profile = member.profiles;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => profile?.username && navigate(`/user/${profile.username}`)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="gradient-kenya text-primary-foreground text-sm font-display">
                          {(profile?.display_name || "?")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-semibold text-sm text-foreground truncate">
                            {profile?.display_name || "Unknown"}
                          </span>
                          {profile?.verification_status === "verified" && (
                            <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          @{profile?.username || "unknown"}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {member.role === "admin" && (
                          <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0 font-display gap-1">
                            <Crown className="h-3 w-3" /> Admin
                          </Badge>
                        )}
                        {member.role === "moderator" && (
                          <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0 font-display gap-1">
                            <Shield className="h-3 w-3" /> Mod
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div>
                <h3 className="font-display font-bold text-foreground text-sm mb-1">About</h3>
                <p className="text-sm text-muted-foreground">
                  {group.description || "No description provided."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-display">Type</p>
                  <p className="font-display font-semibold text-sm text-foreground">
                    {typeLabels[group.group_type] || group.group_type}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-display">Members</p>
                  <p className="font-display font-semibold text-sm text-foreground">{members.length}</p>
                </div>
                {group.county && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground font-display">County</p>
                    <p className="font-display font-semibold text-sm text-foreground">{group.county}</p>
                  </div>
                )}
                {group.ward && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground font-display">Ward</p>
                    <p className="font-display font-semibold text-sm text-foreground">{group.ward}</p>
                  </div>
                )}
                {group.location && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground font-display">Constituency</p>
                    <p className="font-display font-semibold text-sm text-foreground">{group.location}</p>
                  </div>
                )}
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-display">Created</p>
                  <p className="font-display font-semibold text-sm text-foreground">
                    {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {group.is_locality_restricted && (
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
                  <p className="text-xs text-secondary font-display font-semibold flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Locality Restricted
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Membership may be restricted to residents of this locality.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default GroupDetailPage;
