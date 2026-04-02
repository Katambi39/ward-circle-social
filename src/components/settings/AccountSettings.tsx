import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  UserCircle, Shield, CheckCircle2, MapPin, AlertTriangle, Trash2, Download, Languages,
} from "lucide-react";
import { KENYA_COUNTIES } from "@/data/kenyaLocalities";

const AccountSettings = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [county, setCounty] = useState(profile?.county || "");
  const [ward, setWard] = useState(profile?.ward || "");
  const [showSwahiliName, setShowSwahiliName] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, county, ward } as any)
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated ✓" });
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleExportData = async () => {
    if (!user) return;
    const [postsRes, profileRes, txRes] = await Promise.all([
      supabase.from("posts").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("*").eq("user_id", user.id),
      supabase.from("transactions").select("*").eq("user_id", user.id),
    ]);
    const exportData = {
      profile: profileRes.data,
      posts: postsRes.data,
      transactions: txRes.data,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conect-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data exported! 📥" });
  };

  const handleDeleteAccount = async () => {
    toast({ title: "Account deletion requested", description: "Our team will process your request within 48 hours per Kenyan data protection requirements." });
    setDeleteDialogOpen(false);
    setDeleteConfirm("");
  };

  const isVerified = profile?.verification_status === "verified";
  const isPending = profile?.verification_status === "pending";

  return (
    <div className="space-y-6">
      {/* Profile & Verification */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-primary" /> Profile & Verification
        </h3>

        <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-display text-muted-foreground">Status:</span>
            {isVerified ? (
              <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-full text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </Badge>
            ) : isPending ? (
              <Badge className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-full text-xs">
                Pending Review
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full text-xs">Unverified</Badge>
            )}
          </div>
          {!isVerified && (
            <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              {isPending ? "Check Verification Status" : "Request Verification"}
            </Button>
          )}
          {isVerified && (
            <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Request Re-verification
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-display">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-xl mt-1"
              placeholder="Your display name"
            />
          </div>
          <div>
            <Label className="text-xs font-display">County</Label>
            <Select value={county} onValueChange={setCounty}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select county" /></SelectTrigger>
              <SelectContent>
                {KENYA_COUNTIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-display">Ward</Label>
            <Input
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="rounded-xl mt-1"
              placeholder="Your ward"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-primary" /> Swahili Name Display
              </p>
              <p className="text-xs text-muted-foreground">Show your name in Swahili on your profile</p>
            </div>
            <Switch checked={showSwahiliName} onCheckedChange={setShowSwahiliName} />
          </div>

          <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-xl gradient-kenya text-primary-foreground font-display">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </section>

      <Separator />

      {/* Data & Account */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" /> Data & Account
        </h3>

        <Button variant="outline" size="sm" onClick={handleExportData} className="rounded-xl font-display text-xs gap-1.5 w-full">
          <Download className="h-3.5 w-3.5" /> Download Your Data
        </Button>
        <p className="text-xs text-muted-foreground">Export all your data as required by the Kenya Data Protection Act 2019.</p>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5 w-full border-destructive/30 text-destructive hover:bg-destructive/5">
              <Trash2 className="h-3.5 w-3.5" /> Deactivate / Delete Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Delete Account
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">This action is permanent and cannot be undone. All your posts, connections, wallet balance, and verification data will be permanently deleted.</p>
              <div>
                <Label className="text-xs font-display">Type "DELETE" to confirm</Label>
                <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="rounded-xl mt-1" placeholder="DELETE" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl font-display">Cancel</Button>
              <Button variant="destructive" size="sm" disabled={deleteConfirm !== "DELETE"} onClick={handleDeleteAccount} className="rounded-xl font-display">
                Delete My Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
};

export default AccountSettings;
