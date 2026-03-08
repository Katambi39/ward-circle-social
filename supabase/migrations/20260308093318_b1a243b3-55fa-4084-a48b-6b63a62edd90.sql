
-- Add repost_of column to posts table
ALTER TABLE public.posts ADD COLUMN repost_of uuid REFERENCES public.posts(id) ON DELETE SET NULL DEFAULT NULL;

-- Add repost_comment for quote-posts
ALTER TABLE public.posts ADD COLUMN repost_comment text DEFAULT NULL;
