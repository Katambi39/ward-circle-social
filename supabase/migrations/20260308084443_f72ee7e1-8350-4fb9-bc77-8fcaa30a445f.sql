
-- Add moderation_status to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_reason text;

-- Moderation flags/log table
CREATE TABLE public.moderation_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL, -- 'post' or 'comment'
  content_id uuid NOT NULL,
  user_id uuid NOT NULL,
  flagged_text text,
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed'
  ai_confidence numeric,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;

-- Admins can view all flags, regular users can see their own
CREATE POLICY "Users can view own flags" ON public.moderation_flags
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- System inserts flags
CREATE POLICY "Authenticated users can create flags" ON public.moderation_flags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins/moderators can update flags
CREATE POLICY "Moderators can update flags" ON public.moderation_flags
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
