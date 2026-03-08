import { useState, useRef } from "react";
import { Camera, Type, X, Loader2, Music, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { isExplicitLink } from "@/components/feed/LinkSafety";
import StoryFontPicker from "./StoryFontPicker";
import StoryVisibilityToggle from "./StoryVisibilityToggle";
import MusicPicker from "./MusicPicker";
import EmojiPicker from "../feed/EmojiPicker";
import { STORY_FONTS, type StoryFont } from "./storyConstants";

interface PhotoStoryCreatorProps {
  onBack: () => void;
  onCreated: () => void;
  onClose: () => void;
}

const PhotoStoryCreator = ({ onBack, onCreated, onClose }: PhotoStoryCreatorProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [showCaption, setShowCaption] = useState(false);
  const [captionFont, setCaptionFont] = useState<StoryFont>(STORY_FONTS[0]);
  const [showFonts, setShowFonts] = useState(false);
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

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setCaption("");
    setShowCaption(false);
    setShowFonts(false);
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
        visibility,
      } as any);

      if (error) throw error;

      toast.success("Story posted!");
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to post story");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-display">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

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
          <p className="text-sm text-muted-foreground font-display text-center">
            Photo or video · Up to 10MB · Disappears after 24h
          </p>
        </div>
      ) : (
        <>
          {/* Preview */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[50vh]">
            {file?.type.startsWith("video") ? (
              <video src={preview} className="w-full h-full object-contain" controls muted />
            ) : (
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            )}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={clearFile}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Caption overlay */}
            {showCaption && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent space-y-1">
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={200}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm flex-1"
                    style={{ fontFamily: captionFont.family, fontWeight: captionFont.weight }}
                    autoFocus
                  />
                  <EmojiPicker onEmojiSelect={(emoji) => setCaption((prev) => (prev + emoji).slice(0, 200))} />
                </div>
              </div>
            )}
          </div>

          {/* Font picker for caption */}
          {showFonts && showCaption && (
            <div>
              <p className="text-[10px] font-display text-muted-foreground mb-1.5 uppercase tracking-wider">Caption Font</p>
              <StoryFontPicker selected={captionFont} onSelect={setCaptionFont} />
            </div>
          )}

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

          {/* Visibility */}
          <StoryVisibilityToggle visibility={visibility} onChange={setVisibility} />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-full"
                onClick={() => { setShowCaption(!showCaption); if (!showCaption) setShowFonts(true); }}
              >
                <Type className="h-4 w-4" />
                <span className="text-xs font-display">Caption</span>
              </Button>
              {showCaption && (
                <Button
                  variant={showFonts ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1 rounded-full text-[10px]"
                  onClick={() => setShowFonts(!showFonts)}
                >
                  Aa
                </Button>
              )}
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
              Share
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PhotoStoryCreator;
