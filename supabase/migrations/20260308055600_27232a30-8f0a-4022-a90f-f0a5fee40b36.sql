
-- Business/Brand Pages table
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category text NOT NULL DEFAULT 'business',
  avatar_url text,
  cover_url text,
  county text,
  constituency text,
  phone text,
  website text,
  follower_count integer NOT NULL DEFAULT 0,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pages viewable by everyone" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create pages" ON public.pages FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update pages" ON public.pages FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete pages" ON public.pages FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Page followers
CREATE TABLE public.page_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.page_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Page followers viewable by everyone" ON public.page_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow pages" ON public.page_followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow pages" ON public.page_followers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Page reviews/endorsements
CREATE TABLE public.page_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating smallint NOT NULL DEFAULT 5,
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.page_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by everyone" ON public.page_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can review" ON public.page_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own review" ON public.page_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own review" ON public.page_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Page events
CREATE TABLE public.page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  event_date timestamptz NOT NULL,
  is_virtual boolean NOT NULL DEFAULT false,
  virtual_link text,
  rsvp_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by everyone" ON public.page_events FOR SELECT USING (true);
CREATE POLICY "Page owners can create events" ON public.page_events FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND owner_id = auth.uid()));
CREATE POLICY "Page owners can update events" ON public.page_events FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND owner_id = auth.uid()));
CREATE POLICY "Page owners can delete events" ON public.page_events FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND owner_id = auth.uid()));

-- Event RSVPs
CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.page_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSVPs viewable by everyone" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can RSVP" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel RSVP" ON public.event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Page polls
CREATE TABLE public.page_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls viewable by everyone" ON public.page_polls FOR SELECT USING (true);
CREATE POLICY "Page owners can create polls" ON public.page_polls FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND owner_id = auth.uid()));
CREATE POLICY "Page owners can update polls" ON public.page_polls FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND owner_id = auth.uid()));

-- Poll votes
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.page_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  option_index smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by everyone" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger for pages
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
