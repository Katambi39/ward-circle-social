import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Loader2, Shield, MapPin } from "lucide-react";

interface OriginalPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  isVerified: boolean;
  group: string;
  groupLocality?: string;
}

interface RepostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalPost: OriginalPost;
}

const RepostDialog = ({ open, onOpenChange, originalPost }: RepostDialogProps) => {
  const { user, profile } = useAuth();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRepost = async () => {
    if (!user) {
      toast.error("You must be logged in to repost");
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      title: comment.trim() || `Repost: ${originalPost.title}`,
      content: comment.trim() || null,
      repost_of: originalPost.id,
      repost_comment: comment.trim() || null,
      is_anonymous: false,
    } as any);

    if (error) {
      toast.error("Failed to repost");
      console.error(error);
    } else {
      toast.success("Reposted to your feed!");
      setComment("");
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Quote Repost</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            placeholder="Add your thoughts (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={500}
          />

          {/* Original post preview */}
          <div className="border border-border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              {originalPost.authorAvatar ? (
                <img src={originalPost.authorAvatar} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="h-6 w-6 rounded-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-xs">
                  {originalPost.author[0]}
                </div>
              )}
              <span className="font-display font-semibold text-xs text-foreground">
                {originalPost.author}
              </span>
              {originalPost.isVerified && (
                <Shield className="h-3 w-3 text-primary fill-primary/20" />
              )}
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-secondary font-medium">{originalPost.group}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3">
              {originalPost.content || originalPost.title}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {comment.length}/500
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-full font-display">
                Cancel
              </Button>
              <Button size="sm" onClick={handleRepost} disabled={submitting} className="rounded-full font-display">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Repost
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RepostDialog;
