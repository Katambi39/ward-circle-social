
-- Create a security definer function to check if user is verified
CREATE OR REPLACE FUNCTION public.is_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND verification_status = 'verified'
  )
$$;

-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

-- Create new INSERT policy requiring verification
CREATE POLICY "Verified users can join groups"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_verified(auth.uid())
);
