
-- Allow authenticated users to insert music tracks (save from web)
CREATE POLICY "Authenticated users can save tracks"
ON public.music_tracks FOR INSERT
TO authenticated
WITH CHECK (true);
