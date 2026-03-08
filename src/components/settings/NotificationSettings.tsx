import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Bell, MessageSquare, Heart, Users, TrendingUp, Shield, Clock, Mail, Smartphone,
} from "lucide-react";

interface NotifToggle {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  default: boolean;
}

const notifItems: NotifToggle[] = [
  { key: "likes", label: "Likes & Upvotes", description: "When someone likes your post", icon: Heart, default: true },
  { key: "comments", label: "Comments", description: "When someone comments on your post", icon: MessageSquare, default: true },
  { key: "connections", label: "New Connections", description: "When someone follows you", icon: Users, default: true },
  { key: "trending", label: "Trending Mentions", description: "When your post starts trending", icon: TrendingUp, default: true },
  { key: "verification", label: "Verification Updates", description: "Status changes on your verification", icon: Shield, default: true },
  { key: "messages", label: "Direct Messages", description: "When you receive a new message", icon: MessageSquare, default: true },
];

const NotificationSettings = () => {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(notifItems.map((n) => [n.key, n.default]))
  );
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStart, setDndStart] = useState("22:00");
  const [dndEnd, setDndEnd] = useState("07:00");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState("daily");

  const toggle = (key: string) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Push Notifications
        </h3>

        <div className="space-y-3">
          {notifItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-display font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Switch checked={prefs[item.key]} onCheckedChange={() => toggle(item.key)} />
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
          <Switch checked={dndEnabled} onCheckedChange={setDndEnabled} />
        </div>

        {dndEnabled && (
          <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-3 border border-border">
            <div className="flex-1">
              <label className="text-xs font-display text-muted-foreground">From</label>
              <input
                type="time"
                value={dndStart}
                onChange={(e) => setDndStart(e.target.value)}
                className="block w-full mt-0.5 text-sm bg-card border border-border rounded-lg px-2 py-1 font-display"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-display text-muted-foreground">To</label>
              <input
                type="time"
                value={dndEnd}
                onChange={(e) => setDndEnd(e.target.value)}
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
          <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
        </div>

        {emailNotifs && (
          <div>
            <p className="text-xs font-display text-muted-foreground mb-1">Email Frequency</p>
            <select
              value={emailFrequency}
              onChange={(e) => setEmailFrequency(e.target.value)}
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
          <Switch checked={smsNotifs} onCheckedChange={setSmsNotifs} />
        </div>
      </section>
    </div>
  );
};

export default NotificationSettings;
