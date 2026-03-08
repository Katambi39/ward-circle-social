import { useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Palette, Sun, Moon, Monitor, Type, Languages, Accessibility, ZoomIn, Eye,
} from "lucide-react";

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState("en");
  const [fontSize, setFontSize] = useState("medium");
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [simplifiedUI, setSimplifiedUI] = useState(false);

  const themes = [
    { value: "light", label: "Light", icon: Sun, desc: "Classic bright theme" },
    { value: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
    { value: "system", label: "System", icon: Monitor, desc: "Match your device" },
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "sw", label: "Kiswahili" },
    { value: "ki", label: "Gĩkũyũ" },
  ];

  return (
    <div className="space-y-6">
      {/* Theme */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" /> Theme
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                theme === t.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <t.icon className={`h-5 w-5 ${theme === t.value ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-xs font-display font-medium text-foreground">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Language */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Languages className="h-4 w-4 text-primary" /> Language
        </h3>

        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {languages.map((l) => (
              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">More languages coming soon including Dholuo, Kalenjin, and Luhya.</p>
      </section>

      <Separator />

      {/* Font Size */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" /> Text Size
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">A</span>
          <input
            type="range"
            min="0"
            max="2"
            value={fontSize === "small" ? 0 : fontSize === "medium" ? 1 : 2}
            onChange={(e) => setFontSize(["small", "medium", "large"][Number(e.target.value)])}
            className="flex-1 accent-primary"
          />
          <span className="text-lg text-muted-foreground">A</span>
        </div>
        <p className="text-xs text-muted-foreground font-display">
          Current: <span className="font-medium text-foreground capitalize">{fontSize}</span>
        </p>
      </section>

      <Separator />

      {/* Accessibility */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Accessibility className="h-4 w-4 text-primary" /> Accessibility
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
                <ZoomIn className="h-3.5 w-3.5 text-primary" /> High Contrast
              </p>
              <p className="text-xs text-muted-foreground">Increase contrast for better readability</p>
            </div>
            <Switch checked={highContrast} onCheckedChange={setHighContrast} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Reduced Motion</p>
              <p className="text-xs text-muted-foreground">Minimize animations throughout the app</p>
            </div>
            <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary" /> Simplified UI
              </p>
              <p className="text-xs text-muted-foreground">Reduce visual complexity for easier navigation</p>
            </div>
            <Switch checked={simplifiedUI} onCheckedChange={setSimplifiedUI} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AppearanceSettings;
