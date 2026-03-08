
-- Bookmarks table
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unbookmark" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Emoji Reactions table
CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reaction text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions viewable by everyone" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update reaction" ON public.post_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove reaction" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- Post Polls table
CREATE TABLE public.post_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE UNIQUE,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.post_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls viewable by everyone" ON public.post_polls FOR SELECT USING (true);
CREATE POLICY "Post owner can create poll" ON public.post_polls FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

-- Post Poll Votes table
CREATE TABLE public.post_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.post_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  option_index smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);
ALTER TABLE public.post_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by everyone" ON public.post_poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote on polls" ON public.post_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges table
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text NOT NULL DEFAULT '🏅',
  category text NOT NULL DEFAULT 'general',
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by everyone" ON public.badges FOR SELECT USING (true);

-- User Badges table
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can award badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
