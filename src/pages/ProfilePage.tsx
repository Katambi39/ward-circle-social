import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KENYA_COUNTIES, SAMPLE_WARDS } from "@/data/kenyaLocalities";
import {
  Shield, MapPin, Phone, CreditCard, Edit3, Save, X, Camera,
  CheckCircle2, Clock, AlertCircle, UserCircle, Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Display name is required").max(50, "Max 50 characters"),
  username: z.string().trim().min(3, "Min 3 characters").max(30, "Max 30 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  bio: z.string().max(300, "Max 300 characters").optional().or(z.literal("")),
  county: z.string().optional().or(z.literal("")),
  ward: z.string().optional().or(z.literal("")),
  location: z.string().max(100, "Max 100 characters").optional().or(z.literal("")),
  phone_number: z.string().max(15, "Max 15 characters").optional().or(z.literal("")),
});

const verificationConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  verified: { label: "Verified", color: "bg-primary/10 text-primary border-primary/20", icon: <CheckCircle2 className="h-4 w-4" /> },
  pending: { label: "Pending", color: "bg-secondary/10 text-secondary border-secondary/20", icon: <Clock className="h-4 w-4" /> },
  rejected: { label: "Rejected", color: "bg-accent/10 text-accent border-accent/20", icon: <AlertCircle className="h-4 w-4" /> },
  unverified: { label: "Unverified", color: "bg-muted text-muted-foreground border-border", icon: <Shield className="h-4 w-4" /> },
};

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [county, setCounty] = useState("");
  const [ward, setWard] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setCounty(profile.county || "");
      setWard(profile.ward || "");
      setLocation(profile.location || "");
      setPhoneNumber(profile.phone_number || "");
    }
  }, [profile]);

  const handleSave = async () => {
    const result = profileSchema.safeParse({
      display_name: displayName,
      username,
      bio,
      county,
      ward,
      location,
      phone_number: phoneNumber,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim() || null,
          county: county || null,
          ward: ward || null,
          location: location.trim() || null,
          phone_number: phoneNumber.trim() || null,
        })
        .eq("user_id", user!.id);

      if (error) throw error;
      await refreshProfile();
      setEditing(false);
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB for avatars", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl + "?t=" + Date.now() })
        .eq("user_id", user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      toast({ title: "Avatar updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setCounty(profile.county || "");
      setWard(profile.ward || "");
      setLocation(profile.location || "");
      setPhoneNumber(profile.phone_number || "");
    }
    setErrors({});
    setEditing(false);
  };

  if (!profile) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-muted animate-pulse mx-auto mb-4" />
          <div className="h-5 w-48 bg-muted animate-pulse mx-auto rounded" />
        </div>
      </AppLayout>
    );
  }

  const verification = verificationConfig[profile.verification_status] || verificationConfig.unverified;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl shadow-card overflow-hidden mb-4"
        >
          {/* Banner */}
          <div className="h-28 gradient-kenya relative">
            <div className="absolute -bottom-10 left-6">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative group h-20 w-20 rounded-2xl bg-card border-4 border-card overflow-hidden shadow-elevated"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-2xl">
                    {profile.display_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                  <Camera className="h-5 w-5 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
              {profile.verification_status === "verified" && (
                <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-12 px-6 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  {profile.display_name}
                  {profile.verification_status === "verified" && (
                    <Shield className="h-5 w-5 text-primary fill-primary/20" />
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
              {!editing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="rounded-full font-display gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="rounded-full font-display gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full gradient-kenya text-primary-foreground font-display gap-1"
                  >
                    <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>

            {/* Verification Badge */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge className={`${verification.color} gap-1 font-display text-xs rounded-full border`}>
                {verification.icon}
                {verification.label}
              </Badge>
              {profile.county && (
                <Badge variant="outline" className="gap-1 font-display text-xs rounded-full">
                  <MapPin className="h-3 w-3" />
                  {profile.ward ? `${profile.ward}, ` : ""}{profile.county}
                </Badge>
              )}
            </div>

            {profile.bio && !editing && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </motion.div>

        {/* Edit Form / Info Cards */}
        {editing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Basic Info */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-card">
              <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" /> Basic Info
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-display">Display Name</Label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-lg" />
                    {errors.display_name && <p className="text-xs text-accent">{errors.display_name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-display">Username</Label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} className="rounded-lg" />
                    {errors.username && <p className="text-xs text-accent">{errors.username}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-display">Bio</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about yourself..."
                    className="rounded-lg resize-none"
                    rows={3}
                  />
                  <div className="flex justify-between">
                    {errors.bio && <p className="text-xs text-accent">{errors.bio}</p>}
                    <p className="text-xs text-muted-foreground ml-auto">{bio.length}/300</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Locality */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-card">
              <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-secondary" /> Locality
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-display">County</Label>
                    <Select value={county} onValueChange={(v) => { setCounty(v); setWard(""); }}>
                      <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select county" /></SelectTrigger>
                      <SelectContent>
                        {KENYA_COUNTIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-display">Ward</Label>
                    <Select value={ward} onValueChange={setWard}>
                      <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select ward" /></SelectTrigger>
                      <SelectContent>
                        {(SAMPLE_WARDS[county] || []).map((w) => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-display">Location (optional)</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Westlands" className="rounded-lg" />
                  {errors.location && <p className="text-xs text-accent">{errors.location}</p>}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-card">
              <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" /> Contact
              </h2>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-display">Phone Number</Label>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0712345678" className="rounded-lg" />
                  {errors.phone_number && <p className="text-xs text-accent">{errors.phone_number}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-display">Email</Label>
                  <Input value={user?.email || ""} disabled className="rounded-lg bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Info Cards */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-card">
              <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Verification
              </h2>
              <div className="space-y-3">
                <InfoRow
                  icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
                  label="National ID"
                  value={profile.national_id_hash ? "Submitted" : "Not submitted"}
                  status={profile.national_id_hash ? "done" : "pending"}
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                  label="Phone"
                  value={profile.phone_number || "Not set"}
                  status={profile.phone_number ? "done" : "pending"}
                />
                <InfoRow
                  icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                  label="Email"
                  value={user?.email || "—"}
                  status="done"
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-card">
              <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-secondary" /> Locality
              </h2>
              <div className="space-y-3">
                <InfoRow
                  icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                  label="County"
                  value={profile.county || "Not set"}
                  status={profile.county ? "done" : "pending"}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                  label="Ward"
                  value={profile.ward || "Not set"}
                  status={profile.ward ? "done" : "pending"}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                  label="Location"
                  value={profile.location || "Not set"}
                  status={profile.location ? "done" : "pending"}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "done" | "pending";
}) => (
  <div className="flex items-center gap-3">
    {icon}
    <div className="flex-1">
      <p className="text-xs text-muted-foreground font-display">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
    {status === "done" ? (
      <CheckCircle2 className="h-4 w-4 text-primary" />
    ) : (
      <Clock className="h-4 w-4 text-muted-foreground" />
    )}
  </div>
);

export default ProfilePage;
