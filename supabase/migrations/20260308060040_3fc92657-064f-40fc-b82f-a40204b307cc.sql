
-- Page views tracking
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  viewer_id uuid,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  referrer text
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (even anonymous browsing)
CREATE POLICY "Anyone can record views" ON public.page_views FOR INSERT TO authenticated WITH CHECK (true);

-- Page owners can read their own page views
CREATE POLICY "Page owners can view analytics" ON public.page_views FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.pages WHERE id = page_id AND owner_id = auth.uid()));
