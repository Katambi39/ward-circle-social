import { useState, useRef, useEffect } from "react";
import { Image, Link2, X, Eye, EyeOff, Users, Loader2, BarChart3, Smile, Plus, Trash2, Video, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useAnonymous } from "@/contexts/AnonymousContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { PostDialogIntent } from "./CreatePostBar";
import { moderateContent } from "@/lib/moderation";

const FEELING_OPTIONS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😡", label: "Angry" },
  { emoji: "😂", label: "Amused" },
  { emoji: "😍", label: "In Love" },
  { emoji: "🤔", label: "Thoughtful" },
  { emoji: "🙏", label: "Grateful" },
  { emoji: "🔥", label: "Fired Up" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🥳", label: "Celebrating" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "✊", label: "Determined" },
];

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent?: PostDialogIntent;
  groupId?: string;
  groupName?: string;
}

interface GroupOption {
  id: string;
  name: string;
}

const CreatePostDialog = ({ open, onOpenChange, intent = "default", groupId, groupName }: CreatePostDialogProps) => {
  const { user, profile } = useAuth();
  const { isAnonymous: globalAnon, anonAlias } = useAnonymous();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const [anonTitle, setAnonTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(globalAnon);
  const [selectedGroup, setSelectedGroup] = useState<string>(groupId || "none");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupOption[]>(groupId && groupName ? [{ id: groupId, name: groupName }] : []);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<{ emoji: string; label: string } | null>(null);
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [showPoll, setShowPoll] = useState(false);

  // Sync anonymous state and group when dialog opens
  useEffect(() => {
    if (open) {
      setIsAnonymous(globalAnon);
      if (groupId) setSelectedGroup(groupId);
    }
  }, [open, globalAnon, groupId]);

  // Handle intents when dialog opens
  useEffect(() => {
    if (!open) return;
    if (intent === "photo") {
      setTimeout(() => fileInputRef.current?.click(), 300);
    } else if (intent === "video") {
      setTimeout(() => videoInputRef.current?.click(), 300);
    } else if (intent === "link") {
      setShowLinkInput(true);
      setTimeout(() => linkInputRef.current?.focus(), 300);
    } else if (intent === "poll") {
      setShowPoll(true);
      setPollOptions(["", ""]);
    } else if (intent === "feeling") {
      setShowFeelingPicker(true);
    }
  }, [open, intent]);

  const fetchGroups = async () => {
    if (!user) return;
    setLoadingGroups(true);
    const { data } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name)")
      .eq("user_id", user.id);

    if (data) {
      const mapped = data
        .map((gm: any) => gm.groups)
        .filter(Boolean)
        .map((g: any) => ({ id: g.id, name: g.name }));
      // If groupId is provided but not in fetched list, add it
      if (groupId && groupName && !mapped.find((g: GroupOption) => g.id === groupId)) {
        mapped.unshift({ id: groupId, name: groupName });
      }
      setGroups(mapped);
    }
    setLoadingGroups(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      fetchGroups();
      setIsAnonymous(globalAnon);
    } else {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const resetForm = () => {
    setAnonTitle("");
    setContent("");
    setLinkUrl("");
    setShowLinkInput(false);
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setSelectedGroup(groupId || "none");
    setSubmitting(false);
    setSelectedFeeling(null);
    setShowFeelingPicker(false);
    setPollOptions(["", ""]);
    setShowPoll(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video must be under 50MB");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) setPollOptions([...pollOptions, ""]);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const updatePollOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!content.trim() && !imageFile && !videoFile && !showPoll) {
      toast.error("Please add some content");
      return;
    }

    if (showPoll) {
      const filledOptions = pollOptions.filter((o) => o.trim());
      if (filledOptions.length < 2) {
        toast.error("Please add at least 2 poll options");
        return;
      }
    }

    setSubmitting(true);

    try {
      // Pre-check content with AI moderation
      const textToCheck = content.trim();
      const modResult = await moderateContent(textToCheck, "post");
      
      if (modResult.should_block) {
        toast.error(
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-semibold">Content blocked</p>
              <p className="text-xs mt-0.5">{modResult.reason}</p>
            </div>
          </div>
        );
        setSubmitting(false);
        return;
      }

      let imageUrl: string | null = null;
      let videoUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      if (videoFile) {
        const ext = videoFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("post-videos")
          .upload(path, videoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("post-videos")
          .getPublicUrl(path);
        videoUrl = urlData.publicUrl;
      }

      // Build content — feeling is stored separately, not mixed in
      let finalContent = content.trim();

      // Use anon title if provided, otherwise auto-generate from content
      const autoTitle = (isAnonymous && anonTitle.trim()) ? anonTitle.trim() : (finalContent || content.trim() || "Post").substring(0, 100);

      const { data: postData, error } = await supabase.from("posts").insert({
        user_id: user.id,
        title: autoTitle,
        content: finalContent || null,
        image_url: imageUrl,
        video_url: videoUrl,
        link_url: linkUrl.trim() || null,
        is_anonymous: isAnonymous,
        group_id: selectedGroup !== "none" ? selectedGroup : null,
        moderation_status: modResult.is_flagged ? "flagged" : "approved",
        moderation_reason: modResult.is_flagged ? modResult.reason : null,
        feeling: selectedFeeling ? `${selectedFeeling.emoji} ${selectedFeeling.label}` : null,
      } as any).select("id").single();

      if (error) throw error;

      // Log flagged content asynchronously
      if (modResult.is_flagged && postData) {
        moderateContent(textToCheck, "post", postData.id, user.id).catch(() => {});
      }

      // Create poll if needed
      if (showPoll && postData) {
        const filledOptions = pollOptions.filter((o) => o.trim());
        await supabase.from("post_polls").insert({
          post_id: postData.id,
          options: filledOptions,
        } as any);
      }

      if (modResult.is_flagged) {
        toast.warning("Post created but flagged for review by our moderation system.");
      } else {
        toast.success("Post created!");
      }
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (selectedGroup !== "none") {
        queryClient.invalidateQueries({ queryKey: ["group-posts", selectedGroup] });
      }
      handleOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Create Post</DialogTitle>
        </DialogHeader>

        {/* Author identity */}
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="h-10 w-10 rounded-full overflow-hidden shrink-0">
            {!isAnonymous && profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                {isAnonymous ? "?" : (profile?.display_name?.[0]?.toUpperCase() || "U")}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm truncate">
              {isAnonymous ? anonAlias : (profile?.display_name || "User")}
              {selectedFeeling && (
                <span className="text-muted-foreground font-normal"> — {selectedFeeling.emoji} Feeling {selectedFeeling.label}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAnonymous ? "Anonymous identity" : `@${profile?.username}`}
            </p>
          </div>
        </div>

        {/* Optional title for anonymous posts */}
        {isAnonymous && (
          <Input
            placeholder="Add a title (optional)"
            value={anonTitle}
            onChange={(e) => setAnonTitle(e.target.value)}
            className="font-display font-semibold"
            maxLength={200}
          />
        )}

        {/* Content */}

        {/* Content */}
        <Textarea
          placeholder="What's on your mind? Share with your community..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={5000}
        />

        {/* Image preview */}
        {imagePreview && (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img src={imagePreview} alt="Preview" className="w-full max-h-60 object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 rounded-full"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Video preview */}
        {videoPreview && (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <video src={videoPreview} controls className="w-full max-h-60" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 rounded-full"
              onClick={removeVideo}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Link input */}
        {showLinkInput && (
          <div className="flex items-center gap-2">
            <Input
              ref={linkInputRef}
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1"
            />
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => { setShowLinkInput(false); setLinkUrl(""); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Poll options */}
        {showPoll && (
          <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-display font-semibold text-foreground flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-accent" /> Poll Options
              </Label>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setShowPoll(false); setPollOptions(["", ""]); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            {pollOptions.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updatePollOption(index, e.target.value)}
                  className="flex-1 h-9 text-sm"
                  maxLength={100}
                />
                {pollOptions.length > 2 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removePollOption(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {pollOptions.length < 4 && (
              <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={addPollOption}>
                <Plus className="h-3.5 w-3.5" /> Add Option
              </Button>
            )}
          </div>
        )}

        {/* Feeling picker */}
        {showFeelingPicker && (
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-display font-semibold text-foreground flex items-center gap-1.5">
                <Smile className="h-3.5 w-3.5 text-kenya-gold" /> How are you feeling?
              </Label>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setShowFeelingPicker(false); setSelectedFeeling(null); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {FEELING_OPTIONS.map((feeling) => (
                <button
                  key={feeling.label}
                  onClick={() => { setSelectedFeeling(feeling); setShowFeelingPicker(false); }}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-lg text-center transition-colors ${
                    selectedFeeling?.label === feeling.label
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="text-xl">{feeling.emoji}</span>
                  <span className="text-[10px] text-muted-foreground font-display">{feeling.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Group selection */}
        <div className="space-y-2">
          <Label className="text-xs font-display text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Post to group
          </Label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">My Feed (no group)</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {isAnonymous ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
            <div>
              <p className="text-sm font-display font-medium">Post Anonymously</p>
              <p className="text-xs text-muted-foreground">Your identity will be hidden</p>
            </div>
          </div>
          <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoSelect}
            />
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1.5 rounded-full" onClick={() => fileInputRef.current?.click()}>
              <Image className="h-4 w-4 text-primary" />
              <span className="text-xs font-display hidden sm:inline">Photo</span>
            </Button>
            <Button variant="ghost" size="sm" className={`text-muted-foreground hover:text-secondary gap-1.5 rounded-full ${videoFile ? "bg-secondary/10 text-secondary" : ""}`} onClick={() => videoInputRef.current?.click()}>
              <Video className="h-4 w-4 text-secondary" />
              <span className="text-xs font-display hidden sm:inline">Video</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-secondary gap-1.5 rounded-full" onClick={() => setShowLinkInput(true)}>
              <Link2 className="h-4 w-4 text-secondary" />
              <span className="text-xs font-display hidden sm:inline">Link</span>
            </Button>
            <Button variant="ghost" size="sm" className={`text-muted-foreground hover:text-accent gap-1.5 rounded-full ${showPoll ? "bg-accent/10 text-accent" : ""}`} onClick={() => setShowPoll(!showPoll)}>
              <BarChart3 className="h-4 w-4 text-accent" />
              <span className="text-xs font-display hidden sm:inline">Poll</span>
            </Button>
            <Button variant="ghost" size="sm" className={`text-muted-foreground hover:text-kenya-gold gap-1.5 rounded-full ${selectedFeeling ? "bg-kenya-gold/10 text-kenya-gold" : ""}`} onClick={() => setShowFeelingPicker(!showFeelingPicker)}>
              <Smile className="h-4 w-4 text-kenya-gold" />
              <span className="text-xs font-display hidden sm:inline">{selectedFeeling ? selectedFeeling.emoji : "Feeling"}</span>
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (!content.trim() && !imageFile && !videoFile && !showPoll)}
            className="rounded-full gradient-kenya text-primary-foreground font-display gap-1.5"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
