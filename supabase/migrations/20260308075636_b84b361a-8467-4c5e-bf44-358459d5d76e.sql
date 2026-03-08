
-- Add video_url column to posts
ALTER TABLE public.posts ADD COLUMN video_url text DEFAULT NULL;

-- Create post-videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('post-videos', 'post-videos', true, 52428800);

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public to view videos
CREATE POLICY "Anyone can view post videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-videos');

-- Allow users to delete own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
