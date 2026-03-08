import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Flag, CheckCircle2, XCircle, Clock, ArrowLeft, Loader2,
  AlertTriangle, Trash2, Eye, ShieldAlert, MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface ModerationFlag {
  id: string;
  user_id: string;
  content_id: string;
  content_type: string;
  reason: string;
  severity: string;
  status: string;
  flagged_text: string | null;
  ai_confidence: number | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reporter_profile?: { display_name: string; username: string } | null;
}

const severityConfig: Record<string, { color: string; label: string }> = {
  high: { color: "bg-destructive/10 text-destructive border-destructive/20", label: "High" },
  medium: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "Medium" },
  low: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Low" },
};

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock, label: "Pending" },
  reviewed: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2, label: "Reviewed" },
  dismissed: { color: "bg-muted text-muted-foreground border-border", icon: XCircle, label: "Dismissed" },
  actioned: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: Trash2, label: "Actioned" },
};

const AdminModerationPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [selected, setSelected] = useState<ModerationFlag | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) checkAdminAndFetch();
  }, [user]);

  const checkAdminAndFetch = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!data) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setIsAdmin(true);
    fetchFlags();
  };

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("moderation_flags")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch reporter profiles
      const userIds = [...new Set((data || []).map((f: any) => f.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      setFlags(
        (data || []).map((f: any) => ({
          ...f,
          reporter_profile: profileMap.get(f.user_id) || null,
        }))
      );
    } catch (e: any) {
      toast({ title: "Error loading reports", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "dismissed" | "actioned") => {
    if (!selected) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("moderation_flags")
        .update({
          status: action,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selected.id);

      if (error) throw error;

      // If actioned and it's a post, delete the post
      if (action === "actioned" && selected.content_type === "post") {
        await supabase.from("posts").delete().eq("id", selected.content_id);
      }
      if (action === "actioned" && selected.content_type === "comment") {
        await supabase.from("comments").delete().eq("id", selected.content_id);
      }

      toast({
        title: action === "dismissed" ? "Report dismissed" : "Content removed ✅",
        description: action === "dismissed"
          ? "The report has been dismissed."
          : "The reported content has been removed.",
      });

      setSelected(null);
      setReviewNotes("");
      fetchFlags();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
          <Button onClick={() => navigate("/")} variant="outline" className="rounded-xl font-display">
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  const filtered = flags.filter((f) => {
    if (activeTab === "all") return true;
    return f.status === activeTab;
  });

  const counts = {
    pending: flags.filter((f) => f.status === "pending").length,
    actioned: flags.filter((f) => f.status === "actioned").length,
    dismissed: flags.filter((f) => f.status === "dismissed").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Flag className="h-6 w-6 text-destructive" /> Moderation Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Review and act on user reports</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pending", count: counts.pending, color: "text-yellow-500" },
            { label: "Actioned", count: counts.actioned, color: "text-destructive" },
            { label: "Dismissed", count: counts.dismissed, color: "text-muted-foreground" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.count}</p>
                <p className="text-xs text-muted-foreground font-display">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full grid grid-cols-4 rounded-xl">
            <TabsTrigger value="pending" className="rounded-xl font-display text-xs">
              Pending {counts.pending > 0 && `(${counts.pending})`}
            </TabsTrigger>
            <TabsTrigger value="actioned" className="rounded-xl font-display text-xs">Actioned</TabsTrigger>
            <TabsTrigger value="dismissed" className="rounded-xl font-display text-xs">Dismissed</TabsTrigger>
            <TabsTrigger value="all" className="rounded-xl font-display text-xs">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Flag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-display">No {activeTab === "all" ? "" : activeTab} reports</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filtered.map((flag, i) => {
                    const sev = severityConfig[flag.severity] || severityConfig.low;
                    const stat = statusConfig[flag.status] || statusConfig.pending;
                    const StatIcon = stat.icon;
                    return (
                      <motion.div
                        key={flag.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card
                          className="border-border hover:border-primary/30 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelected(flag);
                            setReviewNotes("");
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                <ShieldAlert className="h-5 w-5 text-destructive/70" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-display font-bold text-sm text-foreground capitalize">
                                    {flag.content_type} report
                                  </span>
                                  <Badge variant="outline" className={`${sev.color} border text-[10px] font-display`}>
                                    {sev.label}
                                  </Badge>
                                  <Badge variant="outline" className={`${stat.color} border text-[10px] font-display`}>
                                    <StatIcon className="h-3 w-3 mr-1" /> {stat.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-1">{flag.reason}</p>
                                {flag.flagged_text && (
                                  <p className="text-xs text-foreground/70 line-clamp-2 bg-muted p-2 rounded-lg mt-1">
                                    "{flag.flagged_text}"
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                                  <span>
                                    Reported by {flag.reporter_profile?.display_name || "Unknown"} (@{flag.reporter_profile?.username || "?"})
                                  </span>
                                  <span>•</span>
                                  <span>{formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}</span>
                                </div>
                              </div>
                              <Eye className="h-4 w-4 text-muted-foreground mt-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (() => {
            const sev = severityConfig[selected.severity] || severityConfig.low;
            const stat = statusConfig[selected.status] || statusConfig.pending;
            const StatIcon = stat.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    {selected.content_type.charAt(0).toUpperCase() + selected.content_type.slice(1)} Report
                  </DialogTitle>
                  <DialogDescription>
                    Reported {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}
                    {" by "}{selected.reporter_profile?.display_name || "Unknown"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`${sev.color} border font-display`}>
                      Severity: {sev.label}
                    </Badge>
                    <Badge variant="outline" className={`${stat.color} border font-display`}>
                      <StatIcon className="h-3 w-3 mr-1" /> {stat.label}
                    </Badge>
                    <Badge variant="outline" className="font-display capitalize">
                      {selected.content_type}
                    </Badge>
                  </div>

                  <div className="p-3 bg-muted rounded-xl">
                    <p className="text-xs text-muted-foreground font-display mb-1">Reason</p>
                    <p className="text-sm text-foreground">{selected.reason}</p>
                  </div>

                  {selected.flagged_text && (
                    <div className="p-3 bg-muted rounded-xl">
                      <p className="text-xs text-muted-foreground font-display mb-1">Flagged Content</p>
                      <p className="text-sm text-foreground italic">"{selected.flagged_text}"</p>
                    </div>
                  )}

                  {selected.ai_confidence !== null && (
                    <div className="p-3 bg-muted rounded-xl">
                      <p className="text-xs text-muted-foreground font-display mb-1">AI Confidence</p>
                      <p className="text-sm text-foreground font-display">{(selected.ai_confidence * 100).toFixed(0)}%</p>
                    </div>
                  )}

                  <div className="p-3 bg-muted rounded-xl">
                    <p className="text-xs text-muted-foreground font-display mb-1">Content ID</p>
                    <p className="text-xs font-mono text-foreground break-all">{selected.content_id}</p>
                  </div>

                  {selected.reviewed_at && (
                    <div className="p-3 bg-muted rounded-xl">
                      <p className="text-xs text-muted-foreground font-display">
                        Reviewed {formatDistanceToNow(new Date(selected.reviewed_at), { addSuffix: true })}
                      </p>
                    </div>
                  )}

                  {selected.status === "pending" && (
                    <DialogFooter className="flex gap-3 pt-2 sm:flex-row">
                      <Button
                        onClick={() => handleAction("dismissed")}
                        disabled={processing}
                        variant="outline"
                        className="flex-1 font-display rounded-xl"
                      >
                        {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                        Dismiss
                      </Button>
                      <Button
                        onClick={() => handleAction("actioned")}
                        disabled={processing}
                        variant="destructive"
                        className="flex-1 font-display rounded-xl"
                      >
                        {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Remove Content
                      </Button>
                    </DialogFooter>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModerationPage;
