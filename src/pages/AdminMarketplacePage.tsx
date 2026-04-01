import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Shield, AlertTriangle, Clock, CheckCircle2, XCircle,
  Eye, ShoppingBag, Ban, RefreshCw, DollarSign, Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  listing_id: string | null;
  report_type: string;
  description: string;
  evidence_urls: string[];
  status: string;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter?: { display_name: string; username: string };
  reported_user?: { display_name: string; username: string } | null;
  listing?: { title: string; price: number } | null;
}

interface EscrowHold {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount: number;
  status: string;
  created_at: string;
  release_at: string;
  released_at: string | null;
  dispute_reason: string | null;
  buyer?: { display_name: string; username: string };
  seller?: { display_name: string; username: string };
  listing?: { title: string };
}

const REPORT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  scam: { label: "🚨 Scam", color: "text-destructive" },
  fake_item: { label: "🎭 Fake Item", color: "text-accent" },
  non_delivery: { label: "📦 Non-Delivery", color: "text-accent" },
  seller_dispute: { label: "⚠️ Seller Dispute", color: "text-secondary" },
  listing_violation: { label: "🚫 Listing Violation", color: "text-muted-foreground" },
  refund_request: { label: "💰 Refund Request", color: "text-primary" },
  other: { label: "📋 Other", color: "text-muted-foreground" },
};

const STATUS_BADGES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "outline", label: "Pending" },
  investigating: { variant: "secondary", label: "Investigating" },
  resolved: { variant: "default", label: "Resolved" },
  dismissed: { variant: "destructive", label: "Dismissed" },
};

const AdminMarketplacePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [escrows, setEscrows] = useState<EscrowHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [tab, setTab] = useState("reports");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    // Fetch reports
    const { data: reportsData } = await supabase
      .from("marketplace_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (reportsData && reportsData.length > 0) {
      const userIds = new Set<string>();
      const listingIds = new Set<string>();
      (reportsData as any[]).forEach((r) => {
        userIds.add(r.reporter_id);
        if (r.reported_user_id) userIds.add(r.reported_user_id);
        if (r.listing_id) listingIds.add(r.listing_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username")
        .in("user_id", [...userIds]);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      let listingMap = new Map();
      if (listingIds.size > 0) {
        const { data: listings } = await supabase
          .from("listings")
          .select("id, title, price")
          .in("id", [...listingIds]);
        listingMap = new Map((listings || []).map((l: any) => [l.id, l]));
      }

      setReports((reportsData as any[]).map((r) => ({
        ...r,
        reporter: profileMap.get(r.reporter_id),
        reported_user: r.reported_user_id ? profileMap.get(r.reported_user_id) : null,
        listing: r.listing_id ? listingMap.get(r.listing_id) : null,
      })));
    } else {
      setReports([]);
    }

    // Fetch escrow holds
    const { data: escrowData } = await supabase
      .from("escrow_holds")
      .select("*")
      .order("created_at", { ascending: false });

    if (escrowData && escrowData.length > 0) {
      const userIds = new Set<string>();
      const listingIds = new Set<string>();
      (escrowData as any[]).forEach((e) => {
        userIds.add(e.buyer_id);
        userIds.add(e.seller_id);
        listingIds.add(e.listing_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username")
        .in("user_id", [...userIds]);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      const { data: listings } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", [...listingIds]);
      const listingMap = new Map((listings || []).map((l: any) => [l.id, l]));

      setEscrows((escrowData as any[]).map((e) => ({
        ...e,
        buyer: profileMap.get(e.buyer_id),
        seller: profileMap.get(e.seller_id),
        listing: listingMap.get(e.listing_id),
      })));
    } else {
      setEscrows([]);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateReport = async () => {
    if (!selectedReport || !newStatus || !user) return;
    setUpdating(true);
    try {
      const { error } = await supabase.from("marketplace_reports").update({
        status: newStatus,
        admin_notes: adminNotes || null,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      } as any).eq("id", selectedReport.id);
      if (error) throw error;
      toast({ title: "Report updated" });
      setSelectedReport(null);
      setAdminNotes("");
      setNewStatus("");
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const filteredReports = filterStatus === "all"
    ? reports
    : reports.filter((r) => r.status === filterStatus);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(price);

  return (
    <AppLayout>
      <SEO title="Admin: Marketplace Reports" path="/admin/marketplace" />
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" /> Marketplace Admin
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Review reports, disputes, and escrow holds</p>
          </div>
          <Button variant="outline" onClick={fetchData} className="rounded-full font-display gap-1.5">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="w-full bg-card border border-border rounded-xl p-1">
            <TabsTrigger value="reports" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <AlertTriangle className="h-3.5 w-3.5" /> Reports ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="escrows" className="flex-1 rounded-lg font-display text-xs gap-1 data-[state=active]:gradient-kenya data-[state=active]:text-primary-foreground">
              <DollarSign className="h-3.5 w-3.5" /> Escrow Holds ({escrows.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {tab === "reports" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40 rounded-lg">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredReports.length === 0 ? (
                  <div className="text-center py-16">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-display text-muted-foreground">No reports to show</p>
                  </div>
                ) : (
                  filteredReports.map((report, i) => (
                    <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-card border border-border rounded-xl p-4 shadow-card cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => { setSelectedReport(report); setAdminNotes(report.admin_notes || ""); setNewStatus(report.status); }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-sm font-display font-bold ${REPORT_TYPE_LABELS[report.report_type]?.color || ""}`}>
                              {REPORT_TYPE_LABELS[report.report_type]?.label || report.report_type}
                            </span>
                            <Badge variant={STATUS_BADGES[report.status]?.variant || "outline"} className="text-[10px]">
                              {STATUS_BADGES[report.status]?.label || report.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
                            <span>By: @{report.reporter?.username}</span>
                            {report.reported_user && <span>Against: @{report.reported_user.username}</span>}
                            {report.listing && <span>Listing: {report.listing.title}</span>}
                            <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {tab === "escrows" && (
              <div className="space-y-4">
                {escrows.length === 0 ? (
                  <div className="text-center py-16">
                    <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-display text-muted-foreground">No escrow holds</p>
                  </div>
                ) : (
                  escrows.map((escrow, i) => (
                    <motion.div key={escrow.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-card border border-border rounded-xl p-4 shadow-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display font-bold text-sm text-foreground">
                            {formatPrice(Number(escrow.amount))}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {escrow.listing?.title || "Unknown listing"}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
                            <span>Buyer: @{escrow.buyer?.username}</span>
                            <span>Seller: @{escrow.seller?.username}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Release: {formatDistanceToNow(new Date(escrow.release_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <Badge variant={
                          escrow.status === "held" ? "outline" :
                          escrow.status === "released" ? "default" :
                          escrow.status === "disputed" ? "destructive" : "secondary"
                        } className="text-[10px]">
                          {escrow.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Report Detail Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={(open) => { if (!open) setSelectedReport(null); }}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-accent" /> Review Report
              </DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4 mt-2">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm">
                      {REPORT_TYPE_LABELS[selectedReport.report_type]?.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{selectedReport.description}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Reporter: @{selectedReport.reporter?.username} ({selectedReport.reporter?.display_name})</p>
                    {selectedReport.reported_user && (
                      <p>Reported: @{selectedReport.reported_user.username} ({selectedReport.reported_user.display_name})</p>
                    )}
                    {selectedReport.listing && (
                      <p>Listing: {selectedReport.listing.title} ({formatPrice(selectedReport.listing.price)})</p>
                    )}
                  </div>
                </div>

                {selectedReport.evidence_urls && selectedReport.evidence_urls.length > 0 && (
                  <div>
                    <p className="text-xs font-display font-bold mb-2">Evidence</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedReport.evidence_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Evidence {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-display font-bold">Update Status</p>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-display font-bold">Admin Notes</p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this report..."
                    rows={3}
                    className="rounded-lg"
                  />
                </div>

                <Button onClick={handleUpdateReport} disabled={updating} className="w-full rounded-xl gradient-kenya text-primary-foreground font-display">
                  {updating ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : "Update Report"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default AdminMarketplacePage;
