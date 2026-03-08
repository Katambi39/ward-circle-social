CREATE POLICY "Users can delete own messages"
ON public.direct_messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());