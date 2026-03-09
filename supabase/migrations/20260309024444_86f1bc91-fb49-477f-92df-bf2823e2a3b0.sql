
-- Tighten the insert policy - only allow authenticated users to insert their own flags
DROP POLICY "System can insert duplicate flags" ON public.duplicate_id_flags;
