import { useState, useEffect } from "react";
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
  Fingerprint, Trash2, Loader2, Plus, CheckCircle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

const SecuritySettings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [autoLogout, setAutoLogout] = useState("30");

  // Passkey state
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [passkeysLoading, setPasskeysLoading] = useState(true);
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [showPasskeyDialog, setShowPasskeyDialog] = useState(false);

  const webAuthnSupported =
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof navigator.credentials?.create === "function";

  // Load 2FA settings and passkeys
  useEffect(() => {
    if (!user) return;
    
    const load = async () => {
      const [twoFAResult, passkeysResult] = await Promise.all([
        supabase.from("user_2fa").select("is_enabled").eq("user_id", user.id).maybeSingle(),
        supabase.from("webauthn_credentials").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      
      setTwoFAEnabled(twoFAResult.data?.is_enabled ?? false);
      setPasskeys(passkeysResult.data ?? []);
      setPasskeysLoading(false);
    };
    
    load();
  }, [user]);

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

  const handleToggle2FA = async (enabled: boolean) => {
    if (!user) return;
    setTwoFALoading(true);
    
    try {
      const { data: existing } = await supabase
        .from("user_2fa")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_2fa")
          .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_2fa")
          .insert({ user_id: user.id, is_enabled: enabled, method: "email_otp" });
      }

      setTwoFAEnabled(enabled);
      toast({
        title: enabled ? "2FA Enabled 🔐" : "2FA Disabled",
        description: enabled
          ? "You'll receive a verification code via email on each login."
          : "Two-factor authentication has been turned off.",
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    if (!user || !webAuthnSupported) return;
    setRegisteringPasskey(true);

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "Conect", id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.email!,
            displayName: passkeyName || "My Passkey",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            residentKey: "required",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });

      if (!credential) throw new Error("Registration cancelled");

      const pubKeyCred = credential as PublicKeyCredential;
      const response = pubKeyCred.response as AuthenticatorAttestationResponse;
      const publicKeyBytes = response.getPublicKey();

      const { error } = await supabase.from("webauthn_credentials").insert({
        user_id: user.id,
        credential_id: bufferToBase64url(pubKeyCred.rawId),
        public_key: publicKeyBytes ? bufferToBase64url(publicKeyBytes) : "",
        device_name: passkeyName || "My Passkey",
        transports: (response.getTransports?.() as string[]) ?? [],
      });

      if (error) throw error;

      // Refresh passkeys list
      const { data } = await supabase
        .from("webauthn_credentials")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPasskeys(data ?? []);
      setShowPasskeyDialog(false);
      setPasskeyName("");
      toast({ title: "Passkey registered! 🔑", description: "You can now sign in with biometrics." });
    } catch (error: any) {
      if (error.name === "NotAllowedError") return;
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    const { error } = await supabase.from("webauthn_credentials").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Passkey removed" });
    }
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
            <p className="text-sm font-display font-medium text-foreground">Email OTP</p>
            <p className="text-xs text-muted-foreground">Receive a 6-digit code via email on every login</p>
          </div>
          <Switch
            checked={twoFAEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={twoFALoading}
          />
        </div>
        {twoFAEnabled && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-700 dark:text-green-400 font-display flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            2FA is active. A verification code will be sent to your email each time you sign in.
          </div>
        )}
      </section>

      <Separator />

      {/* Passkeys / Biometric */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-primary" /> Passkeys & Biometrics
        </h3>
        <p className="text-xs text-muted-foreground">
          Sign in with fingerprint, face recognition, or a security key. Works on supported browsers and devices.
        </p>

        {!webAuthnSupported && (
          <div className="bg-muted border border-border rounded-xl p-3 text-xs text-muted-foreground font-display flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Your browser doesn't support passkeys. Try Chrome, Safari, or Edge on a modern device.
          </div>
        )}

        {/* Registered passkeys */}
        {passkeysLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : passkeys.length > 0 ? (
          <div className="space-y-2">
            {passkeys.map((pk) => (
              <div key={pk.id} className="flex items-center justify-between bg-muted/30 rounded-xl p-3 border border-border">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-display font-medium text-foreground">{pk.device_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Added {new Date(pk.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeletePasskey(pk.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 rounded-xl p-4 border border-border text-center">
            <Fingerprint className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No passkeys registered yet</p>
          </div>
        )}

        {/* Register passkey dialog */}
        {webAuthnSupported && (
          <Dialog open={showPasskeyDialog} onOpenChange={setShowPasskeyDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5 w-full">
                <Plus className="h-3.5 w-3.5" /> Add Passkey
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-primary" /> Register Passkey
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs font-display">Passkey Name</Label>
                  <Input
                    placeholder="e.g. My iPhone, Work Laptop"
                    value={passkeyName}
                    onChange={(e) => setPasskeyName(e.target.value)}
                    className="rounded-xl mt-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your device will prompt you for fingerprint, face recognition, or a PIN to create the passkey.
                </p>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleRegisterPasskey}
                  disabled={registeringPasskey}
                  className="w-full gradient-kenya text-primary-foreground font-display rounded-xl"
                >
                  {registeringPasskey ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Registering...</>
                  ) : (
                    "Register Passkey"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Native biometric note */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary font-display flex items-start gap-2">
          <Smartphone className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Native App Biometrics:</span> For dedicated fingerprint/Face ID on mobile, install Conect as a native app. Passkeys already support biometrics on web browsers.
          </div>
        </div>
      </section>

      <Separator />

      {/* Login Preferences */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" /> Login Preferences
        </h3>
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
