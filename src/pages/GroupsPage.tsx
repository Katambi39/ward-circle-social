import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import GroupCard from "@/components/groups/GroupCard";
import CreateGroupDialog from "@/components/groups/CreateGroupDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MapPin, Building2, Users, Flame } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";

const GroupsPage = () => {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: groups = [], isLoading, refetch } = useQuery({
    queryKey: ["groups", activeTab, search],
    queryFn: async () => {
      let query = supabase.from("groups").select("*").order("member_count", { ascending: false });

      if (activeTab === "ward") query = query.eq("group_type", "ward");
      else if (activeTab === "county") query = query.eq("group_type", "county");
      else if (activeTab === "community") query = query.in("group_type", ["community", "interest"]);
      else if (activeTab === "location") query = query.eq("group_type", "location");

      if (search.trim()) query = query.ilike("name", `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data as Tables<"groups">[];
    },
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Groups</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Join locality groups or create your own community
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-full gradient-kenya text-primary-foreground font-display gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Group
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted border-none rounded-full"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="bg-muted w-full justify-start gap-1 h-auto p-1 flex-wrap">
            <TabsTrigger value="all" className="rounded-full text-xs font-display gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Flame className="h-3.5 w-3.5" /> All
            </TabsTrigger>
            <TabsTrigger value="ward" className="rounded-full text-xs font-display gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MapPin className="h-3.5 w-3.5" /> Ward
            </TabsTrigger>
            <TabsTrigger value="county" className="rounded-full text-xs font-display gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building2 className="h-3.5 w-3.5" /> County
            </TabsTrigger>
            <TabsTrigger value="location" className="rounded-full text-xs font-display gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MapPin className="h-3.5 w-3.5" /> Location
            </TabsTrigger>
            <TabsTrigger value="community" className="rounded-full text-xs font-display gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-3.5 w-3.5" /> Community
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold text-foreground">No groups found</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to create one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} onJoined={refetch} />
            ))}
          </div>
        )}

        <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />
      </div>
    </AppLayout>
  );
};

export default GroupsPage;
