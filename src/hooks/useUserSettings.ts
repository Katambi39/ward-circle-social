import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UserSettings {
  // Privacy
  profile_visibility: string;
  post_visibility: string;
  location_sharing: boolean;
  show_in_discover: boolean;
  trend_participation: boolean;
  camera_permission: boolean;
  contacts_permission: boolean;
  targeted_ads: boolean;
  analytics_opt_in: boolean;
  // Notifications
  notif_likes: boolean;
  notif_comments: boolean;
  notif_connections: boolean;
  notif_trending: boolean;
  notif_verification: boolean;
  notif_messages: boolean;
  dnd_enabled: boolean;
  dnd_start: string;
  dnd_end: string;
  email_notifs: boolean;
  sms_notifs: boolean;
  email_frequency: string;
  // Appearance
  language: string;
  font_size: string;
  high_contrast: boolean;
  reduced_motion: boolean;
  simplified_ui: boolean;
  // App Preferences
  hide_sensitive: boolean;
  safe_search: boolean;
  local_content: boolean;
  data_saver: boolean;
  offline_access: boolean;
  // Security
  auto_logout: string;
}

const defaultSettings: UserSettings = {
  profile_visibility: "public",
  post_visibility: "public",
  location_sharing: true,
  show_in_discover: true,
  trend_participation: true,
  camera_permission: true,
  contacts_permission: false,
  targeted_ads: false,
  analytics_opt_in: true,
  notif_likes: true,
  notif_comments: true,
  notif_connections: true,
  notif_trending: true,
  notif_verification: true,
  notif_messages: true,
  dnd_enabled: false,
  dnd_start: "22:00",
  dnd_end: "07:00",
  email_notifs: true,
  sms_notifs: false,
  email_frequency: "daily",
  language: "en",
  font_size: "medium",
  high_contrast: false,
  reduced_motion: false,
  simplified_ui: false,
  hide_sensitive: true,
  safe_search: true,
  local_content: true,
  data_saver: false,
  offline_access: false,
  auto_logout: "30",
};

export function useUserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const load = async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.settings) {
        setSettings((prev) => ({ ...prev, ...(data.settings as Record<string, any>) }));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // Apply font size + accessibility tweaks to the document root
  useEffect(() => {
    const root = document.documentElement;
    const sizeMap: Record<string, string> = { small: "14px", medium: "16px", large: "18px" };
    root.style.fontSize = sizeMap[settings.font_size] || "16px";
    root.classList.toggle("high-contrast", !!settings.high_contrast);
    root.classList.toggle("reduce-motion", !!settings.reduced_motion);
  }, [settings.font_size, settings.high_contrast, settings.reduced_motion]);

  const save = useCallback(
    (newSettings: UserSettings) => {
      if (!user) return;
      // Debounce saves
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const { data: existing } = await supabase
          .from("user_settings")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("user_settings")
            .update({ settings: newSettings as any, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("user_settings")
            .insert({ user_id: user.id, settings: newSettings as any });
        }
      }, 500);
    },
    [user]
  );

  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        save(next);
        return next;
      });
    },
    [save]
  );

  const saveWithToast = useCallback(
    async () => {
      if (!user) return;
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const op = existing
        ? supabase.from("user_settings").update({ settings: settings as any, updated_at: new Date().toISOString() }).eq("user_id", user.id)
        : supabase.from("user_settings").insert({ user_id: user.id, settings: settings as any });

      const { error } = await op;
      if (error) {
        toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Settings saved ✓" });
      }
    },
    [user, settings, toast]
  );

  return { settings, loading, updateSetting, saveWithToast };
}
