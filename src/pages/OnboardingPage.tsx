import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KENYA_COUNTIES } from "@/data/kenyaLocalities";
import { Camera, MapPin, User, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import conectLogo from "@/assets/conect-logo.png";

const MAX_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 200;
const MAX_AVATAR_SIZE = 3 * 1024 * 1024; // 3MB

const OnboardingPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [county, setCounty] = useState(profile?.county || "");
  const [ward, setWard] = useState(profile?.ward || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const steps = [
    { title: "Your Name", subtitle: "How should people know you?", icon: User },
    { title: "Your Location", subtitle: "Connect with your community", icon: MapPin },
    { title: "Your Photo", subtitle: "Add a profile picture", icon: Camera },
  ];

  const nameError = useMemo(() => {
    const trimmed = displayName.trim();
    if (!trimmed) return "Display name is required";
    if (trimmed.length < 2) return "Name must be at least 2 characters";
    if (trimmed.length > MAX_NAME_LENGTH) return `Name must be under ${MAX_NAME_LENGTH} characters`;
    return null;
  }, [displayName]);

  const canAdvance = (s: number) => {
    if (s === 0) return !nameError;
    return true; // location & avatar are optional
  };

  const handleNext = () => {
    if (step === 0) setTouched((t) => ({ ...t, displayName: true }));
    if (!canAdvance(step)) return;
    setStep(step + 1);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE) {
      toast({ title: "File too large", description: "Photo must be under 3MB", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    let avatarUrl = profile?.avatar_url || null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = data.publicUrl;
    }

    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      county: county || null,
      ward: ward.trim() || null,
      avatar_url: avatarUrl,
    } as any).eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Karibu Conect! 🇰🇪", description: "Your profile is set up." });
      navigate("/");
    }
    setSaving(false);
  };

  const StepIndicator = ({ index, label }: { index: number; label: string }) => {
    const done = index < step;
    const active = index === step;
    return (
      <div className="flex flex-col items-center gap-1 flex-1">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
          done ? "bg-primary text-primary-foreground" : active ? "gradient-kenya text-primary-foreground shadow-md scale-110" : "bg-muted text-muted-foreground"
        }`}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
        </div>
        <span className={`text-[10px] font-display transition-colors ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={conectLogo} alt="Conect" className="h-12 w-12 mx-auto mb-2" />
          <h1 className="font-display text-xl font-bold text-foreground">Welcome to Conect</h1>
          <p className="text-sm text-muted-foreground">Let's set up your profile</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-6 px-4">
          {steps.map((s, i) => (
            <StepIndicator key={i} index={i} label={s.title} />
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl shadow-card p-6">
          <div className="flex items-center gap-3 mb-5">
            {(() => {
              const Icon = steps[step].icon;
              return <div className="h-10 w-10 rounded-xl gradient-kenya flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-primary-foreground" /></div>;
            })()}
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">{steps[step].title}</h2>
              <p className="text-xs text-muted-foreground">{steps[step].subtitle}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Name & Bio */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-display">Display Name <span className="text-destructive">*</span></Label>
                    <span className={`text-[10px] font-display ${displayName.trim().length > MAX_NAME_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                      {displayName.trim().length}/{MAX_NAME_LENGTH}
                    </span>
                  </div>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
                    placeholder="e.g. Wanjiku Kamau"
                    className={`rounded-xl mt-1 ${touched.displayName && nameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    maxLength={MAX_NAME_LENGTH + 10}
                  />
                  {touched.displayName && nameError && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {nameError}
                    </motion.p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-display">Bio <span className="text-muted-foreground">(optional)</span></Label>
                    <span className={`text-[10px] font-display ${bio.length > MAX_BIO_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                      {bio.length}/{MAX_BIO_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your community about yourself..."
                    className="rounded-xl mt-1"
                    rows={3}
                    maxLength={MAX_BIO_LENGTH}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 1: Location */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <Label className="text-xs font-display flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> County</Label>
                  <Select value={county} onValueChange={setCounty}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select your county" /></SelectTrigger>
                    <SelectContent>
                      {KENYA_COUNTIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-display">Ward <span className="text-muted-foreground">(optional)</span></Label>
                  <Input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Your ward" className="rounded-xl mt-1" maxLength={100} />
                </div>
                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Your location helps you discover nearby communities, groups, and marketplace listings.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Avatar */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                  <button onClick={() => fileInputRef.current?.click()} className="relative h-28 w-28 rounded-full bg-muted overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary transition-all hover:scale-105 group">
                    {avatarPreview ? (
                      <>
                        <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                          <Camera className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </>
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                        <Camera className="h-7 w-7" />
                        <span className="text-[10px] font-display mt-1">Add photo</span>
                      </div>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground text-center max-w-[240px]">
                    {avatarPreview ? "Looking good! Tap to change your photo." : "Tap to upload a profile photo. Max 3MB. You can always change it later."}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center gap-3 mt-6">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl font-display flex-1">
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button
                onClick={handleNext}
                disabled={!canAdvance(step)}
                className="rounded-xl gradient-kenya text-primary-foreground font-display flex-1 gap-1"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving || !!nameError} className="rounded-xl gradient-kenya text-primary-foreground font-display flex-1 gap-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? "Setting up..." : "Finish Setup"}
              </Button>
            )}
          </div>

          <button onClick={() => navigate("/")} className="w-full text-center text-xs text-muted-foreground font-display mt-4 hover:text-foreground transition-colors">
            Skip for now
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
