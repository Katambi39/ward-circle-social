import { STORY_BACKGROUNDS, type StoryBackground } from "./storyConstants";
import { Check } from "lucide-react";

interface StoryBackgroundPickerProps {
  selected: StoryBackground;
  onSelect: (bg: StoryBackground) => void;
}

const StoryBackgroundPicker = ({ selected, onSelect }: StoryBackgroundPickerProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {STORY_BACKGROUNDS.map((bg) => (
        <button
          key={bg.id}
          onClick={() => onSelect(bg)}
          className={`shrink-0 h-9 w-9 rounded-full border-2 transition-all flex items-center justify-center ${
            selected.id === bg.id
              ? "border-primary scale-110 shadow-md"
              : "border-transparent hover:border-muted-foreground/30"
          }`}
          style={{ background: bg.css }}
        >
          {selected.id === bg.id && (
            <Check
              className="h-4 w-4"
              style={{
                color: bg.id.includes("white") || bg.id.includes("warm") ? "#000" : "#fff",
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default StoryBackgroundPicker;
