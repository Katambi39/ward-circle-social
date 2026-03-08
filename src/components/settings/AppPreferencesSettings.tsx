import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Filter, Wifi, HardDrive, HelpCircle, MessageSquare, Star, Search, ShieldAlert,
} from "lucide-react";

const AppPreferencesSettings = () => {
  const { toast } = useToast();
  const [hideSensitive, setHideSensitive] = useState(true);
  const [safeSearch, setSafeSearch] = useState(true);
  const [localContent, setLocalContent] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [offlineAccess, setOfflineAccess] = useState(false);

  const handleClearCache = () => {
    if ('caches' in window) {
      caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
    }
    toast({ title: "Cache cleared ✓" });
  };

  return (
    <div className="space-y-6">
      {/* Content Filters */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" /> Content Filters
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Hide Sensitive Content
              </p>
              <p className="text-xs text-muted-foreground">Filter potentially sensitive trends and posts</p>
            </div>
            <Switch checked={hideSensitive} onCheckedChange={setHideSensitive} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" /> Safe Search
              </p>
              <p className="text-xs text-muted-foreground">Filter explicit content from search results</p>
            </div>
            <Switch checked={safeSearch} onCheckedChange={setSafeSearch} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Prioritize Local Content</p>
              <p className="text-xs text-muted-foreground">Show Kenyan and nearby content first</p>
            </div>
            <Switch checked={localContent} onCheckedChange={setLocalContent} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Storage & Performance */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-primary" /> Storage & Performance
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-primary" /> Data Saver Mode
              </p>
              <p className="text-xs text-muted-foreground">Reduce data usage — ideal for limited bundles</p>
            </div>
            <Switch checked={dataSaver} onCheckedChange={setDataSaver} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Offline Access</p>
              <p className="text-xs text-muted-foreground">Cache content for areas with spotty internet</p>
            </div>
            <Switch checked={offlineAccess} onCheckedChange={setOfflineAccess} />
          </div>

          <Button variant="outline" size="sm" onClick={handleClearCache} className="rounded-xl font-display text-xs gap-1.5 w-full">
            <HardDrive className="h-3.5 w-3.5" /> Clear Cache
          </Button>
        </div>
      </section>

      <Separator />

      {/* Help & Feedback */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" /> Help & Feedback
        </h3>

        <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5 w-full">
          <HelpCircle className="h-3.5 w-3.5" /> FAQs & Help Center
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5 w-full">
          <MessageSquare className="h-3.5 w-3.5" /> Contact Support
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5 w-full">
          <Star className="h-3.5 w-3.5" /> Send Feedback
        </Button>
        <p className="text-xs text-muted-foreground text-center">Your feedback helps us build a better Conect for Kenya 🇰🇪</p>
      </section>
    </div>
  );
};

export default AppPreferencesSettings;
