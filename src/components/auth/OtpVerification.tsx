import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, ArrowLeft, Loader2, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface OtpVerificationProps {
  /** For email 2FA mode: pass email */
  email?: string;
  /** For phone OTP mode: pass phone */
  phone?: string;
  /** Mode: 'email' for 2FA, 'phone' for phone sign-up/sign-in */
  mode?: "email" | "phone";
  onVerified: () => void;
  onBack: () => void;
}

const OtpVerification = ({
  email,
  phone,
  mode = "email",
  onVerified,
  onBack,
}: OtpVerificationProps) => {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const { toast } = useToast();
  const { verifyPhoneOtp } = useAuth();

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    try {
      if (mode === "phone" && phone) {
        await verifyPhoneOtp(phone, code);
      } else if (mode === "email" && email) {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: "email",
        });
        if (error) throw error;
      }
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
      if (mode === "phone" && phone) {
        await supabase.auth.signInWithOtp({ phone });
        toast({ title: "Code resent", description: "Check your SMS for a new code." });
      } else if (mode === "email" && email) {
        await supabase.auth.signInWithOtp({ email });
        toast({ title: "Code resent", description: "Check your email for a new code." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const isPhoneMode = mode === "phone";
  const displayTarget = isPhoneMode ? phone : email;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-primary/10 p-4 rounded-full mb-2">
            {isPhoneMode ? (
              <Smartphone className="w-size-8 h-8 text-primary" />
            ) : (
              <Shield className="w-size-8 h-8 text-primary" />
            )}
          </div>
          <h2 className="text-xl font-bold font-display">
            {isPhoneMode ? "Verify Phone Number" : "Two-Factor Authentication"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isPhoneMode ? (
              <>
                Enter the 6-digit code sent via SMS to{" "}
                <span className="font-semibold text-foreground">{displayTarget}</span>
              </>
            ) : (
              <>
                Enter the 6-digit code sent to{" "}
                <span className="font-semibold text-foreground">{displayTarget}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <Button
            className="w-full rounded-xl"
            onClick={handleVerify}
            disabled={code.length !== 6 || verifying}
          >
            {verifying ? (
              <><Loader2 className="animate-spin h-4 w-4" /> Verifying...</>
            ) : (
              isPhoneMode ? "Verify & Continue" : "Verify & Sign In"
            )}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-display"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-primary hover:underline font-display"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
