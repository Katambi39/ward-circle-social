import { Globe, Users } from "lucide-react";

interface StoryVisibilityToggleProps {
  visibility: "public" | "friends_only";
  onChange: (v: "public" | "friends_only") => void;
}

const StoryVisibilityToggle = ({ visibility, onChange }: StoryVisibilityToggleProps) => {
  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1.5">
      <button
        onClick={() => onChange("public")}
        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-display transition-colors ${
          visibility === "public"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Globe className="h-3.5 w-3.5" />
        Public
      </button>
      <button
        onClick={() => onChange("friends_only")}
        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-display transition-colors ${
          visibility === "friends_only"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Users className="h-3.5 w-3.5" />
        Friends Only
      </button>
    </div>
  );
};

export default StoryVisibilityToggle;
