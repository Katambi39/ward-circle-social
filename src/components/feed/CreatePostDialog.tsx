import { useState, useRef } from "react";
import { Image, Link2, X, Eye, EyeOff, Users, Loader2 } from "lucide-react";
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

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GroupOption {
  id: string;
  name: string;
}

const CreatePostDialog = ({ open, onOpenChange }: CreatePostDialogProps) => {
  const { user, profile } = useAuth();
  const { isAnonymous: globalAnon, anonAlias } = useAnonymous();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(globalAnon);
  const [selectedGroup, setSelectedGroup] = useState<string>("none");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch user's groups when dialog opens
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
    setTitle("");
    setContent("");
    setLinkUrl("");
    setShowLinkInput(false);
    setImageFile(null);
    setImagePreview(null);
    setSelectedGroup("none");
    setSubmitting(false);
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

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if present
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim() || null,
        image_url: imageUrl,
        link_url: linkUrl.trim() || null,
        is_anonymous: isAnonymous,
        group_id: selectedGroup !== "none" ? selectedGroup : null,
      });

      if (error) throw error;

      toast.success("Post created!");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
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
            </p>
            <p className="text-xs text-muted-foreground">
              {isAnonymous ? "Anonymous identity" : `@${profile?.username}`}
            </p>
          </div>
        </div>

        {/* Title */}
        <Input
          placeholder="Post title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-display font-semibold"
          maxLength={200}
        />

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

        {/* Link input */}
        {showLinkInput && (
          <div className="flex items-center gap-2">
            <Input
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
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary gap-1.5 rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-4 w-4 text-primary" />
              <span className="text-xs font-display">Photo</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-secondary gap-1.5 rounded-full"
              onClick={() => setShowLinkInput(true)}
            >
              <Link2 className="h-4 w-4 text-secondary" />
              <span className="text-xs font-display">Link</span>
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
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
