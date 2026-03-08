import { supabase } from "@/integrations/supabase/client";

interface ModerationResult {
  is_flagged: boolean;
  severity: string;
  reason: string;
  confidence: number;
  should_block: boolean;
}

export async function moderateContent(
  text: string,
  contentType: "post" | "comment",
  contentId?: string,
  userId?: string
): Promise<ModerationResult> {
  try {
    const { data, error } = await supabase.functions.invoke("moderate-content", {
      body: { text, content_type: contentType, content_id: contentId, user_id: userId },
    });

    if (error) {
      console.error("Moderation function error:", error);
      return { is_flagged: false, severity: "none", reason: "Moderation unavailable", confidence: 0, should_block: false };
    }

    return data as ModerationResult;
  } catch (err) {
    console.error("Moderation call failed:", err);
    return { is_flagged: false, severity: "none", reason: "Moderation unavailable", confidence: 0, should_block: false };
  }
}
