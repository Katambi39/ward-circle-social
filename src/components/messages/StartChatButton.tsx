import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface StartChatButtonProps {
  targetUserId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  className?: string;
  label?: string;
}

const StartChatButton = ({ targetUserId, variant = "outline", size = "sm", className = "", label = "Message" }: StartChatButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }
    if (user.id === targetUserId) return;

    setLoading(true);
    try {
      // Check for existing conversation (either direction)
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant_one.eq.${user.id},participant_two.eq.${targetUserId}),and(participant_one.eq.${targetUserId},participant_two.eq.${user.id})`
        )
        .maybeSingle();

      if (existing) {
        navigate(`/messages?convo=${existing.id}`);
        return;
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({
          participant_one: user.id,
          participant_two: targetUserId,
        } as any)
        .select()
        .single();

      if (error) throw error;
      navigate(`/messages?convo=${(newConvo as any).id}`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === targetUserId) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={`rounded-full font-display gap-1.5 ${className}`}
    >
      <MessageSquare className="h-3.5 w-3.5" />
      {loading ? "..." : label}
    </Button>
  );
};

export default StartChatButton;
