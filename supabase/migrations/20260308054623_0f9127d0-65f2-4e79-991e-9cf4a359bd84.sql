
-- Add cover_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url text;

-- Create followers/connections table for Konect system
CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Everyone can see connections
CREATE POLICY "Connections viewable by everyone"
ON public.connections FOR SELECT
USING (true);

-- Users can follow others
CREATE POLICY "Users can follow"
ON public.connections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
ON public.connections FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);
