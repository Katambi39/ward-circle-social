
-- Table to track KYC submissions with document paths
CREATE TABLE public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  national_id_hash text NOT NULL,
  selfie_path text NOT NULL,
  id_photo_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid REFERENCES auth.users(id),
  reviewer_notes text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(user_id)
);

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own submission
CREATE POLICY "Users can submit KYC"
  ON public.kyc_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own submission
CREATE POLICY "Users can view own KYC"
  ON public.kyc_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all KYC"
  ON public.kyc_submissions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update submissions (approve/reject)
CREATE POLICY "Admins can update KYC"
  ON public.kyc_submissions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage: allow admins to read kyc-documents bucket
CREATE POLICY "Admins can read KYC documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kyc-documents' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Users can read their own KYC documents
CREATE POLICY "Users can read own KYC documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
