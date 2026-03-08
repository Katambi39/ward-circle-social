import { useState } from "react";
import { Loader2, Music, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { isExplicitLink } from "@/components/feed/LinkSafety";
import StoryFontPicker from "./StoryFontPicker";
import StoryBackgroundPicker from "./StoryBackgroundPicker";
import StoryVisibilityToggle from "./StoryVisibilityToggle";
import MusicPicker from "./MusicPicker";
import EmojiPicker from "../feed/EmojiPicker";
import { STORY_FONTS, STORY_BACKGROUNDS, type StoryFont, type StoryBackground } from "./storyConstants";

interface TextStoryCreatorProps {
  onBack: () => void;
  onCreated: () => void;
  onClose: () => void;
}

const TextStoryCreator = ({ onBack, onCreated, onClose }: TextStoryCreatorProps) => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [font, setFont] = useState<StoryFont>(STORY_FONTS[0]);
  const [background, setBackground] = useState<StoryBackground>(STORY_BACKGROUNDS[0]);
  const [visibility, setVisibility] = useState<"public" | "friends_only">("public");
  const [showMusic, setShowMusic] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const textColor = background.id.includes("white") || background.id.includes("warm") ? "#000000" : "#ffffff";

  const handleSubmit = async () => {
    if (!user || !text.trim()) {
      toast.error("Please enter some text");
      return;
    }

    // Check for explicit links in story text
    const urlsInText = text.match(/https?:\/\/[^\s)]+/gi) || [];
    if (urlsInText.some(u => isExplicitLink(u))) {
      toast.error("Explicit or adult content links are not allowed.");
      return;
    }

    setSubmitting(true);

    try {
      // Create a canvas to render text story as image
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d")!;

      // Draw background
      if (background.css.includes("gradient")) {
        // Parse gradient colors
        const colors = background.css.match(/#[a-f0-9]{6}/gi) || ["#000"];
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        colors.forEach((color, i) => gradient.addColorStop(i / (colors.length - 1), color));
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = background.css;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw text
      const fontSize = text.length > 100 ? 56 : text.length > 50 ? 72 : 96;
      ctx.fillStyle = textColor;
      ctx.font = `${font.weight} ${fontSize}px ${font.family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Word wrap
      const maxWidth = canvas.width - 120;
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = fontSize * 1.3;
      const startY = (canvas.height - lines.length * lineHeight) / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight + lineHeight / 2);
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png", 0.9)
      );

      const path = `${user.id}/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("story-media")
        .upload(path, blob, { contentType: "image/png" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("story-media")
        .getPublicUrl(path);

      const { error } = await supabase.from("stories").insert({
        user_id: user.id,
        media_url: urlData.publicUrl,
        media_type: "image",
        caption: null,
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

      {/* Preview */}
      <div
        className="relative rounded-xl overflow-hidden aspect-[9/16] max-h-[50vh] flex items-center justify-center p-6"
        style={{ background: background.css }}
      >
        {text ? (
          <p
            className="text-center break-words w-full leading-snug"
            style={{
              fontFamily: font.family,
              fontWeight: font.weight,
              color: textColor,
              fontSize: text.length > 100 ? "0.9rem" : text.length > 50 ? "1.1rem" : "1.4rem",
            }}
          >
            {text}
          </p>
        ) : (
          <p className="text-sm opacity-50" style={{ color: textColor }}>
            Start typing...
          </p>
        )}
      </div>

      {/* Text input */}
      <Textarea
        placeholder="What's on your mind?"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 300))}
        maxLength={300}
        rows={2}
        className="rounded-xl resize-none font-display text-sm"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <EmojiPicker onEmojiSelect={(emoji) => setText((prev) => (prev + emoji).slice(0, 300))} />
        <p className="text-[10px] text-muted-foreground">{text.length}/300</p>
      </div>

      {/* Font picker */}
      <div>
        <p className="text-[10px] font-display text-muted-foreground mb-1.5 uppercase tracking-wider">Font</p>
        <StoryFontPicker selected={font} onSelect={setFont} />
      </div>

      {/* Background picker */}
      <div>
        <p className="text-[10px] font-display text-muted-foreground mb-1.5 uppercase tracking-wider">Background</p>
        <StoryBackgroundPicker selected={background} onSelect={setBackground} />
      </div>

      {/* Music */}
      {showMusic && (
        <MusicPicker selectedTrack={selectedTrack} onSelect={setSelectedTrack} />
      )}
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
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 rounded-full"
          onClick={() => setShowMusic(!showMusic)}
        >
          <Music className="h-4 w-4 text-secondary" />
          <span className="text-xs font-display">Music</span>
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !text.trim()}
          className="rounded-full gradient-kenya text-primary-foreground font-display gap-1.5"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Share Story
        </Button>
      </div>
    </div>
  );
};

export default TextStoryCreator;
