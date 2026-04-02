import { useUserSettings } from "@/hooks/useUserSettings";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell, MessageSquare, Heart, Users, TrendingUp, Shield, Clock, Mail, Smartphone,
} from "lucide-react";

interface NotifToggle {
  settingKey: "notif_likes" | "notif_comments" | "notif_connections" | "notif_trending" | "notif_verification" | "notif_messages";
  label: string;
  description: string;
  icon: React.ElementType;
}

const notifItems: NotifToggle[] = [
  { settingKey: "notif_likes", label: "Likes & Upvotes", description: "When someone likes your post", icon: Heart },
  { settingKey: "notif_comments", label: "Comments", description: "When someone comments on your post", icon: MessageSquare },
  { settingKey: "notif_connections", label: "New Connections", description: "When someone follows you", icon: Users },
  { settingKey: "notif_trending", label: "Trending Mentions", description: "When your post starts trending", icon: TrendingUp },
  { settingKey: "notif_verification", label: "Verification Updates", description: "Status changes on your verification", icon: Shield },
  { settingKey: "notif_messages", label: "Direct Messages", description: "When you receive a new message", icon: MessageSquare },
];

const NotificationSettings = () => {
  const { settings, loading, updateSetting } = useUserSettings();

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Push Notifications
        </h3>

        <div className="space-y-3">
          {notifItems.map((item) => (
            <div key={item.settingKey} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-display font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Switch checked={settings[item.settingKey]} onCheckedChange={(v) => updateSetting(item.settingKey, v)} />
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Do Not Disturb */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Do Not Disturb
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-display font-medium text-foreground">Scheduled DND</p>
            <p className="text-xs text-muted-foreground">Silence notifications during set hours (EAT)</p>
          </div>
          <Switch checked={settings.dnd_enabled} onCheckedChange={(v) => updateSetting("dnd_enabled", v)} />
        </div>

        {settings.dnd_enabled && (
          <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-3 border border-border">
            <div className="flex-1">
              <label className="text-xs font-display text-muted-foreground">From</label>
              <input
                type="time"
                value={settings.dnd_start}
                onChange={(e) => updateSetting("dnd_start", e.target.value)}
                className="block w-full mt-0.5 text-sm bg-card border border-border rounded-lg px-2 py-1 font-display"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-display text-muted-foreground">To</label>
              <input
                type="time"
                value={settings.dnd_end}
                onChange={(e) => updateSetting("dnd_end", e.target.value)}
                className="block w-full mt-0.5 text-sm bg-card border border-border rounded-lg px-2 py-1 font-display"
              />
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* Email & SMS */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Email & SMS
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-display font-medium text-foreground">Email Notifications</p>
            <p className="text-xs text-muted-foreground">Receive summaries and important updates</p>
          </div>
          <Switch checked={settings.email_notifs} onCheckedChange={(v) => updateSetting("email_notifs", v)} />
        </div>

        {settings.email_notifs && (
          <div>
            <p className="text-xs font-display text-muted-foreground mb-1">Email Frequency</p>
            <select
              value={settings.email_frequency}
              onChange={(e) => updateSetting("email_frequency", e.target.value)}
              className="text-xs rounded-lg border border-border bg-card px-2 py-1.5 font-display w-full"
            >
              <option value="realtime">Real-time</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Summary</option>
            </select>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-display font-medium text-foreground flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-primary" /> SMS Notifications
            </p>
            <p className="text-xs text-muted-foreground">Critical alerts via your verified phone</p>
          </div>
          <Switch checked={settings.sms_notifs} onCheckedChange={(v) => updateSetting("sms_notifs", v)} />
        </div>
      </section>
    </div>
  );
};

export default NotificationSettings;
