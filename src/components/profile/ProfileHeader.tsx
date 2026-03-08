import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, MapPin, Camera, CheckCircle2, Clock, AlertCircle,
  Edit3, ImagePlus, Users, UserPlus,
} from "lucide-react";
import { motion } from "framer-motion";

interface ProfileHeaderProps {
  onEditClick: () => void;
  editing: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
}

const verificationConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  verified: {
    label: "Verified",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: "ID verified with National ID & phone number",
  },
  pending: {
    label: "Pending Verification",
    color: "bg-secondary/10 text-secondary border-secondary/20",
    icon: <Clock className="h-4 w-4" />,
    description: "Verification documents under review",
  },
  rejected: {
    label: "Verification Rejected",
    color: "bg-accent/10 text-accent border-accent/20",
    icon: <AlertCircle className="h-4 w-4" />,
    description: "Verification was rejected — please resubmit",
  },
  unverified: {
    label: "Unverified",
    color: "bg-muted text-muted-foreground border-border",
    icon: <Shield className="h-4 w-4" />,
    description: "Complete ID verification to unlock all features",
  },
};

const ProfileHeader = ({ onEditClick, editing, followerCount, followingCount, postCount }: ProfileHeaderProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
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
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl + "?t=" + Date.now() }).eq("user_id", user.id);
      await refreshProfile();
      toast({ title: "Avatar updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB for cover images", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image", variant: "destructive" });
      return;
    }
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/cover.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase.from("profiles").update({ cover_url: urlData.publicUrl + "?t=" + Date.now() } as any).eq("user_id", user.id);
      await refreshProfile();
      toast({ title: "Cover image updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  if (!profile) return null;

  const verification = verificationConfig[profile.verification_status] || verificationConfig.unverified;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl shadow-card overflow-hidden"
    >
      {/* Cover Image */}
      <div className="h-36 sm:h-44 relative group">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full gradient-kenya" />
        )}
        {/* Maasai-inspired border pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-secondary to-[hsl(var(--kenya-gold))]" />
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        <button
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="absolute top-3 right-3 bg-foreground/40 hover:bg-foreground/60 text-background rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {uploadingCover ? (
            <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </button>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-6">
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative group/avatar h-24 w-24 rounded-2xl bg-card border-4 border-card overflow-hidden shadow-elevated"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-3xl">
                {profile.display_name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="absolute inset-0 bg-foreground/0 group-hover/avatar:bg-foreground/40 transition-colors flex items-center justify-center">
              <Camera className="h-5 w-5 text-background opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          {profile.verification_status === "verified" && (
            <div className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-primary flex items-center justify-center border-2 border-card">
              <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-14 px-6 pb-5">
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
          {!editing && (
            <Button variant="outline" size="sm" onClick={onEditClick} className="rounded-full font-display gap-1.5">
              <Edit3 className="h-3.5 w-3.5" /> Edit Profile
            </Button>
          )}
        </div>

        {/* Verification & Location Badges */}
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

        {/* Verification Explanation */}
        <p className="mt-2 text-xs text-muted-foreground">{verification.description}</p>

        {profile.bio && !editing && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
        )}

        {/* Stats Row */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-foreground">{postCount}</span>
            <span className="text-muted-foreground">Posts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-display font-bold text-foreground">{followerCount}</span>
            <span className="text-muted-foreground">Followers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-display font-bold text-foreground">{followingCount}</span>
            <span className="text-muted-foreground">Following</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
