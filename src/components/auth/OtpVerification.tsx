import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, ArrowLeft, Loader2, KeyRound } from "lucide-react";
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
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
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

  const handleRecoveryVerify = async () => {
    if (!recoveryCode.trim()) return;
    setVerifying(true);
    try {
      const res = await supabase.functions.invoke("verify-recovery-code", {
        body: { email, code: recoveryCode },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Invalid recovery code");
      }

      // Use the token hash to verify the magic link OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token_hash: res.data.token_hash,
        type: "magiclink",
      });

      if (verifyError) throw verifyError;

      const remaining = res.data.remaining_codes ?? 0;
      if (remaining <= 2) {
        toast({
          title: "⚠️ Low recovery codes",
          description: `You have ${remaining} recovery code${remaining !== 1 ? "s" : ""} left. Generate new ones in Settings → Security.`,
          variant: "destructive",
        });
      }

      onVerified();
    } catch (error: any) {
      toast({ title: "Recovery failed", description: error.message, variant: "destructive" });
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
          {useRecovery ? (
            <KeyRound className="h-7 w-7 text-primary" />
          ) : (
            <Shield className="h-7 w-7 text-primary" />
          )}
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">
            {useRecovery ? "Recovery Code" : "Two-Factor Authentication"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {useRecovery ? (
              "Enter one of your backup recovery codes"
            ) : (
              <>
                Enter the 6-digit code sent to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {useRecovery ? (
        <div className="space-y-3">
          <Input
            placeholder="XXXX-XXXX"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
            className="rounded-xl text-center font-mono text-lg tracking-widest"
            maxLength={9}
          />
          <Button
            onClick={handleRecoveryVerify}
            disabled={!recoveryCode.trim() || verifying}
            className="w-full gradient-kenya text-primary-foreground font-display rounded-xl"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...
              </>
            ) : (
              "Verify Recovery Code"
            )}
          </Button>
        </div>
      ) : (
        <>
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
        </>
      )}

      <div className="flex items-center justify-between text-xs">
        <button
          onClick={useRecovery ? () => setUseRecovery(false) : onBack}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-display"
        >
          <ArrowLeft className="h-3 w-3" />
          {useRecovery ? "Back to OTP" : "Back to login"}
        </button>
        {useRecovery ? null : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUseRecovery(true)}
              className="text-primary hover:underline font-display"
            >
              Use recovery code
            </button>
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary hover:underline font-display"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtpVerification;
