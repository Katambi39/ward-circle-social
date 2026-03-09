import { useState } from "react";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserCircle, FileText, Users, ShoppingBag, Award, Bookmark } from "lucide-react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileAboutTab from "@/components/profile/ProfileAboutTab";
import ProfilePostsTab from "@/components/profile/ProfilePostsTab";
import ProfileConnectionsTab from "@/components/profile/ProfileConnectionsTab";
import ProfileListingsTab from "@/components/profile/ProfileListingsTab";
import BadgesDisplay from "@/components/profile/BadgesDisplay";
import SavedPostsTab from "@/components/profile/SavedPostsTab";

const ProfilePage = () => {
  const { profile, user } = useAuth();
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
      <SEO title="Profile" description="Your profile on Conect. Manage your posts, connections, and listings." path="/profile" />
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
        <ProfileHeader
          onEditClick={() => setEditing(true)}
          editing={editing}
          followerCount={followerCount}
          followingCount={followingCount}
          postCount={postCount}
        />

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full bg-card border border-border rounded-xl p-1 shadow-card flex-wrap h-auto gap-0.5">
            <TabsTrigger
              value="about"
              className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground min-w-0"
            >
              <UserCircle className="h-3.5 w-3.5" /> About
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground min-w-0"
            >
              <FileText className="h-3.5 w-3.5" /> Posts
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground min-w-0"
            >
              <Bookmark className="h-3.5 w-3.5" /> Saved
            </TabsTrigger>
            <TabsTrigger
              value="badges"
              className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground min-w-0"
            >
              <Award className="h-3.5 w-3.5" /> Badges
            </TabsTrigger>
            <TabsTrigger
              value="connections"
              className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground min-w-0"
            >
              <Users className="h-3.5 w-3.5" /> Konects
            </TabsTrigger>
            <TabsTrigger
              value="listings"
              className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground min-w-0"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Listings
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

          <TabsContent value="saved" className="mt-4">
            <SavedPostsTab />
          </TabsContent>

          <TabsContent value="badges" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-card">
              {user && <BadgesDisplay userId={user.id} />}
            </div>
          </TabsContent>

          <TabsContent value="listings" className="mt-4">
            <ProfileListingsTab />
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
