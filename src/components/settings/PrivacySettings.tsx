import { useUserSettings } from "@/hooks/useUserSettings";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Eye, EyeOff, MapPin, Users, Globe, ShieldCheck, Ban, Flag, UserX,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PrivacySettings = () => {
  const { settings, loading, updateSetting } = useUserSettings();

  const visibilityOptions = [
    { value: "public", label: "Public", icon: Globe },
    { value: "friends", label: "Connections Only", icon: Users },
    { value: "verified", label: "Verified Users Only", icon: ShieldCheck },
  ];

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Visibility */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" /> Visibility Controls
        </h3>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-display font-medium text-foreground mb-1">Profile Visibility</p>
            <Select value={settings.profile_visibility} onValueChange={(v) => updateSetting("profile_visibility", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm font-display font-medium text-foreground mb-1">Post Default Visibility</p>
            <Select value={settings.post_visibility} onValueChange={(v) => updateSetting("post_visibility", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Location Sharing
              </p>
              <p className="text-xs text-muted-foreground">Show your county/ward on your profile</p>
            </div>
            <Switch checked={settings.location_sharing} onCheckedChange={(v) => updateSetting("location_sharing", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Show in Discover</p>
              <p className="text-xs text-muted-foreground">Allow others to find you in the discover section</p>
            </div>
            <Switch checked={settings.show_in_discover} onCheckedChange={(v) => updateSetting("show_in_discover", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Trend Participation</p>
              <p className="text-xs text-muted-foreground">Allow your posts to appear in trending</p>
            </div>
            <Switch checked={settings.trend_participation} onCheckedChange={(v) => updateSetting("trend_participation", v)} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Data & Permissions */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Data & Permissions
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Camera Access</p>
              <p className="text-xs text-muted-foreground">For photos, stories, and verification</p>
            </div>
            <Switch checked={settings.camera_permission} onCheckedChange={(v) => updateSetting("camera_permission", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Contacts Access</p>
              <p className="text-xs text-muted-foreground">Find friends from your contacts</p>
            </div>
            <Switch checked={settings.contacts_permission} onCheckedChange={(v) => updateSetting("contacts_permission", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Targeted Advertising</p>
              <p className="text-xs text-muted-foreground">Allow personalized ads based on activity</p>
            </div>
            <Switch checked={settings.targeted_ads} onCheckedChange={(v) => updateSetting("targeted_ads", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-medium text-foreground">Analytics & Insights</p>
              <p className="text-xs text-muted-foreground">Help improve Conect with usage data</p>
            </div>
            <Switch checked={settings.analytics_opt_in} onCheckedChange={(v) => updateSetting("analytics_opt_in", v)} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Blocking & Reporting */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Ban className="h-4 w-4 text-primary" /> Blocking & Reporting
        </h3>

        <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5 w-full">
          <UserX className="h-3.5 w-3.5" /> Manage Blocked Users
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5 w-full">
          <EyeOff className="h-3.5 w-3.5" /> Muted Trends & Topics
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl font-display text-xs gap-1.5 w-full">
          <Flag className="h-3.5 w-3.5" /> Report History
        </Button>
      </section>
    </div>
  );
};

export default PrivacySettings;
