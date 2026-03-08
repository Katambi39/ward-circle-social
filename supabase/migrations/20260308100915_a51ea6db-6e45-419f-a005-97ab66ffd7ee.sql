
CREATE POLICY "Admins can delete groups"
ON public.groups
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
