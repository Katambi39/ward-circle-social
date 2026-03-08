import { STORY_FONTS, type StoryFont } from "./storyConstants";

interface StoryFontPickerProps {
  selected: StoryFont;
  onSelect: (font: StoryFont) => void;
}

const StoryFontPicker = ({ selected, onSelect }: StoryFontPickerProps) => {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {STORY_FONTS.map((font) => (
        <button
          key={font.id}
          onClick={() => onSelect(font)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs transition-all ${
            selected.id === font.id
              ? "bg-primary text-primary-foreground shadow-sm scale-105"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
          style={{ fontFamily: font.family, fontWeight: font.weight }}
        >
          {font.label}
        </button>
      ))}
    </div>
  );
};

export default StoryFontPicker;
