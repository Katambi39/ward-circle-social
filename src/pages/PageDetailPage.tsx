import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Store, ArrowBigUp, ArrowBigDown, MessageCircle, MessageSquare, Shield, MapPin, Users, CheckCircle2, UserPlus, UserMinus,
  Star, Calendar, BarChart3, Plus, Send, Clock,
  Globe, Phone, Image, ArrowLeft, TrendingUp, ImagePlus, Video, Trash2, Reply, Pencil,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageAnalytics from "@/components/pages/PageAnalytics";
import ReactionBar from "@/components/feed/ReactionBar";
import StartChatButton from "@/components/messages/StartChatButton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isPast } from "date-fns";

// Types
interface PageData {
  id: string; name: string; slug: string; description: string | null;
  category: string; avatar_url: string | null; cover_url: string | null;
  county: string | null; constituency: string | null; phone: string | null;
  website: string | null; is_verified: boolean; follower_count: number;
  owner_id: string; created_at: string;
}

interface Review {
  id: string; user_id: string; rating: number; content: string | null;
  created_at: string; profile?: { display_name: string; avatar_url: string | null; verification_status: string };
}

interface PageEvent {
  id: string; title: string; description: string | null; location: string | null;
  event_date: string; is_virtual: boolean; virtual_link: string | null;
  rsvp_count: number;
}

interface Poll {
  id: string; question: string; options: string[]; is_active: boolean;
  created_at: string; votes?: { option_index: number }[];
  userVote?: number | null;
}

const PageDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<PageEvent[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [rsvpedEvents, setRsvpedEvents] = useState<Set<string>>(new Set());
  const isOwner = user && page && user.id === page.owner_id;

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Event form
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventIsVirtual, setEventIsVirtual] = useState(false);
  const [eventLink, setEventLink] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Poll form
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [creatingPoll, setCreatingPoll] = useState(false);

  // Edit page form
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editCounty, setEditCounty] = useState("");
  const [editConstituency, setEditConstituency] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditDialog = () => {
    if (!page) return;
    setEditName(page.name);
    setEditDescription(page.description || "");
    setEditCategory(page.category);
    setEditPhone(page.phone || "");
    setEditWebsite(page.website || "");
    setEditCounty(page.county || "");
    setEditConstituency(page.constituency || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!page || !editName.trim()) return;
    setSavingEdit(true);
    const { error } = await supabase.from("pages").update({
      name: editName.trim(),
      description: editDescription.trim() || null,
      category: editCategory,
      phone: editPhone.trim() || null,
      website: editWebsite.trim() || null,
      county: editCounty.trim() || null,
      constituency: editConstituency.trim() || null,
    }).eq("id", page.id);
    setSavingEdit(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Page updated!" });
    setEditDialogOpen(false);
    fetchAll();
  };

  const viewRecorded = useRef(false);

  useEffect(() => {
    if (slug) fetchAll();
  }, [slug, user]);

  // Record page view once
  useEffect(() => {
    if (page && user && !viewRecorded.current) {
      viewRecorded.current = true;
      supabase.from("page_views").insert({ page_id: page.id, viewer_id: user.id } as any).then(() => {});
    }
  }, [page, user]);

  const fetchAll = async () => {
    // Fetch page
    const { data: pageData } = await supabase.from("pages").select("*").eq("slug", slug!).single();
    if (!pageData) { setLoading(false); return; }
    setPage(pageData as unknown as PageData);

    // Check follow
    if (user) {
      const { data: fol } = await supabase.from("page_followers").select("id").eq("page_id", (pageData as any).id).eq("user_id", user.id).maybeSingle();
      setIsFollowing(!!fol);
    }

    const pageId = (pageData as any).id;

    // Fetch reviews with profiles
    const { data: revData } = await supabase.from("page_reviews").select("*").eq("page_id", pageId).order("created_at", { ascending: false });
    if (revData && revData.length > 0) {
      const userIds = (revData as any[]).map(r => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url, verification_status").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setReviews((revData as any[]).map(r => ({ ...r, profile: profileMap.get(r.user_id) })));
    } else {
      setReviews([]);
    }

    // Fetch events
    const { data: evData } = await supabase.from("page_events").select("*").eq("page_id", pageId).order("event_date", { ascending: true });
    setEvents((evData as PageEvent[]) || []);

    // Check RSVPs
    if (user && evData) {
      const eventIds = (evData as any[]).map(e => e.id);
      const { data: rsvps } = await supabase.from("event_rsvps").select("event_id").eq("user_id", user.id).in("event_id", eventIds);
      setRsvpedEvents(new Set((rsvps || []).map((r: any) => r.event_id)));
    }

    // Fetch polls with votes
    const { data: pollData } = await supabase.from("page_polls").select("*").eq("page_id", pageId).order("created_at", { ascending: false });
    if (pollData && pollData.length > 0) {
      const pollIds = (pollData as any[]).map(p => p.id);
      const { data: allVotes } = await supabase.from("poll_votes").select("poll_id, option_index, user_id").in("poll_id", pollIds);
      const voteMap = new Map<string, { option_index: number }[]>();
      const userVoteMap = new Map<string, number>();
      (allVotes || []).forEach((v: any) => {
        if (!voteMap.has(v.poll_id)) voteMap.set(v.poll_id, []);
        voteMap.get(v.poll_id)!.push({ option_index: v.option_index });
        if (user && v.user_id === user.id) userVoteMap.set(v.poll_id, v.option_index);
      });
      setPolls((pollData as any[]).map(p => ({
        ...p,
        options: Array.isArray(p.options) ? p.options : [],
        votes: voteMap.get(p.id) || [],
        userVote: userVoteMap.get(p.id) ?? null,
      })));
    } else {
      setPolls([]);
    }

    setLoading(false);
  };

  const handleFollow = async () => {
    if (!user || !page) return;
    if (isFollowing) {
      await supabase.from("page_followers").delete().eq("page_id", page.id).eq("user_id", user.id);
      setIsFollowing(false);
      toast({ title: "Unfollowed" });
    } else {
      await supabase.from("page_followers").insert({ page_id: page.id, user_id: user.id } as any);
      setIsFollowing(true);
      toast({ title: "Following!" });
    }
    fetchAll();
  };

  const handleSubmitReview = async () => {
    if (!user || !page) return;
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("page_reviews").insert({
        page_id: page.id, user_id: user.id, rating: reviewRating,
        content: reviewContent.trim() || null,
      } as any);
      if (error) throw error;
      setReviewContent(""); setReviewRating(5);
      toast({ title: "Review submitted!" });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!page || !eventTitle.trim() || !eventDate) return;
    setCreatingEvent(true);
    try {
      const { error } = await supabase.from("page_events").insert({
        page_id: page.id, title: eventTitle.trim(),
        description: eventDesc.trim() || null,
        location: eventLocation.trim() || null,
        event_date: new Date(eventDate).toISOString(),
        is_virtual: eventIsVirtual,
        virtual_link: eventLink.trim() || null,
      } as any);
      if (error) throw error;
      setEventDialogOpen(false);
      setEventTitle(""); setEventDesc(""); setEventLocation(""); setEventDate(""); setEventLink("");
      toast({ title: "Event created!" });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleRsvp = async (eventId: string) => {
    if (!user) return;
    if (rsvpedEvents.has(eventId)) {
      await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
      toast({ title: "RSVP cancelled" });
    } else {
      await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.id } as any);
      toast({ title: "RSVP confirmed! 🎉" });
    }
    fetchAll();
  };

  const handleCreatePoll = async () => {
    if (!page || !pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;
    setCreatingPoll(true);
    try {
      const { error } = await supabase.from("page_polls").insert({
        page_id: page.id,
        question: pollQuestion.trim(),
        options: pollOptions.filter(o => o.trim()),
      } as any);
      if (error) throw error;
      setPollDialogOpen(false);
      setPollQuestion(""); setPollOptions(["", ""]);
      toast({ title: "Poll created!" });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreatingPoll(false);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!user) return;
    const poll = polls.find(p => p.id === pollId);
    if (poll?.userVote !== null && poll?.userVote !== undefined) return; // already voted
    await supabase.from("poll_votes").insert({ poll_id: pollId, user_id: user.id, option_index: optionIndex } as any);
    toast({ title: "Vote recorded!" });
    fetchAll();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-6 px-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
            <div className="h-40 bg-muted" />
            <div className="p-6"><div className="h-6 bg-muted rounded w-1/2 mb-3" /><div className="h-4 bg-muted rounded w-3/4" /></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!page) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Page not found</h2>
          <Button variant="outline" onClick={() => navigate("/pages")} className="rounded-full font-display gap-1.5 mt-4">
            <ArrowLeft className="h-4 w-4" /> Back to Pages
          </Button>
        </div>
      </AppLayout>
    );
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/pages")} className="rounded-full font-display gap-1 text-muted-foreground -ml-2">
          <ArrowLeft className="h-4 w-4" /> All Pages
        </Button>

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="h-36 sm:h-44 relative">
            {page.cover_url ? (
              <img src={page.cover_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full gradient-kenya" />
            )}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-secondary to-[hsl(var(--kenya-gold))]" />
            <div className="absolute -bottom-10 left-6">
              <div className="h-20 w-20 rounded-2xl bg-card border-4 border-card overflow-hidden shadow-elevated">
                {page.avatar_url ? (
                  <img src={page.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-2xl">
                    {page.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {page.is_verified && (
                <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-12 px-6 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  {page.name}
                  {page.is_verified && <Shield className="h-5 w-5 text-primary fill-primary/20" />}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {page.county && (
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {page.constituency ? `${page.constituency}, ` : ""}{page.county}</span>
                  )}
                  {reviews.length > 0 && (
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-[hsl(var(--kenya-gold))]" /> {avgRating.toFixed(1)} ({reviews.length})</span>
                  )}
                </div>
              </div>
              {isOwner && (
                <Button onClick={openEditDialog} variant="outline" size="sm" className="rounded-full font-display gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit Page
                </Button>
              )}
              {!isOwner && (
                <div className="flex items-center gap-2">
                  <StartChatButton targetUserId={page.owner_id} />
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    className={`rounded-full font-display gap-1.5 ${!isFollowing ? "gradient-kenya text-primary-foreground" : ""}`}
                  >
                    {isFollowing ? <><UserMinus className="h-3.5 w-3.5" /> Unfollow</> : <><UserPlus className="h-3.5 w-3.5" /> Konect</>}
                  </Button>
                </div>
              )}
            </div>

            {page.description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{page.description}</p>}

            <div className="mt-4 flex items-center gap-6 text-sm">
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-muted-foreground" /> <strong className="font-display">{page.follower_count}</strong> <span className="text-muted-foreground">Followers</span></span>
              {page.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-muted-foreground" /> {page.phone}</span>}
              {page.website && <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-muted-foreground" /> <a href={page.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{page.website}</a></span>}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="w-full bg-card border border-border rounded-xl p-1 shadow-card">
            <TabsTrigger value="content" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <Image className="h-3.5 w-3.5" /> Content
            </TabsTrigger>
            <TabsTrigger value="polls" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-3.5 w-3.5" /> Polls
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <Star className="h-3.5 w-3.5" /> Reviews
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <Calendar className="h-3.5 w-3.5" /> Events
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="analytics" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
                <TrendingUp className="h-3.5 w-3.5" /> Analytics
              </TabsTrigger>
            )}
          </TabsList>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="mt-4">
            <ContentTab pageId={page.id} isOwner={!!isOwner} />
          </TabsContent>

          {/* POLLS TAB */}
          <TabsContent value="polls" className="mt-4 space-y-4">
            {isOwner && (
              <Dialog open={pollDialogOpen} onOpenChange={setPollDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full rounded-xl font-display gap-1.5">
                    <Plus className="h-4 w-4" /> Create Poll
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle className="font-display">Create a Poll</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-display">Question</Label>
                      <Input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Ask your followers..." className="rounded-lg" />
                    </div>
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="space-y-1.5">
                        <Label className="text-xs font-display">Option {i + 1}</Label>
                        <Input value={opt} onChange={(e) => { const newOpts = [...pollOptions]; newOpts[i] = e.target.value; setPollOptions(newOpts); }} className="rounded-lg" />
                      </div>
                    ))}
                    {pollOptions.length < 4 && (
                      <Button variant="ghost" size="sm" onClick={() => setPollOptions([...pollOptions, ""])} className="font-display text-xs gap-1">
                        <Plus className="h-3 w-3" /> Add Option
                      </Button>
                    )}
                    <Button onClick={handleCreatePoll} disabled={creatingPoll || !pollQuestion.trim()} className="w-full rounded-lg gradient-kenya text-primary-foreground font-display">
                      {creatingPoll ? "Creating..." : "Create Poll"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {polls.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-display font-bold text-foreground">No polls yet</h3>
                <p className="text-sm text-muted-foreground">Check back for interactive polls!</p>
              </div>
            ) : (
              polls.map((poll) => {
                const totalVotes = poll.votes?.length || 0;
                const hasVoted = poll.userVote !== null && poll.userVote !== undefined;
                return (
                  <motion.div key={poll.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5 shadow-card">
                    <h3 className="font-display font-bold text-foreground text-sm mb-3">{poll.question}</h3>
                    <div className="space-y-2">
                      {(poll.options as string[]).map((opt, i) => {
                        const optVotes = poll.votes?.filter(v => v.option_index === i).length || 0;
                        const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                        const isSelected = poll.userVote === i;
                        return (
                          <button
                            key={i}
                            onClick={() => !hasVoted && handleVote(poll.id, i)}
                            disabled={hasVoted}
                            className={`w-full text-left rounded-lg border p-3 transition-all ${
                              isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                            } ${!hasVoted ? "cursor-pointer" : "cursor-default"}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-display text-foreground">{opt}</span>
                              {hasVoted && <span className="text-xs font-display text-muted-foreground">{pct}%</span>}
                            </div>
                            {hasVoted && <Progress value={pct} className="h-1.5" />}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 font-display">{totalVotes} vote{totalVotes !== 1 ? "s" : ""} · {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}</p>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* REVIEWS TAB */}
          <TabsContent value="reviews" className="mt-4 space-y-4">
            {/* Average Rating */}
            {reviews.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5 shadow-card flex items-center gap-4">
                <div className="text-center">
                  <p className="font-display text-3xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "text-[hsl(var(--kenya-gold))] fill-[hsl(var(--kenya-gold))]" : "text-muted"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviews.filter(r => r.rating === rating).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-2 text-xs">
                        <span className="font-display w-3 text-muted-foreground">{rating}</span>
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="w-6 text-right text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Write Review */}
            {!isOwner && user && (
              <div className="bg-card border border-border rounded-xl p-5 shadow-card">
                <h3 className="font-display font-bold text-foreground text-sm mb-3">Write a Review</h3>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setReviewRating(s)}>
                      <Star className={`h-6 w-6 transition-colors ${s <= reviewRating ? "text-[hsl(var(--kenya-gold))] fill-[hsl(var(--kenya-gold))]" : "text-muted hover:text-[hsl(var(--kenya-gold))]"}`} />
                    </button>
                  ))}
                </div>
                <Textarea value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} placeholder="Share your experience..." className="rounded-lg resize-none mb-3" rows={3} />
                <Button onClick={handleSubmitReview} disabled={submittingReview} size="sm" className="rounded-full gradient-kenya text-primary-foreground font-display gap-1">
                  <Send className="h-3.5 w-3.5" /> {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-display font-bold text-foreground">No reviews yet</h3>
                <p className="text-sm text-muted-foreground">Be the first to review this page!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 shadow-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {review.profile?.avatar_url ? (
                        <img src={review.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display text-xs font-bold">
                          {review.profile?.display_name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-display font-bold text-foreground flex items-center gap-1">
                        {review.profile?.display_name || "User"}
                        {review.profile?.verification_status === "verified" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "text-[hsl(var(--kenya-gold))] fill-[hsl(var(--kenya-gold))]" : "text-muted"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* EVENTS TAB */}
          <TabsContent value="events" className="mt-4 space-y-4">
            {isOwner && (
              <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full rounded-xl font-display gap-1.5">
                    <Plus className="h-4 w-4" /> Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle className="font-display">Create an Event</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-display">Title *</Label>
                      <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Nairobi Networking Meetup" className="rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-display">Description</Label>
                      <Textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} className="rounded-lg resize-none" rows={2} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-display">Date & Time *</Label>
                      <Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="rounded-lg" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs font-display">Virtual?</Label>
                      <input type="checkbox" checked={eventIsVirtual} onChange={(e) => setEventIsVirtual(e.target.checked)} className="rounded" />
                    </div>
                    {eventIsVirtual ? (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-display">Meeting Link</Label>
                        <Input value={eventLink} onChange={(e) => setEventLink(e.target.value)} placeholder="https://..." className="rounded-lg" />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-display">Location</Label>
                        <Input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="e.g. Kenyatta International Convention Centre" className="rounded-lg" />
                      </div>
                    )}
                    <Button onClick={handleCreateEvent} disabled={creatingEvent || !eventTitle.trim() || !eventDate} className="w-full rounded-lg gradient-kenya text-primary-foreground font-display">
                      {creatingEvent ? "Creating..." : "Create Event"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {events.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-display font-bold text-foreground">No events yet</h3>
                <p className="text-sm text-muted-foreground">Stay tuned for upcoming events!</p>
              </div>
            ) : (
              events.map((event) => {
                const past = isPast(new Date(event.event_date));
                const hasRsvped = rsvpedEvents.has(event.id);
                return (
                  <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`bg-card border rounded-xl p-5 shadow-card ${past ? "border-border opacity-60" : "border-primary/20"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display font-bold text-foreground text-sm">{event.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {format(new Date(event.event_date), "PPp")}
                          </span>
                          {event.is_virtual ? (
                            <Badge variant="outline" className="text-xs rounded-full"><Globe className="h-3 w-3 mr-1" /> Virtual</Badge>
                          ) : event.location ? (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                          ) : null}
                        </div>
                      </div>
                      {past ? (
                        <Badge variant="outline" className="text-xs rounded-full text-muted-foreground">Past</Badge>
                      ) : (
                        <Button
                          onClick={() => handleRsvp(event.id)}
                          size="sm"
                          variant={hasRsvped ? "outline" : "default"}
                          className={`rounded-full font-display text-xs gap-1 ${!hasRsvped ? "gradient-kenya text-primary-foreground" : ""}`}
                        >
                          {hasRsvped ? "Cancel RSVP" : "RSVP"}
                        </Button>
                      )}
                    </div>
                    {event.description && <p className="text-sm text-muted-foreground mt-2">{event.description}</p>}
                    <p className="text-xs text-muted-foreground mt-2 font-display">{event.rsvp_count} RSVP{event.rsvp_count !== 1 ? "s" : ""}</p>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* ANALYTICS TAB (owner only) */}
          {isOwner && (
            <TabsContent value="analytics" className="mt-4">
              <PageAnalytics pageId={page.id} pageName={page.name} />
            </TabsContent>
          )}
        </Tabs>

        {/* Edit Page Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" /> Edit Page
              </DialogTitle>
              <DialogDescription>Update your page details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="font-display text-xs">Page Name *</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Page name" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-display text-xs">Description</Label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Describe your page..." className="resize-none min-h-[80px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-display text-xs">Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["business", "brand", "community", "creator", "government", "ngo", "media", "other"].map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-display text-xs">County</Label>
                  <Input value={editCounty} onChange={(e) => setEditCounty(e.target.value)} placeholder="e.g. Nairobi" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-display text-xs">Constituency</Label>
                  <Input value={editConstituency} onChange={(e) => setEditConstituency(e.target.value)} placeholder="e.g. Westlands" className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-display text-xs">Phone</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+254..." className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-display text-xs">Website</Label>
                <Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://..." className="rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-full font-display">Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={savingEdit || !editName.trim()} className="rounded-full font-display gradient-kenya text-primary-foreground gap-1.5">
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

// Content showcase tab - shows page posts with media upload and comments
const ContentTab = ({ pageId, isOwner }: { pageId: string; isOwner: boolean }) => {
  const { user } = useAuth();
  const { toast: showToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({}); // postId -> parentCommentId

  const fetchPosts = async () => {
    const { data } = await (supabase
      .from("posts")
      .select("*") as any)
      .eq("page_id", pageId)
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [pageId]);

  const fetchComments = async (postId: string) => {
    const { data: comments } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (!comments || comments.length === 0) {
      setPostComments((prev) => ({ ...prev, [postId]: [] }));
      return;
    }
    const userIds = [...new Set(comments.map((c: any) => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, verification_status")
      .in("user_id", userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    // Build threaded comments
    const enriched = comments.map((c: any) => ({ ...c, profile: profileMap.get(c.user_id), replies: [] as any[] }));
    const topLevel: any[] = [];
    const byId = new Map(enriched.map((c: any) => [c.id, c]));
    for (const c of enriched) {
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id).replies.push(c);
      } else {
        topLevel.push(c);
      }
    }
    setPostComments((prev) => ({ ...prev, [postId]: topLevel }));
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
        if (!postComments[postId]) fetchComments(postId);
      }
      return next;
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setSelectedVideo(null);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 50 * 1024 * 1024) {
      setSelectedVideo(file);
      setSelectedImage(null);
      setImagePreview(null);
    } else {
      showToast({ title: "File too large", description: "Max video size is 50MB", variant: "destructive" });
    }
  };

  const handlePost = async () => {
    if ((!newContent.trim() && !selectedImage && !selectedVideo) || !user) return;
    setPosting(true);

    let imageUrl: string | null = null;
    let videoUrl: string | null = null;

    try {
      if (selectedImage) {
        const ext = selectedImage.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-images").upload(path, selectedImage);
        if (upErr) throw upErr;
        const { data: pubData } = supabase.storage.from("post-images").getPublicUrl(path);
        imageUrl = pubData.publicUrl;
      }

      if (selectedVideo) {
        const ext = selectedVideo.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-videos").upload(path, selectedVideo);
        if (upErr) throw upErr;
        const { data: pubData } = supabase.storage.from("post-videos").getPublicUrl(path);
        videoUrl = pubData.publicUrl;
      }

      const title = newContent.trim().substring(0, 100) || "Page post";
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        title,
        content: newContent.trim() || null,
        page_id: pageId,
        image_url: imageUrl,
        video_url: videoUrl,
        is_anonymous: false,
      } as any);

      if (error) throw error;

      showToast({ title: "Posted!", description: "Your content has been shared" });
      setNewContent("");
      setSelectedImage(null);
      setSelectedVideo(null);
      setImagePreview(null);
      fetchPosts();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message || "Failed to post content", variant: "destructive" });
    }
    setPosting(false);
  };

  const handleComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text || !user) return;
    const parentId = replyingTo[postId] || null;
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: text,
      parent_id: parentId,
    });
    if (error) {
      showToast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    } else {
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      setReplyingTo((prev) => ({ ...prev, [postId]: null }));
      fetchComments(postId);
      const post = posts.find((p) => p.id === postId);
      if (post) {
        await supabase.from("posts").update({ comment_count: (post.comment_count || 0) + 1 }).eq("id", postId);
        fetchPosts();
      }
    }
  };

  if (loading) {
    return <div className="space-y-3">{[1, 2].map(i => <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse"><div className="h-4 bg-muted rounded w-3/4" /></div>)}</div>;
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-card space-y-3">
          <Textarea
            placeholder="Share something with your followers..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg border border-border" />
              <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6 rounded-full" onClick={() => { setSelectedImage(null); setImagePreview(null); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          {selectedVideo && (
            <div className="flex items-center gap-2 bg-muted rounded-lg p-2 text-sm text-muted-foreground">
              <Video className="h-4 w-4" />
              <span className="truncate flex-1">{selectedVideo.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedVideo(null)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground" onClick={() => imageInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground" onClick={() => videoInputRef.current?.click()}>
                <Video className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handlePost} disabled={posting || (!newContent.trim() && !selectedImage && !selectedVideo)} size="sm" className="rounded-full font-display gap-1.5">
              <Send className="h-4 w-4" />
              {posting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card">
          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-display font-bold text-foreground">No content yet</h3>
          <p className="text-sm text-muted-foreground">
            {isOwner ? "Start sharing content with your followers!" : "This page hasn't posted any content yet."}
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5 shadow-card">
            {post.content && <p className="text-sm text-foreground mb-2">{post.content}</p>}
            {post.image_url && (
              <div className="rounded-lg overflow-hidden border border-border mb-2">
                <img src={post.image_url} alt="" className="w-full max-h-72 object-cover" />
              </div>
            )}
            {post.video_url && (
              <div className="rounded-lg overflow-hidden border border-border mb-2">
                <video src={post.video_url} controls className="w-full max-h-72" />
              </div>
            )}
            <div className="flex items-center gap-1 mt-2">
              <ReactionBar postId={post.id} />
              <div className="flex-1" />
              <p className="text-xs text-muted-foreground font-display mr-1">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
              <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground gap-1 text-xs" onClick={() => toggleComments(post.id)}>
                <MessageSquare className="h-3.5 w-3.5" />
                {post.comment_count || 0}
              </Button>
            </div>

            {expandedComments.has(post.id) && (
              <div className="mt-3 border-t border-border pt-3 space-y-3">
                {(postComments[post.id] || []).map((comment: any) => (
                  <PageComment
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                    depth={0}
                    onReply={(commentId) => {
                      setReplyingTo((prev) => ({ ...prev, [post.id]: commentId }));
                    }}
                  />
                ))}
                {user && (
                  <div className="space-y-1.5">
                    {replyingTo[post.id] && (
                      <div className="flex items-center gap-1.5 text-xs text-primary font-display">
                        <span>Replying to a comment</span>
                        <button onClick={() => setReplyingTo((prev) => ({ ...prev, [post.id]: null }))} className="text-muted-foreground hover:text-destructive">✕</button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder={replyingTo[post.id] ? "Write a reply..." : "Write a comment..."}
                        value={commentTexts[post.id] || ""}
                        onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleComment(post.id); }}
                        className="h-8 text-xs rounded-full"
                      />
                      <Button size="icon" className="h-8 w-8 rounded-full shrink-0" onClick={() => handleComment(post.id)} disabled={!commentTexts[post.id]?.trim()}>
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
};

// Threaded comment component for page posts
const PageComment = ({ comment, postId, depth, onReply }: { comment: any; postId: string; depth: number; onReply: (id: string) => void }) => {
  const verified = comment.profile?.verification_status === "verified";
  return (
    <div className={cn(depth > 0 && "ml-6 border-l-2 border-primary/15 pl-3")}>
      <div className="flex gap-2">
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarImage src={comment.profile?.avatar_url} />
          <AvatarFallback className="text-[10px] font-display">
            {(comment.profile?.display_name || "?")[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-display font-semibold text-foreground">
              {comment.profile?.display_name || "User"}
            </span>
            {verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{comment.content}</p>
          <button
            onClick={() => onReply(comment.id)}
            className="text-[10px] text-muted-foreground font-display hover:text-primary mt-1 flex items-center gap-1"
          >
            <Reply className="h-3 w-3" /> Reply
          </button>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply: any) => (
            <PageComment key={reply.id} comment={reply} postId={postId} depth={depth + 1} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PageDetailPage;
