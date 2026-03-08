import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Lock, Smartphone, Monitor, Shield, KeyRound, LogOut, AlertCircle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

const SecuritySettings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(false);
  const [autoLogout, setAutoLogout] = useState("30");

  const handlePasswordChange = async () => {
    if (newPw !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPw.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated ✓" });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
    setChangingPw(false);
  };

  const handleSignOutAll = async () => {
    await signOut();
    toast({ title: "Signed out of all devices" });
  };

  return (
    <div className="space-y-6">
      {/* Password */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" /> Password
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-display">Current Password</Label>
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label className="text-xs font-display">New Password</Label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label className="text-xs font-display">Confirm New Password</Label>
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="rounded-xl mt-1" />
          </div>
          <Button onClick={handlePasswordChange} disabled={changingPw || !newPw} size="sm" className="rounded-xl gradient-kenya text-primary-foreground font-display">
            {changingPw ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </section>

      <Separator />

      {/* Two-Factor Authentication */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Two-Factor Authentication
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-display font-medium text-foreground">Enable 2FA</p>
            <p className="text-xs text-muted-foreground">Add an extra layer of security via SMS or authenticator app</p>
          </div>
          <Switch checked={twoFAEnabled} onCheckedChange={(v) => { setTwoFAEnabled(v); toast({ title: v ? "2FA enabled (coming soon)" : "2FA disabled" }); }} />
        </div>
        {twoFAEnabled && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary font-display flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Full 2FA setup with SMS/authenticator will be available soon.
          </div>
        )}
      </section>

      <Separator />

      {/* Login Preferences */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" /> Login Preferences
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-display font-medium text-foreground">Biometric Login</p>
            <p className="text-xs text-muted-foreground">Use fingerprint or face ID to sign in</p>
          </div>
          <Switch checked={biometricLogin} onCheckedChange={(v) => { setBiometricLogin(v); toast({ title: v ? "Biometric login enabled (coming soon)" : "Biometric login disabled" }); }} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-display font-medium text-foreground">Auto-Logout Timer</p>
            <p className="text-xs text-muted-foreground">Automatically sign out after inactivity</p>
          </div>
          <select
            value={autoLogout}
            onChange={(e) => setAutoLogout(e.target.value)}
            className="text-xs rounded-lg border border-border bg-card px-2 py-1.5 font-display"
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="60">1 hour</option>
            <option value="never">Never</option>
          </select>
        </div>
      </section>

      <Separator />

      {/* Session Management */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary" /> Sessions
        </h3>
        <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-display font-medium text-foreground">Current Device</p>
                <p className="text-xs text-muted-foreground">Active now • {navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"}</p>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 rounded-full text-[10px]">Active</Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOutAll} className="rounded-xl font-display text-xs gap-1.5 w-full border-destructive/30 text-destructive hover:bg-destructive/5">
          <LogOut className="h-3.5 w-3.5" /> Sign Out All Devices
        </Button>
      </section>
    </div>
  );
};

export default SecuritySettings;
