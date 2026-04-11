
-- Drop the old policy that requires verification to join groups
DROP POLICY IF EXISTS "Verified users can join groups" ON public.group_members;

-- Create new policy allowing any authenticated user to join
CREATE POLICY "Authenticated users can join groups"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
