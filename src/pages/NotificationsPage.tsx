import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle, ArrowBigUp, Users, CheckCheck, ShieldCheck, ArrowLeft, Heart, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  comment: <MessageCircle className="h-5 w-5 text-primary" />,
  upvote: <ArrowBigUp className="h-5 w-5 text-secondary" />,
  group_join: <Users className="h-5 w-5 text-primary" />,
  verification: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
  story_reaction: <Heart className="h-5 w-5 text-rose-500" />,
  story_reply: <Reply className="h-5 w-5 text-primary" />,
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Notification[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl md:hidden" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-display font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary font-display gap-1 rounded-full"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-display">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">When someone interacts with your content, you'll see it here</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-muted/50 transition-colors",
                  !n.is_read && "bg-primary/5"
                )}
              >
                <div className="mt-0.5 shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {typeIcons[n.type] || <Bell className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm leading-snug",
                    !n.is_read ? "font-semibold text-foreground" : "text-foreground"
                  )}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.body}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5 font-display">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </motion.button>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
