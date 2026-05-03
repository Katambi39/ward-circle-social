CREATE OR REPLACE FUNCTION public.extract_post_hashtags()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  combined_text text;
  hashtag_match text;
  cashtag_match text;
  word_match text;
  stop_words text[] := ARRAY[
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','it','was','are',
    'be','been','being','have','has','had','do','does','did','will','would','could','should','can','may',
    'might','shall','must','not','no','nor','so','if','then','than','that','this','these','those','what',
    'which','who','whom','whose','when','where','why','how','all','each','every','both','few','more',
    'most','other','some','such','only','own','same','too','very','just','about','above','after','again',
    'also','am','any','because','before','between','come','day','get','got','go','going','good','great',
    'here','him','his','her','she','he','they','them','their','its','into','like','make','many','me','my',
    'new','now','one','our','out','over','said','say','says','see','still','take','tell','there','thing',
    'think','time','two','up','us','use','want','way','well','what','will','you','your','post','follow',
    'share','comment','reply','repost','people','really','much','even','back','know','need',
    'na','ya','wa','ni','kwa','la','za','au','si','ndi','pia','sana','tu','hii','hizi','yake',
    'wake','wao','yao','ile','zile','hayo','hizo','kama','lakini','ama','basi','kwamba','ndio','hapana',
    'ndiyo','sawa','tena','zaidi','kidogo','kubwa','ndogo','moja','mbili','tatu'
  ];
BEGIN
  combined_text := COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '');

  -- Hashtags
  FOR hashtag_match IN
    SELECT DISTINCT lower(m[1])
    FROM regexp_matches(combined_text, '#([A-Za-z0-9_]+)', 'g') AS m
  LOOP
    INSERT INTO public.hashtag_activity (hashtag, post_id, user_id, type)
    VALUES ('#' || hashtag_match, NEW.id, NEW.user_id, 'hashtag');
  END LOOP;

  -- Cashtags ($TICKER)
  FOR cashtag_match IN
    SELECT DISTINCT upper(m[1])
    FROM regexp_matches(combined_text, '\$([A-Za-z][A-Za-z0-9_]*)', 'g') AS m
  LOOP
    INSERT INTO public.hashtag_activity (hashtag, post_id, user_id, type)
    VALUES ('$' || cashtag_match, NEW.id, NEW.user_id, 'cashtag');
  END LOOP;

  -- Keywords (strip hashtags + cashtags first)
  combined_text := regexp_replace(combined_text, '#[A-Za-z0-9_]+', '', 'g');
  combined_text := regexp_replace(combined_text, '\$[A-Za-z][A-Za-z0-9_]*', '', 'g');

  FOR word_match IN
    SELECT DISTINCT lower(w.word)
    FROM regexp_split_to_table(
      regexp_replace(combined_text, '[^a-zA-Z0-9\s]', ' ', 'g'),
      '\s+'
    ) AS w(word)
    WHERE length(w.word) >= 3
      AND lower(w.word) != ALL(stop_words)
      AND w.word !~ '^\d+$'
  LOOP
    INSERT INTO public.hashtag_activity (hashtag, post_id, user_id, type)
    VALUES (word_match, NEW.id, NEW.user_id, 'keyword');
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Update trending function to include cashtags
CREATE OR REPLACE FUNCTION public.get_trending_hashtags(hours_window integer DEFAULT 24, result_limit integer DEFAULT 20)
 RETURNS TABLE(hashtag text, post_count bigint, total_upvotes bigint, total_comments bigint, total_shares bigint, engagement_score bigint, first_seen timestamp with time zone, latest timestamp with time zone, trend_type text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    ha.hashtag,
    count(DISTINCT ha.post_id) as post_count,
    COALESCE(sum(p.upvotes), 0) as total_upvotes,
    COALESCE(sum(p.comment_count), 0) as total_comments,
    COALESCE(sum(p.share_count), 0) as total_shares,
    (count(DISTINCT ha.post_id) * 3 + COALESCE(sum(p.upvotes), 0) + COALESCE(sum(p.comment_count), 0) * 2 + COALESCE(sum(p.share_count), 0) * 2) as engagement_score,
    min(ha.created_at) as first_seen,
    max(ha.created_at) as latest,
    ha.type as trend_type
  FROM public.hashtag_activity ha
  JOIN public.posts p ON p.id = ha.post_id
  WHERE ha.created_at > now() - (hours_window || ' hours')::interval
    AND (
      ha.type IN ('hashtag','cashtag')
      OR (ha.type = 'keyword' AND (SELECT count(DISTINCT ha2.post_id) FROM public.hashtag_activity ha2 WHERE ha2.hashtag = ha.hashtag AND ha2.created_at > now() - (hours_window || ' hours')::interval) >= 2)
    )
  GROUP BY ha.hashtag, ha.type
  ORDER BY engagement_score DESC
  LIMIT result_limit;
$function$;