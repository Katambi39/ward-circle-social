import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Camera, CreditCard, CheckCircle2, Loader2, ArrowRight, AlertTriangle, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import conectLogo from "@/assets/conect-logo.png";

const VerifyIdentityPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const selfieInputRef = useRef<HTMLInputElement>(null);
  const idPhotoInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [nationalId, setNationalId] = useState("");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAlreadyVerified = profile?.verification_status === "verified";
  const isPending = profile?.verification_status === "pending";

  const steps = [
    { title: "National ID Number", subtitle: "Enter your Kenyan National ID number", icon: CreditCard },
    { title: "Selfie Photo", subtitle: "Take or upload a clear photo of yourself", icon: User },
    { title: "ID Photo", subtitle: "Upload a photo of your National ID card", icon: CreditCard },
    { title: "Confirm & Submit", subtitle: "Review your documents before submitting", icon: Shield },
  ];

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Photo must be under 5MB", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearFile = (
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void,
    ref: React.RefObject<HTMLInputElement>
  ) => {
    setFile(null);
    setPreview(null);
    if (ref.current) ref.current.value = "";
  };

  const canAdvance = () => {
    if (step === 0) return nationalId.trim().length >= 6;
    if (step === 1) return !!selfieFile;
    if (step === 2) return !!idPhotoFile;
    return true;
  };

  const handleSubmit = async () => {
    if (!user || !selfieFile || !idPhotoFile) return;
    setSaving(true);

    try {
      // Hash the national ID
      const encoder = new TextEncoder();
      const data = encoder.encode(nationalId.trim());
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Upload selfie
      const selfieExt = selfieFile.name.split(".").pop();
      const selfiePath = `${user.id}/selfie_${Date.now()}.${selfieExt}`;
      const { error: selfieError } = await supabase.storage
        .from("kyc-documents")
        .upload(selfiePath, selfieFile);
      if (selfieError) throw selfieError;

      // Upload ID photo
      const idExt = idPhotoFile.name.split(".").pop();
      const idPath = `${user.id}/id_photo_${Date.now()}.${idExt}`;
      const { error: idError } = await supabase.storage
        .from("kyc-documents")
        .upload(idPath, idPhotoFile);
      if (idError) throw idError;

      // Update profile
      const { error } = await supabase.from("profiles").update({
        national_id_hash: hashHex,
        verification_status: "pending",
      } as any).eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Verification submitted! 🎉",
        description: "Your documents are being reviewed. You'll be notified once verified.",
      });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isAlreadyVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-primary" />
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
          <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-10 w-10 text-accent animate-spin" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Verification Pending</h1>
          <p className="text-muted-foreground mb-6">Your documents are being reviewed. You'll be notified once approved.</p>
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
          <p className="text-sm text-muted-foreground">Required to join groups, access wallet & full features</p>
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
              {/* Step 0: National ID Number */}
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
                      Your National ID is securely hashed and never stored in plain text.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Selfie */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, setSelfieFile, setSelfiePreview)}
                  />

                  {selfiePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img src={selfiePreview} alt="Selfie" className="w-full max-h-64 object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => clearFile(setSelfieFile, setSelfiePreview, selfieInputRef)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => selfieInputRef.current?.click()}
                      className="w-full h-48 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="h-7 w-7 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-display font-medium text-foreground">Take or Upload Selfie</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Clear front-facing photo of your face</p>
                      </div>
                    </button>
                  )}

                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <User className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">Tips for a good selfie:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Face the camera directly</li>
                        <li>Good lighting, no shadows</li>
                        <li>Remove sunglasses or hats</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: ID Photo */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <input
                    ref={idPhotoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, setIdPhotoFile, setIdPhotoPreview)}
                  />

                  {idPhotoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img src={idPhotoPreview} alt="ID Photo" className="w-full max-h-64 object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => clearFile(setIdPhotoFile, setIdPhotoPreview, idPhotoInputRef)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => idPhotoInputRef.current?.click()}
                      className="w-full h-48 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-7 w-7 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-display font-medium text-foreground">Upload ID Photo</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Front side of your National ID card</p>
                      </div>
                    </button>
                  )}

                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <CreditCard className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">Tips for ID photo:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Place ID on a flat surface</li>
                        <li>All corners visible, no glare</li>
                        <li>Text should be readable</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                      <span className="text-xs font-display text-muted-foreground">National ID</span>
                      <span className="text-sm font-display font-medium">
                        {"•".repeat(Math.max(0, nationalId.length - 3))}{nationalId.slice(-3)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl overflow-hidden border border-border">
                        {selfiePreview && (
                          <div>
                            <img src={selfiePreview} alt="Selfie" className="w-full h-28 object-cover" />
                            <p className="text-[10px] font-display text-muted-foreground text-center py-1.5">Selfie</p>
                          </div>
                        )}
                      </div>
                      <div className="rounded-xl overflow-hidden border border-border">
                        {idPhotoPreview && (
                          <div>
                            <img src={idPhotoPreview} alt="ID" className="w-full h-28 object-cover" />
                            <p className="text-[10px] font-display text-muted-foreground text-center py-1.5">National ID</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Please ensure your details and photos are correct. Verification may take up to 24 hours. Once verified, you can join locality groups and access the wallet.
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
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canAdvance()}
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
