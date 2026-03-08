
-- Create story_replies table
CREATE TABLE public.story_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  reply_type text NOT NULL DEFAULT 'message', -- 'message' or 'reaction'
  content text, -- text message or emoji
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

-- Authenticated users can send replies
CREATE POLICY "Users can send story replies"
ON public.story_replies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Story owner can view replies to their stories
CREATE POLICY "Story owners can view replies"
ON public.story_replies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_replies.story_id
    AND stories.user_id = auth.uid()
  )
  OR auth.uid() = sender_id
);

-- Senders can delete own replies
CREATE POLICY "Users can delete own replies"
ON public.story_replies FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_replies;
