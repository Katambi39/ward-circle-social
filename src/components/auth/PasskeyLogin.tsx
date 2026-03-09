import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

interface PasskeyLoginProps {
  onSuccess: () => void;
}

const PasskeyLogin = ({ onSuccess }: PasskeyLoginProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isSupported =
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof navigator.credentials?.get === "function";

  const handlePasskeyLogin = async () => {
    if (!isSupported) {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support passkeys.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use discoverable credentials (resident keys)
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: window.location.hostname,
          userVerification: "required",
          timeout: 60000,
        },
      });

      if (!credential) throw new Error("No credential selected");

      const pubKeyCred = credential as PublicKeyCredential;
      const credentialId = bufferToBase64url(pubKeyCred.rawId);

      // Verify with backend and get session
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/passkey-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ credential_id: credentialId }),
        }
      );

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Passkey auth failed");

      // Complete sign-in with the magic link token
      const { error } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (error) throw error;
      onSuccess();
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        // User cancelled
        return;
      }
      toast({
        title: "Passkey login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2.5 font-display rounded-xl h-11"
      onClick={handlePasskeyLogin}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="h-5 w-5" />
      )}
      Sign in with Passkey
    </Button>
  );
};

export default PasskeyLogin;
