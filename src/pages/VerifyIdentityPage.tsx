import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Phone, CreditCard, CheckCircle2, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import conectLogo from "@/assets/conect-logo.png";

const VerifyIdentityPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [nationalId, setNationalId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const isAlreadyVerified = profile?.verification_status === "verified";
  const isPending = profile?.verification_status === "pending";

  const steps = [
    { title: "National ID", subtitle: "Enter your Kenyan National ID number", icon: CreditCard },
    { title: "Phone Number", subtitle: "Enter your M-Pesa registered phone number", icon: Phone },
    { title: "Confirm", subtitle: "Review and submit your verification", icon: Shield },
  ];

  const handleSubmit = async () => {
    if (!user) return;
    if (!nationalId.trim() || !phoneNumber.trim()) {
      toast({ title: "Missing info", description: "Both National ID and phone number are required.", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Hash the national ID for privacy (simple hash for demo - in production use server-side hashing)
    const encoder = new TextEncoder();
    const data = encoder.encode(nationalId.trim());
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const { error } = await supabase.from("profiles").update({
      national_id_hash: hashHex,
      phone_number: phoneNumber.trim(),
      verification_status: "pending",
    } as any).eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({
        title: "Verification submitted! 🎉",
        description: "Your identity verification is being processed. You'll be notified once verified.",
      });
      navigate("/");
    }
    setSaving(false);
  };

  if (isAlreadyVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Already Verified</h1>
          <p className="text-muted-foreground mb-6">Your identity has been verified. You have full access to all features.</p>
          <Button onClick={() => navigate("/")} className="gradient-kenya text-primary-foreground font-display rounded-xl">
            Go to Feed
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-10 w-10 text-yellow-500 animate-spin" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Verification Pending</h1>
          <p className="text-muted-foreground mb-6">Your identity verification is being reviewed. You'll be notified once approved.</p>
          <Button onClick={() => navigate("/")} variant="outline" className="font-display rounded-xl">
            Back to Feed
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={conectLogo} alt="Conect" className="h-12 w-12 mx-auto mb-2" />
          <h1 className="font-display text-xl font-bold text-foreground">Verify Your Identity</h1>
          <p className="text-sm text-muted-foreground">Required to join locality groups and unlock full features</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "gradient-kenya" : "bg-muted"}`} />
          ))}
        </div>

        <Card className="shadow-elevated border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = steps[step].icon;
                return <div className="h-10 w-10 rounded-xl gradient-kenya flex items-center justify-center"><Icon className="h-5 w-5 text-primary-foreground" /></div>;
              })()}
              <div>
                <CardTitle className="font-display text-lg">{steps[step].title}</CardTitle>
                <CardDescription className="text-xs">{steps[step].subtitle}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-display">National ID Number</Label>
                    <Input
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 12345678"
                      className="rounded-xl text-lg tracking-wider"
                      maxLength={10}
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Your National ID is securely hashed and never stored in plain text. It's used only for verification purposes.
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-display">Phone Number (M-Pesa)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-display text-muted-foreground bg-muted px-3 py-2 rounded-xl">+254</span>
                      <Input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder="712345678"
                        className="rounded-xl flex-1"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Your phone number is used for identity verification and M-Pesa wallet integration.
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                      <span className="text-xs font-display text-muted-foreground">National ID</span>
                      <span className="text-sm font-display font-medium">
                        {"•".repeat(Math.max(0, nationalId.length - 3))}{nationalId.slice(-3)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                      <span className="text-xs font-display text-muted-foreground">Phone</span>
                      <span className="text-sm font-display font-medium">{phoneNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      Please ensure your details are correct. Verification may take up to 24 hours. Once verified, you can join ward, location, and county groups.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 mt-6">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl font-display flex-1">
                  Back
                </Button>
              )}
              {step < 2 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={(step === 0 && !nationalId.trim()) || (step === 1 && !phoneNumber.trim())}
                  className="rounded-xl gradient-kenya text-primary-foreground font-display flex-1 gap-1"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={saving} className="rounded-xl gradient-kenya text-primary-foreground font-display flex-1 gap-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {saving ? "Submitting..." : "Submit Verification"}
                </Button>
              )}
            </div>

            <button onClick={() => navigate("/")} className="w-full text-center text-xs text-muted-foreground font-display mt-4 hover:text-foreground">
              Skip for now
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyIdentityPage;
