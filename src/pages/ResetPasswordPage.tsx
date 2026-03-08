import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import conectLogo from "@/assets/conect-logo.png";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Check if we have a recovery token in the URL
  useState(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("reset");
    }
  });

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Reset link sent! 📧", description: "Check your email for the password reset link." });
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated! ✓", description: "You can now sign in with your new password." });
      navigate("/auth");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={conectLogo} alt="Conect" className="h-12 w-12 mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold text-foreground">Reset Password</h1>
        </div>

        <Card className="shadow-elevated border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              {mode === "request" ? "Forgot Password" : "Set New Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "request" ? (
              sent ? (
                <div className="text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">We've sent a reset link to <strong>{email}</strong>. Check your inbox.</p>
                  <Button variant="outline" onClick={() => navigate("/auth")} className="rounded-full font-display">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <p className="text-sm text-muted-foreground">Enter your email and we'll send you a link to reset your password.</p>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full gradient-kenya text-primary-foreground font-display rounded-full">
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => navigate("/auth")} className="w-full font-display text-sm">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sign In
                  </Button>
                </form>
              )
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
                </div>
                <Button type="submit" disabled={loading} className="w-full gradient-kenya text-primary-foreground font-display rounded-full">
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
