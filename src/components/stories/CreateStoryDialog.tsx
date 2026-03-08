import { useState, useRef } from "react";
import { Camera, Type, X, Loader2, Music, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import MusicPicker from "./MusicPicker";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const CreateStoryDialog = ({ open, onOpenChange, onCreated }: CreateStoryDialogProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [showCaption, setShowCaption] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [visibility, setVisibility] = useState<"public" | "friends_only">("public");
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setCaption("");
    setShowCaption(false);
    setShowMusic(false);
    setSelectedTrack(null);
    setVisibility("public");
    setSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user || !file) return;
    setSubmitting(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("story-media")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("story-media")
        .getPublicUrl(path);

      const mediaType = file.type.startsWith("video") ? "video" : "image";

      const { error } = await supabase.from("stories").insert({
        user_id: user.id,
        media_url: urlData.publicUrl,
        media_type: mediaType,
        caption: caption.trim() || null,
        music_track_id: selectedTrack?.id || null,
        music_start_time: 0,
      } as any);

      if (error) throw error;

      toast.success("Story posted!");
      onCreated();
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to post story");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Create Story</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-32 w-32 rounded-2xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Camera className="h-8 w-8 text-primary" />
              <span className="text-xs font-display text-muted-foreground">Tap to select</span>
            </button>
            <p className="text-sm text-muted-foreground font-display">
              Photo or video · Up to 10MB · Disappears after 24h
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Preview */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[60vh]">
              {file?.type.startsWith("video") ? (
                <video src={preview} className="w-full h-full object-contain" controls muted />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={reset}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Caption overlay */}
              {showCaption && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <Input
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={200}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Music picker */}
            {showMusic && (
              <MusicPicker selectedTrack={selectedTrack} onSelect={setSelectedTrack} />
            )}

            {/* Selected track badge */}
            {selectedTrack && !showMusic && (
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5">
                <Music className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-display truncate">{selectedTrack.title} – {selectedTrack.artist}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-full"
                  onClick={() => setShowCaption(!showCaption)}
                >
                  <Type className="h-4 w-4" />
                  <span className="text-xs font-display">Caption</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-full"
                  onClick={() => setShowMusic(!showMusic)}
                >
                  <Music className="h-4 w-4 text-secondary" />
                  <span className="text-xs font-display">Music</span>
                </Button>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-full gradient-kenya text-primary-foreground font-display gap-1.5"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Share Story
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryDialog;
