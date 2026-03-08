CREATE POLICY "Group moderators can delete group posts"
ON public.posts
FOR DELETE
USING (
  group_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = posts.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'moderator'
  )
);