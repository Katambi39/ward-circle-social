import AppLayout from "@/components/layout/AppLayout";
import CreatePostBar from "@/components/feed/CreatePostBar";
import FeedTabs from "@/components/feed/FeedTabs";
import PostCard from "@/components/feed/PostCard";
import { mockPosts } from "@/data/mockPosts";

const Index = () => {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-4 px-4">
        <FeedTabs />
        <CreatePostBar />
        <div className="space-y-3">
          {mockPosts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
