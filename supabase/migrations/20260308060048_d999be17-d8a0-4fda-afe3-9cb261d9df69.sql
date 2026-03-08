
-- Fix overly permissive INSERT policy - restrict to authenticated users inserting their own viewer_id
DROP POLICY "Anyone can record views" ON public.page_views;
CREATE POLICY "Authenticated users can record views" ON public.page_views FOR INSERT TO authenticated 
  WITH CHECK (viewer_id = auth.uid() OR viewer_id IS NULL);
