import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    if (!user) { setCount(0); return; }

    // Get user's conversation IDs
    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);

    if (!convos || convos.length === 0) { setCount(0); return; }

    const ids = convos.map(c => c.id);
    const { count: unread } = await supabase
      .from("direct_messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", ids)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    setCount(unread || 0);
  };

  useEffect(() => {
    fetchCount();

    if (!user) return;

    const channel = supabase
      .channel("unread-messages-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return count;
};
