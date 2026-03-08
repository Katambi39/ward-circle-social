import { useState } from "react";
import { Image, Link2, BarChart3, Smile, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAnonymous } from "@/contexts/AnonymousContext";
import CreatePostDialog from "./CreatePostDialog";

export type PostDialogIntent = "default" | "photo" | "video" | "link" | "poll" | "feeling";

const CreatePostBar = ({ groupId, groupName }: { groupId?: string; groupName?: string }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [intent, setIntent] = useState<PostDialogIntent>("default");
  const { profile } = useAuth();
  const { isAnonymous, anonAlias } = useAnonymous();

  const openWith = (i: PostDialogIntent) => {
    setIntent(i);
    setDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setIntent("default");
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl shadow-card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden shrink-0">
            {!isAnonymous && profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold">
                {isAnonymous ? "?" : (profile?.display_name?.[0]?.toUpperCase() || "U")}
              </div>
            )}
          </div>
          <button
            onClick={() => openWith("default")}
            className="flex-1 h-10 px-4 rounded-full bg-muted text-muted-foreground text-sm text-left hover:bg-muted/80 transition-colors"
          >
            {isAnonymous
              ? `Posting as ${anonAlias}... What's happening?`
              : "What's on your mind? Share with your community..."}
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1 rounded-full px-2 sm:px-3 sm:gap-1.5" onClick={() => openWith("photo")}>
            <Image className="h-4 w-4 text-primary" />
            <span className="text-[10px] sm:text-xs font-display">Photo</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-secondary gap-1 rounded-full px-2 sm:px-3 sm:gap-1.5" onClick={() => openWith("video")}>
            <Video className="h-4 w-4 text-secondary" />
            <span className="text-[10px] sm:text-xs font-display">Video</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-secondary gap-1 rounded-full px-2 sm:px-3 sm:gap-1.5" onClick={() => openWith("link")}>
            <Link2 className="h-4 w-4 text-secondary" />
            <span className="text-[10px] sm:text-xs font-display">Link</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent gap-1 rounded-full px-2 sm:px-3 sm:gap-1.5" onClick={() => openWith("poll")}>
            <BarChart3 className="h-4 w-4 text-accent" />
            <span className="text-[10px] sm:text-xs font-display">Poll</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-kenya-gold gap-1 rounded-full px-2 sm:px-3 sm:gap-1.5" onClick={() => openWith("feeling")}>
            <Smile className="h-4 w-4 text-kenya-gold" />
            <span className="text-[10px] sm:text-xs font-display">Feeling</span>
          </Button>
        </div>
      </div>
      <CreatePostDialog open={dialogOpen} onOpenChange={handleOpenChange} intent={intent} groupId={groupId} groupName={groupName} />
    </>
  );
};

export default CreatePostBar;
