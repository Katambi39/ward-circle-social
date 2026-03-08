export const STORY_FONTS = [
  { id: "clean", label: "Clean", family: "'DM Sans', sans-serif", weight: "400" },
  { id: "bold", label: "Bold", family: "'Space Grotesk', sans-serif", weight: "700" },
  { id: "serif", label: "Serif", family: "Georgia, 'Times New Roman', serif", weight: "400" },
  { id: "mono", label: "Mono", family: "'Courier New', Courier, monospace", weight: "600" },
  { id: "fancy", label: "Fancy", family: "'Brush Script MT', 'Segoe Script', cursive", weight: "400" },
  { id: "headline", label: "Headline", family: "'Impact', 'Arial Black', sans-serif", weight: "700" },
  { id: "handwritten", label: "Handwritten", family: "'Comic Sans MS', 'Chalkboard SE', cursive", weight: "400" },
] as const;

export const STORY_BACKGROUNDS = [
  { id: "gradient-sunset", label: "Sunset", css: "linear-gradient(135deg, #f97316, #ec4899, #a855f7)" },
  { id: "gradient-ocean", label: "Ocean", css: "linear-gradient(135deg, #06b6d4, #3b82f6, #6366f1)" },
  { id: "gradient-forest", label: "Forest", css: "linear-gradient(135deg, #22c55e, #14b8a6, #0ea5e9)" },
  { id: "gradient-fire", label: "Fire", css: "linear-gradient(135deg, #ef4444, #f97316, #eab308)" },
  { id: "gradient-night", label: "Night", css: "linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95)" },
  { id: "gradient-rose", label: "Rose", css: "linear-gradient(135deg, #fb7185, #f472b6, #c084fc)" },
  { id: "gradient-dark", label: "Dark", css: "linear-gradient(135deg, #18181b, #27272a, #3f3f46)" },
  { id: "gradient-warm", label: "Warm", css: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)" },
  { id: "gradient-kenya", label: "Kenya", css: "linear-gradient(135deg, #16a34a, #000000, #dc2626)" },
  { id: "solid-black", label: "Black", css: "#000000" },
  { id: "solid-white", label: "White", css: "#ffffff" },
  { id: "solid-blue", label: "Blue", css: "#2563eb" },
] as const;

export type StoryFont = typeof STORY_FONTS[number];
export type StoryBackground = typeof STORY_BACKGROUNDS[number];
