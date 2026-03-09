import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OtpVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

const OtpVerification = ({ email, onVerified, onBack }: OtpVerificationProps) => {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) throw error;
      onVerified();
    } catch (error: any) {
      toast({ title: "Invalid code", description: error.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await supabase.auth.signInWithOtp({ email });
      toast({ title: "Code resent", description: "Check your email for a new code." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">
            Two-Factor Authentication
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup>
            <InputOTPSlot index={0} className="rounded-lg border-border" />
            <InputOTPSlot index={1} className="rounded-lg border-border" />
            <InputOTPSlot index={2} className="rounded-lg border-border" />
            <InputOTPSlot index={3} className="rounded-lg border-border" />
            <InputOTPSlot index={4} className="rounded-lg border-border" />
            <InputOTPSlot index={5} className="rounded-lg border-border" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={handleVerify}
        disabled={code.length !== 6 || verifying}
        className="w-full gradient-kenya text-primary-foreground font-display rounded-xl"
      >
        {verifying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...
          </>
        ) : (
          "Verify & Sign In"
        )}
      </Button>

      <div className="flex items-center justify-between text-xs">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-display"
        >
          <ArrowLeft className="h-3 w-3" /> Back to login
        </button>
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-primary hover:underline font-display"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </div>
    </div>
  );
};

export default OtpVerification;
