import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, CheckCircle2, XCircle, Clock, Eye, ArrowLeft,
  User, MapPin, Loader2, AlertTriangle, Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface KYCSubmission {
  id: string;
  user_id: string;
  national_id_hash: string;
  selfie_path: string;
  id_photo_path: string;
  status: string;
  reviewer_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  profile: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    county: string | null;
    ward: string | null;
  } | null;
  selfie_url: string | null;
  id_photo_url: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

const AdminKYCPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [duplicateFlags, setDuplicateFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

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
    fetchSubmissions();
    fetchDuplicateFlags();
  };

  const fetchDuplicateFlags = async () => {
    const { data } = await supabase
      .from("duplicate_id_flags")
      .select("*")
      .order("created_at", { ascending: false });
    setDuplicateFlags(data ?? []);
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("kyc-admin", {
        body: { action: "list" },
      });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (e: any) {
      toast({ title: "Error loading submissions", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selectedSubmission) return;
    setReviewing(true);
    try {
      const { data, error } = await supabase.functions.invoke("kyc-admin", {
        body: {
          action: "review",
          submission_id: selectedSubmission.id,
          status,
          reviewer_notes: reviewNotes.trim() || null,
        },
      });
      if (error) throw error;
      toast({
        title: status === "approved" ? "Approved ✅" : "Rejected ❌",
        description: `Verification ${status}. User has been notified.`,
      });
      setSelectedSubmission(null);
      setReviewNotes("");
      fetchSubmissions();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setReviewing(false);
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

  const filtered = submissions.filter((s) => {
    if (activeTab === "all") return true;
    return s.status === activeTab;
  });

  const counts = {
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
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
              <Shield className="h-6 w-6 text-primary" /> KYC Review Panel
            </h1>
            <p className="text-sm text-muted-foreground">Review and manage identity verification requests</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pending", count: counts.pending, color: "text-yellow-500", bg: "bg-yellow-500/10" },
            { label: "Approved", count: counts.approved, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Rejected", count: counts.rejected, color: "text-destructive", bg: "bg-destructive/10" },
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
          <TabsList className="w-full grid grid-cols-5 rounded-xl">
            <TabsTrigger value="pending" className="rounded-xl font-display text-xs">
              Pending {counts.pending > 0 && `(${counts.pending})`}
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-xl font-display text-xs">Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-xl font-display text-xs">Rejected</TabsTrigger>
            <TabsTrigger value="duplicates" className="rounded-xl font-display text-xs">
              Duplicates {duplicateFlags.filter(f => !f.resolved).length > 0 && `(${duplicateFlags.filter(f => !f.resolved).length})`}
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-xl font-display text-xs">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-display">No {activeTab === "all" ? "" : activeTab} submissions</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filtered.map((sub, i) => {
                    const cfg = statusConfig[sub.status] || statusConfig.pending;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className="border-border hover:border-primary/30 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setReviewNotes(sub.reviewer_notes || "");
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                {sub.profile?.avatar_url ? (
                                  <img src={sub.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground text-sm font-display font-bold">
                                    {sub.profile?.display_name?.[0]?.toUpperCase() || "U"}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-display font-bold text-sm text-foreground">
                                    {sub.profile?.display_name || "Unknown User"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">@{sub.profile?.username || "unknown"}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {sub.profile?.county && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                      <MapPin className="h-3 w-3" /> {sub.profile.county}
                                      {sub.profile.ward && `, ${sub.profile.ward}`}
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${cfg.color} border text-[10px] font-display`}>
                                  <Icon className="h-3 w-3 mr-1" /> {cfg.label}
                                </Badge>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </div>
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
      <Dialog open={!!selectedSubmission} onOpenChange={(o) => !o && setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Review: {selectedSubmission.profile?.display_name || "User"}
                </DialogTitle>
                <DialogDescription>
                  @{selectedSubmission.profile?.username} • Submitted{" "}
                  {formatDistanceToNow(new Date(selectedSubmission.submitted_at), { addSuffix: true })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Status badge */}
                {(() => {
                  const cfg = statusConfig[selectedSubmission.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  return (
                    <Badge variant="outline" className={`${cfg.color} border font-display`}>
                      <Icon className="h-3 w-3 mr-1" /> {cfg.label}
                    </Badge>
                  );
                })()}

                {/* ID Hash */}
                <div className="p-3 bg-muted rounded-xl">
                  <p className="text-xs text-muted-foreground font-display mb-1">National ID Hash (SHA-256)</p>
                  <p className="text-xs font-mono text-foreground break-all">{selectedSubmission.national_id_hash}</p>
                </div>

                {/* Documents */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-display font-medium text-foreground mb-2 flex items-center gap-1">
                      <User className="h-3 w-3" /> Selfie
                    </p>
                    {selectedSubmission.selfie_url ? (
                      <a href={selectedSubmission.selfie_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={selectedSubmission.selfie_url}
                          alt="Selfie"
                          className="w-full rounded-xl border border-border object-cover aspect-[3/4] hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ) : (
                      <div className="w-full rounded-xl border border-border aspect-[3/4] flex items-center justify-center bg-muted">
                        <p className="text-xs text-muted-foreground">Unavailable</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-display font-medium text-foreground mb-2 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> ID Photo
                    </p>
                    {selectedSubmission.id_photo_url ? (
                      <a href={selectedSubmission.id_photo_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={selectedSubmission.id_photo_url}
                          alt="ID Photo"
                          className="w-full rounded-xl border border-border object-cover aspect-[3/4] hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ) : (
                      <div className="w-full rounded-xl border border-border aspect-[3/4] flex items-center justify-center bg-muted">
                        <p className="text-xs text-muted-foreground">Unavailable</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location info */}
                {selectedSubmission.profile?.county && (
                  <div className="p-3 bg-muted rounded-xl">
                    <p className="text-xs text-muted-foreground font-display mb-1">Location</p>
                    <p className="text-sm text-foreground font-display">
                      {selectedSubmission.profile.county}
                      {selectedSubmission.profile.ward && ` → ${selectedSubmission.profile.ward}`}
                    </p>
                  </div>
                )}

                {/* Review notes */}
                <div>
                  <p className="text-xs font-display font-medium text-foreground mb-2">Review Notes</p>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Optional notes about this review decision..."
                    className="rounded-xl text-sm"
                    rows={3}
                    disabled={selectedSubmission.status !== "pending"}
                  />
                </div>

                {/* Previous review info */}
                {selectedSubmission.reviewed_at && (
                  <div className="p-3 bg-muted rounded-xl">
                    <p className="text-xs text-muted-foreground font-display">
                      Reviewed {formatDistanceToNow(new Date(selectedSubmission.reviewed_at), { addSuffix: true })}
                    </p>
                    {selectedSubmission.reviewer_notes && (
                      <p className="text-sm text-foreground mt-1">{selectedSubmission.reviewer_notes}</p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {selectedSubmission.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handleReview("approved")}
                      disabled={reviewing}
                      className="flex-1 gradient-kenya text-primary-foreground font-display rounded-xl"
                    >
                      {reviewing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview("rejected")}
                      disabled={reviewing}
                      variant="destructive"
                      className="flex-1 font-display rounded-xl"
                    >
                      {reviewing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKYCPage;
