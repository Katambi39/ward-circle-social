import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAnonymous } from "@/contexts/AnonymousContext";
import AppLayout from "@/components/layout/AppLayout";
import PostCard, { PostData } from "@/components/feed/PostCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import IdentityToggle from "@/components/feed/IdentityToggle";
import { EyeOff, Send, AlertTriangle, Shield, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const ToboaSiriPage = () => {
  const { user, profile } = useAuth();
  const { anonAlias } = useAnonymous();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["toboa-siri-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_anonymous", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("posts").insert({
        title: title.trim(),
        content: content.trim() || null,
        is_anonymous: true,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      setShowForm(false);
      toast({ title: "Secret shared", description: "Your anonymous post is live." });
      queryClient.invalidateQueries({ queryKey: ["toboa-siri-posts"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const mappedPosts: PostData[] = posts.map((p) => ({
    id: p.id,
    author: "Anonymous",
    group: "Toboa Siri",
    timeAgo: getTimeAgo(p.created_at),
    title: p.title,
    content: p.content || "",
    upvotes: p.upvotes,
    comments: p.comment_count,
    shares: p.share_count,
    isVerified: false,
    isAnonymous: true,
  }));

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-full mb-3">
            <EyeOff className="h-5 w-5" />
            <span className="font-display font-bold text-lg">Toboa Siri</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Share secrets anonymously. Your identity is completely hidden — no names, no profiles, no traces. Speak truth to power.
          </p>
        </motion.div>

        {/* Warning Banner */}
        <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <span className="font-display font-semibold text-foreground">Community Guidelines:</span>{" "}
            Anonymous posts are moderated. No personal attacks, doxxing, or false accusations. Report abuse to keep this space safe.
          </div>
        </div>

        {/* Create Anonymous Post */}
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-card border border-border rounded-xl shadow-card p-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center text-background font-display font-bold text-sm">
                ?
              </div>
              <span className="text-sm font-display text-muted-foreground">
                Posting as <span className="font-semibold text-foreground">Anonymous</span>
              </span>
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your secret a title..."
              className="mb-2 rounded-lg border-muted bg-muted"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Spill the tea... Your identity is protected."
              className="rounded-lg resize-none border-muted bg-muted mb-3"
              rows={4}
            />
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                className="rounded-full text-muted-foreground font-display"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-display gap-1.5"
                onClick={() => createPost.mutate()}
                disabled={!title.trim() || createPost.isPending}
              >
                <Send className="h-3.5 w-3.5" />
                {createPost.isPending ? "Posting..." : "Share Anonymously"}
              </Button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-card border border-dashed border-border rounded-xl p-4 mb-4 hover:border-foreground/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center text-background font-display font-bold">
                ?
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Share a secret anonymously...
              </span>
            </div>
          </button>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-secondary" />
            {posts.length} secrets shared
          </span>
          <span className="flex items-center gap-1">
            <EyeOff className="h-3.5 w-3.5" />
            All identities protected
          </span>
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : mappedPosts.length === 0 ? (
          <div className="text-center py-16">
            <EyeOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold text-foreground">No secrets yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to share anonymously</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mappedPosts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default ToboaSiriPage;
