import { useState, useRef } from "react";
import { Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: "😊 Smileys", emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱"] },
  { label: "👋 Gestures", emojis: ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","💪","🦾"] },
  { label: "❤️ Hearts", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟"] },
  { label: "🎉 Symbols", emojis: ["⭐","🌟","✨","💫","🔥","💥","❗","❓","💯","🎉","🎊","🏆","🥇","🎯","🚀","💰","📌","🔔","🗣","💬","💭","🗨","👁‍🗨","🕊","🌍","🇰🇪"] },
  { label: "🍕 Food", emojis: ["🍎","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍑","🥭","🍍","🥥","🥑","🍕","🍔","🌮","🍣","🍦","☕","🍺","🥤","🧃"] },
  { label: "⚽ Activities", emojis: ["⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🏓","🏸","🥊","🎮","🎲","🎭","🎨","🎬","🎤","🎧","🎵","🎶","💃","🕺"] },
  { label: "🐶 Animals", emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦅","🦋","🐛","🐝"] },
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1.5 rounded-full">
          <Smile className="h-4 w-4 text-primary" />
          <span className="text-xs font-display hidden sm:inline">Emoji</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" side="top">
        {/* Category tabs */}
        <div className="flex overflow-x-auto border-b border-border px-1 py-1 gap-0.5 scrollbar-hide">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(i)}
              className={cn(
                "text-base px-1.5 py-1 rounded-md shrink-0 transition-colors",
                activeCategory === i ? "bg-primary/10" : "hover:bg-muted"
              )}
              title={cat.label}
            >
              {cat.emojis[0]}
            </button>
          ))}
        </div>
        {/* Emoji grid */}
        <div className="p-2 max-h-48 overflow-y-auto">
          <p className="text-[10px] text-muted-foreground font-display mb-1.5">{EMOJI_CATEGORIES[activeCategory].label}</p>
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onEmojiSelect(emoji);
                }}
                className="h-8 w-8 flex items-center justify-center text-lg rounded-md hover:bg-muted transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
