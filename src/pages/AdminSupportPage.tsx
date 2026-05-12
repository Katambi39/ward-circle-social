import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Mail, MessageSquare, ArrowLeft, Loader2, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SupportMessage {
  id: string;
  user_id: string | null;
  email: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface FeedbackItem {
  id: string;
  user_id: string | null;
  rating: number | null;
  message: string;
  created_at: string;
}

const AdminSupportPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("support");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [selected, setSelected] = useState<SupportMessage | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) check();
  }, [user]);

  const check = async () => {
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
    await fetchAll();
  };

  const fetchAll = async () => {
    setLoading(true);
    const [s, f] = await Promise.all([
      supabase.from("support_messages" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("feedback_submissions" as any).select("*").order("created_at", { ascending: false }),
    ]);
    if (s.data) setMessages(s.data as any);
    if (f.data) setFeedback(f.data as any);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string, adminNotes?: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("support_messages" as any)
      .update({ status, admin_notes: adminNotes ?? null })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Updated ✓" });
    setSelected(null);
    setNotes("");
    fetchAll();
  };

  if (isAdmin === false) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto py-12 px-4 text-center space-y-3">
          <h1 className="font-display text-xl font-bold">Admin only</h1>
          <p className="text-sm text-muted-foreground">You don't have access to this page.</p>
          <Button onClick={() => navigate("/")} variant="outline" className="rounded-xl">Go home</Button>
        </div>
      </AppLayout>
    );
  }

  const openCount = messages.filter((m) => m.status === "open").length;
  const avgRating = feedback.length
    ? (feedback.reduce((acc, f) => acc + (f.rating || 0), 0) / feedback.filter((f) => f.rating).length).toFixed(1)
    : "—";

  return (
    <AppLayout>
      <SEO title="Admin · Support & Feedback" description="Review support messages and user feedback" path="/admin/support" />
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Support & Feedback</h1>
          <p className="text-sm text-muted-foreground">Messages and feedback submitted by users.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Open tickets" value={openCount.toString()} icon={<Clock className="h-4 w-4" />} />
          <StatCard label="Total messages" value={messages.length.toString()} icon={<MessageSquare className="h-4 w-4" />} />
          <StatCard label="Avg rating" value={avgRating} icon={<Star className="h-4 w-4" />} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="support" className="rounded-lg gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Support ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="rounded-lg gap-1.5">
              <Star className="h-3.5 w-3.5" /> Feedback ({feedback.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="support" className="space-y-3 mt-4">
            {loading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            {!loading && messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No support messages yet.</p>
            )}
            {messages.map((m) => (
              <Card
                key={m.id}
                onClick={() => { setSelected(m); setNotes(m.admin_notes || ""); }}
                className="cursor-pointer hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full text-[10px]",
                            m.status === "open" && "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
                            m.status === "resolved" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                            m.status === "dismissed" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {m.status}
                        </Badge>
                        {m.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {m.email}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-2 line-clamp-2">{m.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-3 mt-4">
            {loading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            {!loading && feedback.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No feedback yet.</p>
            )}
            {feedback.map((f) => (
              <Card key={f.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-4 w-4",
                            s <= (f.rating || 0)
                              ? "text-kenya-gold fill-kenya-gold"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{f.message}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Support message</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                {selected.email && <p>From: {selected.email}</p>}
                <p>Submitted {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3 text-sm whitespace-pre-wrap">{selected.message}</div>
              <div>
                <label className="text-xs font-display font-medium block mb-1">Admin notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="rounded-lg text-sm"
                  placeholder="Internal notes (optional)"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateStatus(selected!.id, "dismissed", notes)}
              disabled={saving}
              className="rounded-xl"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => updateStatus(selected!.id, "resolved", notes)}
              disabled={saving}
              className="rounded-xl gap-1.5"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Mark resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <Card>
    <CardContent className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <p className="text-xl font-display font-bold text-foreground mt-1">{value}</p>
    </CardContent>
  </Card>
);

export default AdminSupportPage;
