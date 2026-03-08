import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import EmojiPicker from "../feed/EmojiPicker";

const QUICK_REACTIONS = ["❤️", "🔥", "😂", "😮", "😢", "👏"];

interface StoryReplyBarProps {
  storyId: string;
  senderId: string;
  onSent?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const StoryReplyBar = ({ storyId, senderId, onSent, onFocus, onBlur }: StoryReplyBarProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendReply = async (content: string, type: "message" | "reaction") => {
    if (sending) return;
    setSending(true);
    const { error } = await supabase.from("story_replies" as any).insert({
      story_id: storyId,
      sender_id: senderId,
      reply_type: type,
      content,
    } as any);
    setSending(false);
    if (error) {
      toast.error("Failed to send reply");
      return;
    }
    if (type === "message") setMessage("");
    toast.success(type === "reaction" ? "Reaction sent!" : "Reply sent!");
    onSent?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    sendReply(trimmed, "message");
  };

  return (
    <div className="px-3 pb-3 space-y-2">
      {/* Quick reactions */}
      <div className="flex justify-center gap-3">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              sendReply(emoji, "reaction");
            }}
            disabled={sending}
            className="text-2xl hover:scale-125 active:scale-95 transition-transform disabled:opacity-50"
          >
            {emoji}
          </button>
        ))}
      </div>
      {/* Message input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Reply to story..."
          className="flex-1 bg-white/10 backdrop-blur-sm text-white text-sm rounded-full px-4 py-2 placeholder:text-white/40 border border-white/20 focus:outline-none focus:border-white/40"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default StoryReplyBar;
