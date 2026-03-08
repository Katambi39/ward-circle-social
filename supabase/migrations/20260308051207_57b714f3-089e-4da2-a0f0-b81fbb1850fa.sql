
-- Create storage bucket for anonymous file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('toboa-siri-files', 'toboa-siri-files', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload toboa siri files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'toboa-siri-files');

-- Allow public read access
CREATE POLICY "Anyone can view toboa siri files"
ON storage.objects FOR SELECT
USING (bucket_id = 'toboa-siri-files');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own toboa siri files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'toboa-siri-files' AND (storage.foldername(name))[1] = auth.uid()::text);
