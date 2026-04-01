import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, ArrowLeft, Loader2, CheckCircle2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import conectLogo from "@/assets/conect-logo.png";

const PhoneVerifyPage = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const formatPhone = (input: string) => {
    let cleaned = input.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "+254" + cleaned.slice(1);
    } else if (cleaned.startsWith("254") && !cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    } else if (!cleaned.startsWith("+")) {
      cleaned = "+254" + cleaned;
    }
    return cleaned;
  };

  const handleSendOtp = async () => {
    const formatted = formatPhone(phone);
    if (formatted.length < 12) {
      toast({ title: "Invalid phone number", description: "Enter a valid Kenyan phone number", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
      if (error) throw error;
      setPhone(formatted);
      setStep("otp");
      toast({ title: "Code sent! 📱", description: `OTP sent to ${formatted}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });
      if (error) throw error;

      // Update profile to verified
      if (user) {
        await supabase.from("profiles").update({
          verification_status: "verified",
          phone_number: phone,
        } as any).eq("user_id", user.id);
        await refreshProfile();
      }

      toast({ title: "Phone verified! ✅", description: "You can now join groups and communities." });
      navigate("/");
    } catch (e: any) {
      toast({ title: "Invalid code", description: e.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      toast({ title: "Code resent! 📱", description: "Check your SMS" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={conectLogo} alt="Conect" className="h-12 w-12 mx-auto mb-2" />
          <h1 className="font-display text-xl font-bold text-foreground">Verify Your Phone</h1>
          <p className="text-sm text-muted-foreground mt-1">Get verified to join groups & communities</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-card p-6">
          <AnimatePresence mode="wait">
            {step === "phone" && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-foreground">Enter Phone Number</h2>
                    <p className="text-xs text-muted-foreground">We'll send a 6-digit code via SMS</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-display">Phone Number</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="rounded-xl text-lg"
                    type="tel"
                  />
                  <p className="text-[10px] text-muted-foreground">Kenyan numbers only. Format: 07XX XXX XXX</p>
                </div>

                <div className="bg-muted rounded-lg p-3 flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Verifying your phone number confirms your identity and unlocks access to groups, communities, and more features.
                  </p>
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={sending || phone.replace(/\D/g, "").length < 9}
                  className="w-full rounded-xl gradient-kenya text-primary-foreground font-display"
                >
                  {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : "Send Verification Code"}
                </Button>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-foreground">Enter Code</h2>
                    <p className="text-xs text-muted-foreground">Sent to {phone}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={code.length !== 6 || verifying}
                  className="w-full rounded-xl gradient-kenya text-primary-foreground font-display"
                >
                  {verifying ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : "Verify & Continue"}
                </Button>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { setStep("phone"); setCode(""); }}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 font-display"
                  >
                    <ArrowLeft className="h-3 w-3" /> Change number
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={sending}
                    className="text-sm text-primary hover:underline font-display"
                  >
                    {sending ? "Sending..." : "Resend code"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => navigate("/")} className="w-full text-center text-xs text-muted-foreground font-display mt-4 hover:text-foreground">
          Skip for now
        </button>
      </motion.div>
    </div>
  );
};

export default PhoneVerifyPage;
