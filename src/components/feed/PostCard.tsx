import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import SafeLink from "./SafeLink";
import { useNavigate } from "react-router-dom";
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin, Shield, Flag, Trash2, Copy, Repeat2, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, Loader2, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { DbPost } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";
import ReactionBar from "./ReactionBar";
import PostPollDisplay from "./PostPollDisplay";
import RepostDialog from "./RepostDialog";
import EmbeddedRepost from "./EmbeddedRepost";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import ReportDialog from "@/components/moderation/ReportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const renderContentWithTags = (text: string, navigateFn: (path: string) => void) => {
  const parts = text.split(/(#\w+|\$[A-Za-z][A-Za-z0-9_]*)/g);
  return parts.map((part, i) => {
    if (/^#\w+$/.test(part)) {
      return (
        <span key={i} className="text-primary font-semibold cursor-pointer hover:underline"
          onClick={(e) => { e.stopPropagation(); navigateFn(`/search?q=${encodeURIComponent(part)}`); }}>
          {part}
        </span>
      );
    }
    if (/^\$[A-Za-z][A-Za-z0-9_]*$/.test(part)) {
      return (
        <span key={i} className="text-kenya-gold font-semibold cursor-pointer hover:underline"
          onClick={(e) => { e.stopPropagation(); navigateFn(`/search?q=${encodeURIComponent(part)}`); }}>
          {part}
        </span>
      );
    }
    return part;
  });
};

// Keep legacy interface for backward compat
export interface PostData {
  id: string;
  author: string;
  authorUsername?: string;
  authorAvatar?: string;
  group: string;
  groupLocality?: string;
  timeAgo: string;
  title: string;
  content: string;
  image?: string;
  video?: string;
  upvotes: number;
  comments: number;
  shares: number;
  isVerified: boolean;
  isAnonymous?: boolean;
  feeling?: string;
  linkUrl?: string;
  visibility?: string;
}

interface PostCardProps {
  post?: PostData;
  dbPost?: DbPost;
  index: number;
  isBookmarked?: boolean;
  onToggleBookmark?: (postId: string) => void;
}

function dbPostToDisplay(p: DbPost): PostData {
  return {
    id: p.id,
    author: p.is_anonymous ? "Anonymous" : p.author_name,
    authorUsername: p.is_anonymous ? undefined : p.author_username,
    authorAvatar: p.is_anonymous ? undefined : (p.author_avatar || undefined),
    group: p.group_name || "",
    groupLocality: p.group_location || undefined,
    timeAgo: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
    title: p.title,
    content: p.content || "",
    image: p.image_url || undefined,
    video: p.video_url || undefined,
    upvotes: p.upvotes - p.downvotes,
    comments: p.comment_count,
    shares: p.share_count,
    isVerified: p.author_verified,
    isAnonymous: p.is_anonymous,
    feeling: p.feeling || undefined,
    linkUrl: p.link_url || undefined,
    visibility: p.visibility || "public",
  };
}

const PostCard = ({ post: legacyPost, dbPost, index, isBookmarked = false, onToggleBookmark }: PostCardProps) => {
  const post = legacyPost || (dbPost ? dbPostToDisplay(dbPost) : null);
  
  if (!post) return null;

  return <PostCardInner post={post} postId={dbPost?.id || post.id} authorUserId={dbPost?.user_id} authorUsername={dbPost?.author_username} repostOf={dbPost?.repost_of || null} repostComment={dbPost?.repost_comment || null} index={index} isBookmarked={isBookmarked} onToggleBookmark={onToggleBookmark} />;
};

type Verdict = "verified" | "misleading" | "false" | "unverified";
type VerifyResult = { verdict: Verdict; confidence: number; summary: string; details: string; sources_note: string; link_warnings?: string[] };

const verdictStyles: Record<Verdict, { icon: typeof ShieldCheck; label: string; color: string; bg: string }> = {
  verified: { icon: ShieldCheck, label: "Verified", color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  misleading: { icon: ShieldAlert, label: "Misleading", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  false: { icon: ShieldX, label: "False", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  unverified: { icon: ShieldQuestion, label: "Unverified", color: "text-muted-foreground", bg: "bg-muted border-border" },
};

const PostCardInner = ({ post, postId, authorUserId, authorUsername, repostOf, repostComment, index, isBookmarked, onToggleBookmark }: { post: PostData; postId: string; authorUserId?: string; authorUsername?: string; repostOf?: string | null; repostComment?: string | null; index: number; isBookmarked: boolean; onToggleBookmark?: (id: string) => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [votes, setVotes] = useState(post.upvotes);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyExpanded, setVerifyExpanded] = useState(false);

  // Load existing vote from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from("votes")
      .select("vote_type")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setVoted(data.vote_type === 1 ? "up" : "down");
        }
      });
  }, [postId, user]);

  // Keep votes in sync with post prop changes (realtime)
  useEffect(() => {
    setVotes(post.upvotes);
  }, [post.upvotes]);

  useEffect(() => {
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("repost_of", postId)
      .then(({ count }) => setRepostCount(count || 0));
  }, [postId]);

  const isOwnPost = !!(user && authorUserId && user.id === authorUserId);

  const handleVote = async (direction: "up" | "down") => {
    if (!user) {
      toast.error("Sign in to vote");
      return;
    }

    const voteType = direction === "up" ? 1 : -1;

    if (voted === direction) {
      // Remove vote - optimistic
      const prevVotes = votes;
      setVoted(null);
      setVotes((v) => v - voteType);

      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (!error) {
        // Update post counters
        if (direction === "up") {
          await supabase.from("posts").update({ upvotes: Math.max(0, prevVotes - 1) }).eq("id", postId);
        } else {
          await supabase.from("posts").update({ downvotes: Math.max(0, (post.upvotes - prevVotes) + 1 - 1) }).eq("id", postId);
        }
      } else {
        setVoted(direction);
        setVotes(prevVotes);
      }
    } else {
      // Add or change vote - optimistic
      const prevVoted = voted;
      const prevVotes = votes;
      setVoted(direction);
      setVotes((v) => v + voteType - (prevVoted ? (prevVoted === "up" ? 1 : -1) : 0));

      // Upsert vote
      const { error } = await supabase
        .from("votes")
        .upsert(
          { post_id: postId, user_id: user.id, vote_type: voteType },
          { onConflict: "user_id,post_id", ignoreDuplicates: false }
        );

      if (!error) {
        // Recalculate from DB for accuracy
        const { count: upCount } = await supabase
          .from("votes")
          .select("id", { count: "exact", head: true })
          .eq("post_id", postId)
          .eq("vote_type", 1);
        const { count: downCount } = await supabase
          .from("votes")
          .select("id", { count: "exact", head: true })
          .eq("post_id", postId)
          .eq("vote_type", -1);

        await supabase.from("posts").update({
          upvotes: upCount || 0,
          downvotes: downCount || 0,
        }).eq("id", postId);
      } else {
        setVoted(prevVoted);
        setVotes(prevVotes);
        toast.error("Vote failed");
      }
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${postId}`;
    let shared = false;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url }); shared = true; } catch { return; }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Link copied to clipboard");
      shared = true;
    }
    if (shared) {
      await supabase.from("posts").update({ share_count: post.shares + 1 }).eq("id", postId);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      toast.error("Failed to delete post");
    } else {
      toast.success("Post deleted");
      setDeleted(true);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    toast.success("Link copied");
  };

  const handleFactCheck = async () => {
    if (verifying || verifyResult) return;
    // Include link URL in the claim for analysis
    let claim = (post.title + " " + (post.content || "")).trim();
    if (post.linkUrl) {
      claim += `\n\nLink in post: ${post.linkUrl}`;
    }
    if (!claim) return;
    setVerifying(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ mode: "verify", claim }),
      });
      if (!resp.ok) throw new Error("Verification failed");
      const data = await resp.json();
      setVerifyResult(data.result as VerifyResult);
    } catch {
      toast.error("Could not verify this post");
    } finally {
      setVerifying(false);
    }
  };

  if (deleted) return null;

  // Strip poll text and old feeling prefix from content for display
  const displayContent = post.content
    ?.replace(/📊 Poll:\n[\s\S]*$/, "")
    ?.replace(/^[\p{Emoji_Presentation}\p{Emoji}\uFE0F]+ Feeling \w+\n*/u, "")
    ?.trim();

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.08, 0.4), duration: 0.4 }}
      className="bg-card border border-border rounded-xl shadow-card hover:shadow-elevated transition-shadow"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          {post.authorAvatar ? (
            <img src={post.authorAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
              {post.isAnonymous ? "?" : post.author[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="font-display font-semibold text-sm text-foreground cursor-pointer hover:underline"
                onClick={(e) => { e.stopPropagation(); if (!post.isAnonymous && authorUsername) navigate(`/user/${authorUsername}`); }}
              >
                {post.isAnonymous ? "Anonymous" : post.author}
              </span>
              {!post.isAnonymous && post.authorUsername && (
                <span className="text-xs text-muted-foreground">@{post.authorUsername}</span>
              )}
              {post.isVerified && !post.isAnonymous && (
                <Shield className="h-3.5 w-3.5 text-primary fill-primary/20" />
              )}
              {post.feeling && (
                <span className="text-xs text-muted-foreground">— {post.feeling}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {post.visibility === "friends" ? (
                <Users className="h-3 w-3 text-secondary" />
              ) : (
                <Globe className="h-3 w-3 text-secondary" />
              )}
              <span className="font-medium text-secondary">
                {post.visibility === "friends" ? "Friends" : "Public"}
              </span>
              {post.group && (
                <>
                  <span>·</span>
                  <span className="font-medium">{post.group}</span>
                </>
              )}
              {post.groupLocality && (
                <>
                  <span>·</span>
                  <MapPin className="h-3 w-3" />
                  <span>{post.groupLocality}</span>
                </>
              )}
              <span>·</span>
              <span>{post.timeAgo}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              {isOwnPost && (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              )}
              {!isOwnPost && (
                <DropdownMenuItem onClick={() => setReportOpen(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content - clickable to go to post detail */}
        <div className="cursor-pointer" onClick={() => navigate(`/post/${postId}`)}>
          {/* Show title only on anonymous posts where title differs from content */}
          {post.isAnonymous && post.title && post.title !== post.content?.substring(0, 100) && (
            <h3 className="font-display font-bold text-foreground mb-2 leading-snug">
              {post.title}
            </h3>
          )}
          {displayContent && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {renderContentWithTags(displayContent, navigate)}
            </p>
          )}
          {post.image && (
            <div className="rounded-lg overflow-hidden mb-3 border border-border">
              <img src={post.image} alt="" className="w-full h-48 object-cover" />
            </div>
          )}
          {post.video && (
            <div className="rounded-lg overflow-hidden mb-3 border border-border">
              <video src={post.video} controls className="w-full max-h-72" />
            </div>
          )}
          {post.linkUrl && (
            <SafeLink url={post.linkUrl} />
          )}
        </div>

        {/* Embedded Repost */}
        {repostOf && <EmbeddedRepost originalPostId={repostOf} />}

        {/* Poll Display */}
        <PostPollDisplay postId={postId} />

        {/* Inline Verification Result */}
        {verifyResult && (() => {
          const vc = verdictStyles[verifyResult.verdict];
          const VIcon = vc.icon;
          return (
            <div className={cn("rounded-xl border p-2.5 mt-2", vc.bg)}>
              <button onClick={() => setVerifyExpanded(v => !v)} className="flex items-center gap-2 w-full text-left">
                <VIcon className={cn("h-4 w-4 shrink-0", vc.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("font-display font-semibold text-xs", vc.color)}>{vc.label}</span>
                    <span className="text-[10px] text-muted-foreground">({verifyResult.confidence}%)</span>
                  </div>
                  <p className="text-[11px] text-foreground/80 line-clamp-1 [&_strong]:font-semibold"><ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>{verifyResult.summary}</ReactMarkdown></p>
                </div>
                <span className="text-[10px] text-muted-foreground">{verifyExpanded ? "▲" : "▼"}</span>
              </button>
              {verifyExpanded && (
                <div className="mt-2 pt-2 border-t border-border/50 text-xs text-foreground/80 space-y-2">
                  <div className="prose prose-xs prose-neutral dark:prose-invert max-w-none [&_h2]:text-sm [&_h2]:font-display [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-display [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:text-[11px] [&_p]:leading-relaxed [&_strong]:text-foreground [&_ol]:text-[11px] [&_ul]:text-[11px] [&_li]:my-0.5">
                    <ReactMarkdown>{verifyResult.details}</ReactMarkdown>
                  </div>
                  {verifyResult.link_warnings && verifyResult.link_warnings.length > 0 && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-2">
                      <p className="font-semibold text-warning flex items-center gap-1.5 mb-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Link Warnings
                      </p>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5">
                        {verifyResult.link_warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground italic">📚 {verifyResult.sources_note}</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Engagement Summary (Facebook-style) */}
        {(votes > 0 || post.comments > 0 || post.shares > 0) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pb-2 border-b border-border/50">
            <div className="flex items-center gap-1.5">
              {votes > 0 && (
                <>
                  <span className="flex items-center -space-x-1">
                    <span className="h-4 w-4 rounded-full bg-primary flex items-center justify-center ring-2 ring-card">
                      <ArrowBigUp className="h-2.5 w-2.5 text-primary-foreground fill-primary-foreground" />
                    </span>
                  </span>
                  <span className="font-display">{votes.toLocaleString()}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {post.comments > 0 && (
                <span className="font-display hover:underline cursor-pointer" onClick={() => navigate(`/post/${postId}`)}>
                  {post.comments.toLocaleString()} {post.comments === 1 ? "comment" : "comments"}
                </span>
              )}
              {post.shares > 0 && (
                <span className="font-display">
                  {post.shares.toLocaleString()} {post.shares === 1 ? "share" : "shares"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={() => handleVote("up")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors",
              voted === "up" ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <ArrowBigUp className={cn("h-5 w-5", voted === "up" && "fill-primary animate-vote-pop")} />
            <span className="text-xs font-display font-semibold">Like</span>
          </button>

          {/* Emoji Reactions */}
          <ReactionBar postId={postId} />

          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground gap-1.5 px-2" onClick={() => navigate(`/post/${postId}`)}>
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-display">{post.comments}</span>
          </Button>

          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground px-2" onClick={(e) => { e.stopPropagation(); handleShare(); }}>
            <Share2 className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground gap-1.5 px-2" onClick={(e) => { e.stopPropagation(); setRepostOpen(true); }}>
            <Repeat2 className="h-4 w-4" />
            {repostCount > 0 && <span className="text-xs font-display">{repostCount}</span>}
          </Button>

          {/* Fact-check button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full gap-1 px-2",
              verifyResult
                ? verdictStyles[verifyResult.verdict].color
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={(e) => { e.stopPropagation(); handleFactCheck(); }}
            disabled={verifying}
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : verifyResult ? (
              (() => { const V = verdictStyles[verifyResult.verdict].icon; return <V className="h-4 w-4" />; })()
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1" />

          <button
            onClick={() => onToggleBookmark?.(postId)}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              isBookmarked ? "text-kenya-gold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-kenya-gold")} />
          </button>
        </div>
      </div>

      <RepostDialog
        open={repostOpen}
        onOpenChange={(open) => {
          setRepostOpen(open);
          if (!open) {
            // Refresh count after dialog closes (user may have reposted)
            supabase.from("posts").select("id", { count: "exact", head: true }).eq("repost_of", postId).then(({ count }) => setRepostCount(count || 0));
          }
        }}
        originalPost={{
          id: postId,
          title: post.title,
          content: post.content,
          author: post.author,
          authorAvatar: post.authorAvatar,
          isVerified: post.isVerified,
          group: post.group,
          groupLocality: post.groupLocality,
        }}
      />

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        contentId={postId}
        contentType="post"
        flaggedText={post.content?.substring(0, 200)}
      />
    </motion.article>
  );
};

export default PostCard;
