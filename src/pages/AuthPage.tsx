import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, UserPlus, LogIn, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import conectLogo from "@/assets/conect-logo.png";
import OtpVerification from "@/components/auth/OtpVerification";
import PasskeyLogin from "@/components/auth/PasskeyLogin";

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpDisplayName, setSignUpDisplayName] = useState("");
  const [pending2FA, setPending2FA] = useState(false);
  const [twoFAEmail, setTwoFAEmail] = useState("");

  useEffect(() => {
    if (!authLoading && user && !pending2FA) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate, pending2FA]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPending2FA(true);
    try {
      await signIn(signInEmail, signInPassword);

      // Check if 2FA is enabled
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: twoFA } = await supabase
          .from("user_2fa")
          .select("is_enabled")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (twoFA?.is_enabled) {
          // Sign out and trigger email OTP
          await supabase.auth.signOut();
          await supabase.auth.signInWithOtp({ email: signInEmail });
          setTwoFAEmail(signInEmail);
          setLoading(false);
          toast({ title: "2FA Required 🔐", description: "Check your email for a verification code." });
          return;
        }
      }

      // No 2FA needed
      setPending2FA(false);
      toast({ title: "Karibu! 🇰🇪", description: "Welcome back to Conect." });
      navigate("/");
    } catch (error: any) {
      setPending2FA(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = () => {
    setPending2FA(false);
    toast({ title: "Karibu! 🇰🇪", description: "Welcome back to Conect." });
    navigate("/");
  };

  const handleOtpBack = () => {
    setPending2FA(false);
    setTwoFAEmail("");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(signUpEmail, signUpPassword, {
        username: signUpUsername,
        display_name: signUpDisplayName,
      });
      toast({ title: "Account created! 🎉", description: "Check your email for verification, then complete your profile." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try {
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSocialLoading(null);
    }
  };

  const handlePasskeySuccess = () => {
    toast({ title: "Karibu! 🇰🇪", description: "Signed in with passkey." });
    navigate("/");
  };

  const SocialButtons = () => (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2.5 font-display rounded-xl h-11"
        onClick={() => handleSocialLogin("google")}
        disabled={!!socialLoading}
      >
        {socialLoading === "google" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2.5 font-display rounded-xl h-11"
        onClick={() => handleSocialLogin("apple")}
        disabled={!!socialLoading}
      >
        {socialLoading === "apple" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-foreground">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        )}
        Continue with Apple
      </Button>
      <PasskeyLogin onSuccess={handlePasskeySuccess} />
    </div>
  );

  // Show OTP verification screen
  if (pending2FA && twoFAEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <img src={conectLogo} alt="Conect" className="h-16 w-16 mx-auto mb-3" />
            <h1 className="font-display text-3xl font-bold text-foreground">Conect</h1>
            <p className="text-muted-foreground mt-1">Kenya's Community Platform</p>
          </div>
          <Card className="shadow-elevated border-border">
            <CardContent className="pt-6">
              <OtpVerification
                email={twoFAEmail}
                onVerified={handleOtpVerified}
                onBack={handleOtpBack}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img src={conectLogo} alt="Conect" className="h-16 w-16 mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-foreground">Conect</h1>
          <p className="text-muted-foreground mt-1">Kenya's Community Platform</p>
        </div>

        <Card className="shadow-elevated border-border">
          <Tabs defaultValue="signin">
            <CardHeader className="pb-3">
              <TabsList className="w-full">
                <TabsTrigger value="signin" className="flex-1 gap-1.5 font-display">
                  <LogIn className="h-4 w-4" /> Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex-1 gap-1.5 font-display">
                  <UserPlus className="h-4 w-4" /> Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* SIGN IN */}
              <TabsContent value="signin">
                <div className="space-y-4">
                  <SocialButtons />

                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground font-display">or</span>
                    <Separator className="flex-1" />
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input id="signin-email" type="email" placeholder="you@example.com" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} required className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">Password</Label>
                        <button type="button" onClick={() => navigate("/reset-password")} className="text-xs text-primary font-display hover:underline">
                          Forgot password?
                        </button>
                      </div>
                      <Input id="signin-password" type="password" placeholder="••••••••" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} required className="rounded-xl" />
                    </div>
                    <Button type="submit" className="w-full gradient-kenya text-primary-foreground font-display rounded-xl" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              {/* SIGN UP */}
              <TabsContent value="signup">
                <div className="space-y-4">
                  <SocialButtons />

                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground font-display">or</span>
                    <Separator className="flex-1" />
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="username" className="text-xs">Username</Label>
                        <Input id="username" placeholder="@username" value={signUpUsername} onChange={e => setSignUpUsername(e.target.value)} required className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="displayname" className="text-xs">Display Name</Label>
                        <Input id="displayname" placeholder="Your name" value={signUpDisplayName} onChange={e => setSignUpDisplayName(e.target.value)} required className="rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-xs">Email</Label>
                      <Input id="signup-email" type="email" placeholder="you@example.com" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} required className="rounded-xl" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-xs">Password</Label>
                      <Input id="signup-password" type="password" placeholder="Min 6 characters" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} required minLength={6} className="rounded-xl" />
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <Eye className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        After signing up, you can verify your identity to join locality groups and unlock all features.
                      </p>
                    </div>

                    <Button type="submit" className="w-full gradient-kenya text-primary-foreground font-display rounded-xl" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthPage;
