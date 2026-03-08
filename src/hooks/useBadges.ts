import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserBadge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  earned_at: string;
}

export function useBadges(userId?: string) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("user_badges")
        .select("id, earned_at, badges(name, description, icon, category)")
        .eq("user_id", userId);

      if (data) {
        setBadges(
          data.map((ub: any) => ({
            id: ub.id,
            name: ub.badges?.name || "",
            description: ub.badges?.description || null,
            icon: ub.badges?.icon || "🏅",
            category: ub.badges?.category || "general",
            earned_at: ub.earned_at,
          }))
        );
      }
      setLoading(false);
    };
    fetch();
  }, [userId]);

  return { badges, loading };
}

export function useAllBadges() {
  const [badges, setBadges] = useState<Array<{ id: string; name: string; description: string | null; icon: string; category: string }>>([]);
  
  useEffect(() => {
    supabase.from("badges").select("*").then(({ data }) => {
      if (data) setBadges(data as any);
    });
  }, []);

  return badges;
}
