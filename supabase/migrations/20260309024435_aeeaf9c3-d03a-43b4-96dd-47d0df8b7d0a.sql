
-- Unique partial index: only one approved/pending KYC per national ID
CREATE UNIQUE INDEX IF NOT EXISTS idx_kyc_unique_national_id 
ON public.kyc_submissions (national_id_hash) 
WHERE status IN ('pending', 'approved');

-- Also enforce on profiles table
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_national_id 
ON public.profiles (national_id_hash) 
WHERE national_id_hash IS NOT NULL;

-- Create a table to track flagged duplicate attempts
CREATE TABLE IF NOT EXISTS public.duplicate_id_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  national_id_hash text NOT NULL,
  attempted_user_id uuid NOT NULL,
  existing_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  notes text
);

ALTER TABLE public.duplicate_id_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage duplicate flags
CREATE POLICY "Admins can view duplicate flags"
ON public.duplicate_id_flags FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update duplicate flags"
ON public.duplicate_id_flags FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert duplicate flags"
ON public.duplicate_id_flags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger function: on KYC insert, check for duplicate national_id_hash
CREATE OR REPLACE FUNCTION public.check_duplicate_national_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_uid uuid;
BEGIN
  -- Check if another user already has this national ID (approved or pending)
  SELECT user_id INTO existing_uid
  FROM public.kyc_submissions
  WHERE national_id_hash = NEW.national_id_hash
    AND user_id != NEW.user_id
    AND status IN ('pending', 'approved')
  LIMIT 1;

  IF existing_uid IS NOT NULL THEN
    -- Flag the duplicate attempt
    INSERT INTO public.duplicate_id_flags (national_id_hash, attempted_user_id, existing_user_id)
    VALUES (NEW.national_id_hash, NEW.user_id, existing_uid);

    -- Reject the submission
    NEW.status := 'rejected';
    NEW.reviewer_notes := 'Automatically rejected: National ID already registered to another account.';
    NEW.reviewed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_duplicate_national_id
BEFORE INSERT ON public.kyc_submissions
FOR EACH ROW
EXECUTE FUNCTION public.check_duplicate_national_id();
