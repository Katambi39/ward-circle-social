import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, UserPlus, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import conectLogo from "@/assets/conect-logo.png";

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up state
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpDisplayName, setSignUpDisplayName] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpNationalId, setSignUpNationalId] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(signInEmail, signInPassword);
      toast({ title: "Karibu! 🇰🇪", description: "Welcome back to Conect." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpNationalId || !signUpPhone) {
      toast({ title: "Verification required", description: "Both National ID and phone number are required for verification.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signUp(signUpEmail, signUpPassword, {
        username: signUpUsername,
        display_name: signUpDisplayName,
      });
      toast({ title: "Account created! 🎉", description: "Check your email for verification. Your National ID and phone will be verified shortly." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
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
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" type="email" placeholder="you@example.com" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" type="password" placeholder="••••••••" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full gradient-kenya text-primary-foreground font-display" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* SIGN UP */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-3">
                  <CardDescription className="flex items-center gap-2 p-3 bg-muted rounded-lg text-xs">
                    <Shield className="h-4 w-4 text-primary shrink-0" />
                    National ID and phone verification required for verified accounts.
                  </CardDescription>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-xs">Username</Label>
                      <Input id="username" placeholder="@username" value={signUpUsername} onChange={e => setSignUpUsername(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="displayname" className="text-xs">Display Name</Label>
                      <Input id="displayname" placeholder="Your name" value={signUpDisplayName} onChange={e => setSignUpDisplayName(e.target.value)} required />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs">Email</Label>
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Min 6 characters" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} required minLength={6} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="national-id" className="text-xs flex items-center gap-1">
                        <Shield className="h-3 w-3 text-primary" /> National ID
                      </Label>
                      <Input id="national-id" placeholder="e.g. 12345678" value={signUpNationalId} onChange={e => setSignUpNationalId(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs">Phone (M-Pesa)</Label>
                      <Input id="phone" placeholder="0712345678" value={signUpPhone} onChange={e => setSignUpPhone(e.target.value)} required />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <Eye className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Want to post anonymously? You can enable <strong>Toboa Siri</strong> mode after creating your verified account.
                    </p>
                  </div>

                  <Button type="submit" className="w-full gradient-kenya text-primary-foreground font-display" disabled={loading}>
                    {loading ? "Creating account..." : "Create Verified Account"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthPage;
