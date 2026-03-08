
-- Storage bucket for KYC documents (private - not public)
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Only the user can upload their own KYC docs
CREATE POLICY "Users can upload own KYC docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Only the user can view their own KYC docs
CREATE POLICY "Users can view own KYC docs" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own KYC docs
CREATE POLICY "Users can delete own KYC docs" ON storage.objects FOR DELETE USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
