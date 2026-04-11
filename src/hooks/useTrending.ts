import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LiveTrend {
  hashtag: string;
  post_count: number;
  total_upvotes: number;
  total_comments: number;
  total_shares: number;
  engagement_score: number;
  first_seen: string;
  latest: string;
  trend_type: "hashtag" | "keyword";
}

export const useTrending = (hoursWindow = 24) => {
  return useQuery({
    queryKey: ["trending", hoursWindow],
    queryFn: async (): Promise<LiveTrend[]> => {
      const { data, error } = await supabase.rpc("get_trending_hashtags", {
        hours_window: hoursWindow,
        result_limit: 20,
      });
      if (error) throw error;
      return (data as unknown as LiveTrend[]) ?? [];
    },
    refetchInterval: 60_000, // refresh every minute
  });
};
