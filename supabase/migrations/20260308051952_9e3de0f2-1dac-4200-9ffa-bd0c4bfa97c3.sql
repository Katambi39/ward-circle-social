
DROP POLICY "System can insert notifications" ON public.notifications;

-- Only allow inserts from triggers (security definer functions bypass RLS)
-- No direct insert policy needed since triggers use SECURITY DEFINER
