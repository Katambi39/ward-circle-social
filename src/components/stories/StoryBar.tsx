import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CreateStoryDialog from "./CreateStoryDialog";
import StoryViewer from "./StoryViewer";

interface StoryGroup {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  username: string;
  stories: Array<{
    id: string;
    media_url: string;
    media_type: string;
    caption: string | null;
    created_at: string;
    expires_at: string;
    music_track_id?: string | null;
    music_start_time?: number;
  }>;
  hasUnviewed: boolean;
}

const StoryBar = () => {
  const { user, profile } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [myStories, setMyStories] = useState<StoryGroup | null>(null);

  const fetchStories = async () => {
    const now = new Date().toISOString();
    const { data: stories } = await supabase
      .from("stories")
      .select("*")
      .gt("expires_at", now)
      .order("created_at", { ascending: true });

    if (!stories || stories.length === 0) {
      setStoryGroups([]);
      setMyStories(null);
      return;
    }

    const userIds = [...new Set(stories.map((s) => s.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, username")
      .in("user_id", userIds);

    // Get viewed story IDs for current user
    let viewedIds: string[] = [];
    if (user) {
      const { data: views } = await supabase
        .from("story_views")
        .select("story_id")
        .eq("viewer_id", user.id);
      viewedIds = (views || []).map((v) => v.story_id);
    }

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    const groupMap = new Map<string, StoryGroup>();
    for (const s of stories) {
      const p = profileMap.get(s.user_id);
      if (!groupMap.has(s.user_id)) {
        groupMap.set(s.user_id, {
          user_id: s.user_id,
          display_name: p?.display_name || "User",
          avatar_url: p?.avatar_url || null,
          username: p?.username || "",
          stories: [],
          hasUnviewed: false,
        });
      }
      const group = groupMap.get(s.user_id)!;
      group.stories.push({
        id: s.id,
        media_url: s.media_url,
        media_type: s.media_type,
        caption: s.caption,
        created_at: s.created_at,
        expires_at: s.expires_at,
      });
      if (!viewedIds.includes(s.id)) group.hasUnviewed = true;
    }

    const allGroups = Array.from(groupMap.values());
    const mine = user ? allGroups.find((g) => g.user_id === user.id) || null : null;
    const others = allGroups.filter((g) => g.user_id !== user?.id);
    // Sort: unviewed first
    others.sort((a, b) => (a.hasUnviewed === b.hasUnviewed ? 0 : a.hasUnviewed ? -1 : 1));

    setMyStories(mine);
    setStoryGroups(others);
  };

  useEffect(() => {
    fetchStories();
  }, [user]);

  const openViewer = (index: number) => {
    setActiveGroupIndex(index);
    setViewerOpen(true);
  };

  const allViewerGroups = [...(myStories ? [myStories] : []), ...storyGroups];

  return (
    <>
      <div className="bg-card border border-border rounded-xl shadow-card p-3 mb-4 overflow-x-auto">
        <div className="flex items-center gap-3">
          {/* Add story button / My story */}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex flex-col items-center gap-1 shrink-0 w-16"
          >
            <div className="relative">
              <div
                className={`h-14 w-14 rounded-full overflow-hidden border-2 ${
                  myStories?.hasUnviewed
                    ? "border-primary"
                    : "border-border"
                }`}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-lg">
                    {profile?.display_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                <Plus className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <span className="text-[10px] font-display text-muted-foreground truncate w-full text-center">
              Add Story
            </span>
          </button>

          {/* View my stories */}
          {myStories && (
            <button
              onClick={() => openViewer(0)}
              className="flex flex-col items-center gap-1 shrink-0 w-16"
            >
              <div className={`h-14 w-14 rounded-full overflow-hidden border-2 ${myStories.hasUnviewed ? "border-primary ring-2 ring-primary/30" : "border-secondary"}`}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-lg">
                    {profile?.display_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-display text-muted-foreground truncate w-full text-center">
                Your Story
              </span>
            </button>
          )

          {/* Other users' stories */}
          {storyGroups.map((group, i) => (
            <button
              key={group.user_id}
              onClick={() => openViewer(myStories ? i + 1 : i)}
              className="flex flex-col items-center gap-1 shrink-0 w-16"
            >
              <div
                className={`h-14 w-14 rounded-full overflow-hidden border-2 ${
                  group.hasUnviewed
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-muted"
                }`}
              >
                {group.avatar_url ? (
                  <img src={group.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground font-display font-bold text-lg">
                    {group.display_name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-display text-muted-foreground truncate w-full text-center">
                {group.display_name.split(" ")[0]}
              </span>
            </button>
          ))}

          {/* Empty state add button if no stories at all */}
          {!myStories && storyGroups.length === 0 && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex flex-col items-center gap-1 shrink-0 w-16"
            >
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Plus className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <span className="text-[10px] font-display text-muted-foreground">Share</span>
            </button>
          )}
        </div>
      </div>

      <CreateStoryDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchStories} />

      {viewerOpen && allViewerGroups.length > 0 && (
        <StoryViewer
          groups={allViewerGroups}
          initialGroupIndex={activeGroupIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
};

export default StoryBar;
