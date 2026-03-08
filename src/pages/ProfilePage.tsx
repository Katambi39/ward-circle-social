import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserCircle, FileText, Users, ShoppingBag } from "lucide-react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileAboutTab from "@/components/profile/ProfileAboutTab";
import ProfilePostsTab from "@/components/profile/ProfilePostsTab";
import ProfileConnectionsTab from "@/components/profile/ProfileConnectionsTab";
import ProfileListingsTab from "@/components/profile/ProfileListingsTab";

const ProfilePage = () => {
  const { profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postCount, setPostCount] = useState(0);

  if (!profile) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-muted animate-pulse mx-auto mb-4" />
          <div className="h-5 w-48 bg-muted animate-pulse mx-auto rounded" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
        <ProfileHeader
          onEditClick={() => setEditing(true)}
          editing={editing}
          followerCount={followerCount}
          followingCount={followingCount}
          postCount={postCount}
        />

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full bg-card border border-border rounded-xl p-1 shadow-card">
            <TabsTrigger
              value="about"
              className="flex-1 rounded-lg font-display text-xs gap-1.5 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground"
            >
              <UserCircle className="h-4 w-4" /> About
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="flex-1 rounded-lg font-display text-xs gap-1.5 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-4 w-4" /> Posts
            </TabsTrigger>
            <TabsTrigger
              value="connections"
              className="flex-1 rounded-lg font-display text-xs gap-1.5 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4" /> Connections
            </TabsTrigger>
            <TabsTrigger
              value="listings"
              className="flex-1 rounded-lg font-display text-xs gap-1.5 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground"
            >
              <ShoppingBag className="h-4 w-4" /> Listings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4">
            <ProfileAboutTab
              editing={editing}
              onCancel={() => setEditing(false)}
              onSaved={() => setEditing(false)}
            />
          </TabsContent>

          <TabsContent value="posts" className="mt-4">
            <ProfilePostsTab onPostCountChange={setPostCount} />
          </TabsContent>

          <TabsContent value="connections" className="mt-4">
            <ProfileConnectionsTab
              onCountsChange={(f, fg) => { setFollowerCount(f); setFollowingCount(fg); }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
