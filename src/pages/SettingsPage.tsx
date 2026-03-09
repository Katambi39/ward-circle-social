import { useState } from "react";
import SEO from "@/components/SEO";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import {
  UserCircle, Lock, Eye, Bell, Palette, Settings2, ChevronRight,
} from "lucide-react";
import AccountSettings from "@/components/settings/AccountSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import PrivacySettings from "@/components/settings/PrivacySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import AppPreferencesSettings from "@/components/settings/AppPreferencesSettings";

const sections = [
  { key: "account", label: "Account", icon: UserCircle, desc: "Profile, verification, data" },
  { key: "security", label: "Security", icon: Lock, desc: "Password, 2FA, sessions" },
  { key: "privacy", label: "Privacy", icon: Eye, desc: "Visibility, permissions, blocking" },
  { key: "notifications", label: "Notifications", icon: Bell, desc: "Alerts, DND, email/SMS" },
  { key: "appearance", label: "Appearance", icon: Palette, desc: "Theme, language, accessibility" },
  { key: "app", label: "App Preferences", icon: Settings2, desc: "Filters, storage, help" },
];

const SettingsPage = () => {
  const [active, setActive] = useState("account");
  const [mobileShowContent, setMobileShowContent] = useState(false);

  const handleSelect = (key: string) => {
    setActive(key);
    setMobileShowContent(true);
  };

  const renderContent = () => {
    switch (active) {
      case "account": return <AccountSettings />;
      case "security": return <SecuritySettings />;
      case "privacy": return <PrivacySettings />;
      case "notifications": return <NotificationSettings />;
      case "appearance": return <AppearanceSettings />;
      case "app": return <AppPreferencesSettings />;
      default: return <AccountSettings />;
    }
  };

  const activeSection = sections.find((s) => s.key === active);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-6 px-4">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your account, privacy, and preferences</p>

        <div className="flex gap-6">
          {/* Sidebar - hidden on mobile when content shown */}
          <div className={cn(
            "w-full sm:w-56 shrink-0 space-y-1",
            mobileShowContent ? "hidden sm:block" : "block"
          )}>
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => handleSelect(s.key)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-colors",
                  active === s.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <s.icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-medium">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate sm:block hidden">{s.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 sm:hidden text-muted-foreground" />
              </button>
            ))}
          </div>

          {/* Content */}
          <div className={cn(
            "flex-1 min-w-0",
            !mobileShowContent ? "hidden sm:block" : "block"
          )}>
            {/* Mobile back button */}
            <button
              onClick={() => setMobileShowContent(false)}
              className="sm:hidden flex items-center gap-1.5 text-sm font-display text-muted-foreground mb-4 hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              {activeSection?.label}
            </button>

            <div className="bg-card border border-border rounded-xl p-5 shadow-card">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
