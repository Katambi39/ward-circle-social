import { useState, useRef } from "react";
import SEO from "@/components/SEO";
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
import { EyeOff, Send, AlertTriangle, Shield, TrendingUp, Paperclip, X, FileText, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "video/mp4",
  "audio/mpeg", "audio/mp4",
];

const ToboaSiriPage = () => {
  const { user, profile } = useAuth();
  const { anonAlias } = useAnonymous();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid: File[] = [];

    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB limit`, variant: "destructive" });
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({ title: "Unsupported type", description: `${file.name} is not supported. Use images, PDFs, or media files.`, variant: "destructive" });
        continue;
      }
      valid.push(file);
    }

    setFiles((prev) => [...prev, ...valid].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string | null> => {
    if (files.length === 0 || !user) return null;

    // Upload first file as the post image (single image_url field)
    const file = files[0];
    const ext = file.name.split(".").pop() || "bin";
    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("toboa-siri-files")
      .upload(filePath, file, { contentType: file.type });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("toboa-siri-files")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const createPost = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      setUploading(true);

      let imageUrl: string | null = null;
      if (files.length > 0) {
        imageUrl = await uploadFiles();
      }

      const { error } = await supabase.from("posts").insert({
        title: title.trim() || "Anonymous Post",
        content: content.trim() || null,
        is_anonymous: true,
        user_id: user.id,
        image_url: imageUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      setFiles([]);
      setShowForm(false);
      setUploading(false);
      toast({ title: "Secret shared", description: "Your anonymous post is live." });
      queryClient.invalidateQueries({ queryKey: ["toboa-siri-posts"] });
    },
    onError: (e: Error) => {
      setUploading(false);
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
    image: p.image_url || undefined,
    upvotes: p.upvotes,
    comments: p.comment_count,
    shares: p.share_count,
    isVerified: false,
    isAnonymous: true,
  }));

  const isImage = (file: File) => file.type.startsWith("image/");

  return (
    <AppLayout>
      <SEO title="Toboa Siri" description="Share secrets anonymously on Conect's Toboa Siri. Express yourself freely and safely." path="/toboa-siri" />
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
              maxLength={200}
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Spill the tea... Your identity is protected."
              className="rounded-lg resize-none border-muted bg-muted mb-3"
              rows={4}
              maxLength={5000}
            />

            {/* File Previews */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="relative group rounded-lg border border-border overflow-hidden bg-muted"
                  >
                    {isImage(file) ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="h-20 w-20 object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 flex flex-col items-center justify-center p-2">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
                          {file.name.split(".").pop()?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-foreground/80 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="rounded-full text-muted-foreground font-display"
                >
                  Cancel
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_TYPES.join(",")}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full text-muted-foreground hover:text-foreground font-display gap-1.5"
                  disabled={files.length >= 5}
                >
                  <Paperclip className="h-4 w-4" />
                  <span className="text-xs">Attach{files.length > 0 ? ` (${files.length}/5)` : ""}</span>
                </Button>
              </div>
              <Button
                size="sm"
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-display gap-1.5"
                onClick={() => createPost.mutate()}
                disabled={!title.trim() || createPost.isPending || uploading}
              >
                <Send className="h-3.5 w-3.5" />
                {uploading ? "Uploading..." : createPost.isPending ? "Posting..." : "Share Anonymously"}
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
              <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                <Paperclip className="h-4 w-4" />
                <ImageIcon className="h-4 w-4" />
              </div>
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
