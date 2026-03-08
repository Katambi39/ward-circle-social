import { useState, useRef } from "react";
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
import { Camera, MapPin, User, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import conectLogo from "@/assets/conect-logo.png";

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

  const steps = [
    { title: "Your Name", subtitle: "How should people know you?" },
    { title: "Your Location", subtitle: "Connect with your community" },
    { title: "Your Photo", subtitle: "Add a profile picture" },
  ];

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = data.publicUrl;
    }

    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim() || profile?.display_name,
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={conectLogo} alt="Conect" className="h-12 w-12 mx-auto mb-2" />
          <h1 className="font-display text-xl font-bold text-foreground">Welcome to Conect</h1>
          <p className="text-sm text-muted-foreground">Let's set up your profile</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "gradient-kenya" : "bg-muted"}`} />
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl shadow-card p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-1">{steps[step].title}</h2>
          <p className="text-sm text-muted-foreground mb-5">{steps[step].subtitle}</p>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <Label className="text-xs font-display">Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Wanjiku Kamau" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-display">Bio <span className="text-muted-foreground">(optional)</span></Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell your community about yourself..." className="rounded-xl mt-1" rows={3} maxLength={200} />
                </div>
              </motion.div>
            )}
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
                  <Input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Your ward" className="rounded-xl mt-1" />
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                  <button onClick={() => fileInputRef.current?.click()} className="relative h-24 w-24 rounded-full bg-muted overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary transition-colors">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                        <Camera className="h-6 w-6" />
                        <span className="text-[10px] font-display mt-1">Add photo</span>
                      </div>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">Tap to upload a profile photo. You can always change it later.</p>
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
              <Button onClick={() => setStep(step + 1)} className="rounded-xl gradient-kenya text-primary-foreground font-display flex-1 gap-1">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving} className="rounded-xl gradient-kenya text-primary-foreground font-display flex-1 gap-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? "Setting up..." : "Finish Setup"}
              </Button>
            )}
          </div>

          <button onClick={() => navigate("/")} className="w-full text-center text-xs text-muted-foreground font-display mt-4 hover:text-foreground">
            Skip for now
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
