import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PostPoll {
  id: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  myVote: number | null;
}

export function usePostPoll(postId: string) {
  const { user } = useAuth();
  const [poll, setPoll] = useState<PostPoll | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPoll = useCallback(async () => {
    const { data: pollData } = await supabase
      .from("post_polls")
      .select("*")
      .eq("post_id", postId)
      .maybeSingle();

    if (!pollData) { setLoading(false); return; }

    const options = (pollData.options as any[]) || [];
    
    const { data: votesData } = await supabase
      .from("post_poll_votes")
      .select("option_index, user_id")
      .eq("poll_id", pollData.id);

    const votes = new Array(options.length).fill(0);
    let myVote: number | null = null;
    (votesData || []).forEach((v: any) => {
      if (v.option_index < votes.length) votes[v.option_index]++;
      if (user && v.user_id === user.id) myVote = v.option_index;
    });

    setPoll({
      id: pollData.id,
      options: options.map((o: any) => typeof o === 'string' ? o : o.text || ''),
      votes,
      totalVotes: votes.reduce((a: number, b: number) => a + b, 0),
      myVote,
    });
    setLoading(false);
  }, [postId, user]);

  useEffect(() => { fetchPoll(); }, [fetchPoll]);

  const vote = useCallback(async (optionIndex: number) => {
    if (!user || !poll || poll.myVote !== null) return;
    
    setPoll((prev) => {
      if (!prev) return prev;
      const newVotes = [...prev.votes];
      newVotes[optionIndex]++;
      return { ...prev, votes: newVotes, totalVotes: prev.totalVotes + 1, myVote: optionIndex };
    });

    await supabase.from("post_poll_votes").insert({
      poll_id: poll.id,
      user_id: user.id,
      option_index: optionIndex,
    });
  }, [user, poll]);

  return { poll, loading, vote };
}
