
-- Music tracks library table
CREATE TABLE public.music_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  genre text NOT NULL DEFAULT 'afrobeat',
  audio_url text NOT NULL,
  cover_url text,
  duration_seconds integer NOT NULL DEFAULT 30,
  lyrics jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Music tracks viewable by everyone"
  ON public.music_tracks FOR SELECT
  TO authenticated
  USING (true);

-- Add music track reference to stories
ALTER TABLE public.stories
  ADD COLUMN music_track_id uuid REFERENCES public.music_tracks(id),
  ADD COLUMN music_start_time numeric DEFAULT 0;

-- Storage bucket for music files
INSERT INTO storage.buckets (id, name, public) VALUES ('music-tracks', 'music-tracks', true);

CREATE POLICY "Anyone can read music tracks"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'music-tracks');

CREATE POLICY "Admins can upload music tracks"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'music-tracks' AND public.has_role(auth.uid(), 'admin'));
