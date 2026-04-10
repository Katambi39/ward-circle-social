
-- Table to track every hashtag mention from posts
CREATE TABLE public.hashtag_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag text NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_hashtag_activity_hashtag ON public.hashtag_activity(hashtag);
CREATE INDEX idx_hashtag_activity_created ON public.hashtag_activity(created_at DESC);
CREATE INDEX idx_hashtag_activity_post ON public.hashtag_activity(post_id);

ALTER TABLE public.hashtag_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read hashtag activity"
  ON public.hashtag_activity FOR SELECT TO authenticated USING (true);

CREATE POLICY "System inserts via trigger"
  ON public.hashtag_activity FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger function: extract hashtags from post title + content on insert
CREATE OR REPLACE FUNCTION public.extract_post_hashtags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  combined_text text;
  hashtag_match text;
BEGIN
  combined_text := COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '');

  FOR hashtag_match IN
    SELECT DISTINCT lower(m[1])
    FROM regexp_matches(combined_text, '#([A-Za-z0-9_]+)', 'g') AS m
  LOOP
    INSERT INTO public.hashtag_activity (hashtag, post_id, user_id)
    VALUES (hashtag_match, NEW.id, NEW.user_id);
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_extract_hashtags
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.extract_post_hashtags();

-- Aggregation function: get trending hashtags ranked by post count + engagement
CREATE OR REPLACE FUNCTION public.get_trending_hashtags(
  hours_window int DEFAULT 24,
  result_limit int DEFAULT 20
)
RETURNS TABLE(
  hashtag text,
  post_count bigint,
  total_upvotes bigint,
  total_comments bigint,
  total_shares bigint,
  engagement_score bigint,
  first_seen timestamptz,
  latest timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ha.hashtag,
    count(DISTINCT ha.post_id) as post_count,
    COALESCE(sum(p.upvotes), 0) as total_upvotes,
    COALESCE(sum(p.comment_count), 0) as total_comments,
    COALESCE(sum(p.share_count), 0) as total_shares,
    (count(DISTINCT ha.post_id) * 3 + COALESCE(sum(p.upvotes), 0) + COALESCE(sum(p.comment_count), 0) * 2 + COALESCE(sum(p.share_count), 0) * 2) as engagement_score,
    min(ha.created_at) as first_seen,
    max(ha.created_at) as latest
  FROM public.hashtag_activity ha
  JOIN public.posts p ON p.id = ha.post_id
  WHERE ha.created_at > now() - (hours_window || ' hours')::interval
  GROUP BY ha.hashtag
  ORDER BY engagement_score DESC
  LIMIT result_limit;
$$;
