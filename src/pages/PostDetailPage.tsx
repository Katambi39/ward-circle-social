import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { moderateContent } from "@/lib/moderation";
import { isExplicitLink } from "@/components/feed/LinkSafety";
import ReportDialog from "@/components/moderation/ReportDialog";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import PostCard from "@/components/feed/PostCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DbPost } from "@/hooks/usePosts";
import {
  ArrowLeft, ArrowBigUp, ArrowBigDown, MessageCircle, Shield, MapPin, CheckCircle2, Send, Loader2, Clock, Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  is_anonymous: boolean;
  upvotes: number;
  created_at: string;
  parent_id: string | null;
  profile?: { display_name: string; username: string; avatar_url: string | null; verification_status: string };
  replies?: Comment[];
}

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<DbPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const fetchPost = async () => {
    const { data: p } = await supabase.from("posts").select("*, groups(name, location)").eq("id", id!).single();
    if (!p) { setLoading(false); return; }

    const { data: profile } = await supabase.from("profiles")
      .select("display_name, username, avatar_url, verification_status")
      .eq("user_id", (p as any).user_id).single();

    setPost({
      ...(p as any),
      author_name: (profile as any)?.display_name || "User",
      author_username: (profile as any)?.username || "user",
      author_avatar: (profile as any)?.avatar_url || null,
      author_verified: (profile as any)?.verification_status === "verified",
      group_name: (p as any).groups?.name || null,
      group_location: (p as any).groups?.location || null,
    });

    await fetchComments();
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase.from("comments")
      .select("*")
      .eq("post_id", id!)
      .order("created_at", { ascending: true });

    if (!data) return;

    const userIds = [...new Set(data.map((c: any) => c.user_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from("profiles").select("user_id, display_name, username, avatar_url, verification_status").in("user_id", userIds)
      : { data: [] };
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const mapped: Comment[] = data.map((c: any) => ({
      ...c,
      profile: profileMap.get(c.user_id),
      replies: [],
    }));

    // Nest replies
    const topLevel: Comment[] = [];
    const byId = new Map(mapped.map((c) => [c.id, c]));
    mapped.forEach((c) => {
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id)!.replies!.push(c);
      } else {
        topLevel.push(c);
      }
    });

    setComments(topLevel);
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    setSubmitting(true);

    // Check for explicit links
    const urlsInComment = newComment.match(/https?:\/\/[^\s)]+/gi) || [];
    if (urlsInComment.some(u => isExplicitLink(u))) {
      const { toast } = await import("@/components/ui/sonner");
      toast.error("Explicit or adult content links are not allowed.");
      setSubmitting(false);
      return;
    }

    // Moderate comment content
    const modResult = await moderateContent(newComment.trim(), "comment");
    if (modResult.should_block) {
      const { toast } = await import("@/components/ui/sonner");
      toast.error("Comment blocked: " + modResult.reason);
      setSubmitting(false);
      return;
    }

    const { data: commentData, error } = await supabase.from("comments").insert({
      post_id: id!,
      user_id: user.id,
      content: newComment.trim(),
      parent_id: replyTo,
    }).select("id").single();
    if (!error) {
      // Log flagged comments asynchronously
      if (modResult.is_flagged && commentData) {
        moderateContent(newComment.trim(), "comment", commentData.id, user.id).catch(() => {});
      }
      setNewComment("");
      setReplyTo(null);
      await fetchComments();
      await supabase.from("posts").update({ comment_count: comments.length + 1 } as any).eq("id", id!);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-6 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-20 bg-muted rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <p className="font-display text-lg text-muted-foreground">Post not found</p>
          <Button variant="outline" onClick={() => navigate("/")} className="mt-4 rounded-full font-display">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Feed
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full font-display gap-1 text-muted-foreground -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <PostCard dbPost={post} index={0} />

        {/* Comment input */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="font-display font-bold text-sm text-foreground">
              Comments ({comments.reduce((a, c) => a + 1 + (c.replies?.length || 0), 0)})
            </span>
          </div>
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
              Replying to a comment
              <button onClick={() => setReplyTo(null)} className="text-primary font-display font-medium ml-auto">Cancel</button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="rounded-xl text-sm min-h-[60px]"
              rows={2}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              size="icon"
              className="rounded-xl gradient-kenya text-primary-foreground h-10 w-10 shrink-0 self-end"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-2">
          {comments.map((comment, i) => (
            <CommentItem key={comment.id} comment={comment} index={i} onReply={setReplyTo} onDelete={() => fetchComments()} />
          ))}
          {comments.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6 font-display">No comments yet — be the first!</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

const CommentItem = ({ comment, index, onReply, onDelete, depth = 0 }: { comment: Comment; index: number; onReply: (id: string) => void; onDelete?: (id: string) => void; depth?: number }) => {
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const isAnon = comment.is_anonymous;
  const name = isAnon ? "Anonymous" : (comment.profile?.display_name || "User");
  const avatar = isAnon ? null : comment.profile?.avatar_url;
  const verified = comment.profile?.verification_status === "verified" && !isAnon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn("bg-card border border-border rounded-xl p-3", depth > 0 && "ml-6 border-l-2 border-l-primary/20")}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-7 w-7 rounded-full bg-muted overflow-hidden flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground text-xs font-display font-bold">
              {isAnon ? "?" : name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <span className="font-display font-bold text-xs text-foreground flex items-center gap-1">
          {name}
          {verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
        </span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm text-foreground ml-9">{comment.content}</p>
      <div className="flex items-center gap-2 ml-9 mt-1.5">
        <button className="text-[10px] text-muted-foreground font-display hover:text-primary" onClick={() => onReply(comment.id)}>
          Reply
        </button>
        {user && user.id === comment.user_id && (
          <button className="text-[10px] text-muted-foreground font-display hover:text-destructive flex items-center gap-0.5" onClick={async () => {
            if (!window.confirm("Delete this comment?")) return;
            const { error } = await supabase.from("comments").delete().eq("id", comment.id);
            if (!error) onDelete?.(comment.id);
          }}>
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        )}
        {user && user.id !== comment.user_id && (
          <button className="text-[10px] text-muted-foreground font-display hover:text-destructive" onClick={() => setReportOpen(true)}>
            Report
          </button>
        )}
      </div>
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        contentId={comment.id}
        contentType="comment"
        flaggedText={comment.content?.substring(0, 200)}
      />
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply, ri) => (
            <CommentItem key={reply.id} comment={reply} index={ri} onReply={onReply} onDelete={onDelete} depth={depth + 1} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PostDetailPage;
