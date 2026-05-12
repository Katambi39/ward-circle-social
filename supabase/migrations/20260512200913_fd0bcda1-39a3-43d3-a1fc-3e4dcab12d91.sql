
-- 1. Update Verified Citizen badge to reflect phone verification
UPDATE public.badges
SET name = 'Verified Member',
    description = 'Verified your phone number',
    icon = '🛡️'
WHERE name = 'Verified Citizen';

-- 2. Add Official badge (for the Conect official account/pages)
INSERT INTO public.badges (name, description, icon, category, criteria)
VALUES ('Official', 'Official Conect account', '🌟', 'special', '{"manual": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- 3. Add is_official flag to pages
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;

-- 4. Support messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  email text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit support messages"
ON public.support_messages FOR INSERT
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can view own support messages"
ON public.support_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support messages"
ON public.support_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update support messages"
ON public.support_messages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Feedback submissions table
CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  rating smallint,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
ON public.feedback_submissions FOR INSERT
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can view own feedback"
ON public.feedback_submissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.feedback_submissions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Helper to award a badge (idempotent)
CREATE OR REPLACE FUNCTION public.award_badge(_user_id uuid, _badge_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _badge_id uuid;
BEGIN
  SELECT id INTO _badge_id FROM public.badges WHERE name = _badge_name LIMIT 1;
  IF _badge_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (_user_id, _badge_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- 7. Trigger: award badges on post creation
CREATE OR REPLACE FUNCTION public.check_post_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _post_count int;
BEGIN
  SELECT count(*) INTO _post_count FROM public.posts WHERE user_id = NEW.user_id;
  IF _post_count = 1 THEN PERFORM public.award_badge(NEW.user_id, 'First Post'); END IF;
  IF _post_count >= 10 THEN PERFORM public.award_badge(NEW.user_id, 'Storyteller'); END IF;
  IF _post_count >= 100 THEN PERFORM public.award_badge(NEW.user_id, 'Centurion'); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_post_badges ON public.posts;
CREATE TRIGGER award_post_badges
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.check_post_badges();

-- 8. Trigger: award badges on upvote (vote_type=1)
CREATE OR REPLACE FUNCTION public.check_vote_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _author uuid;
  _total int;
BEGIN
  IF NEW.vote_type != 1 THEN RETURN NEW; END IF;
  SELECT user_id INTO _author FROM public.posts WHERE id = NEW.post_id;
  IF _author IS NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(sum(upvotes),0) INTO _total FROM public.posts WHERE user_id = _author;
  IF _total >= 50 THEN PERFORM public.award_badge(_author, 'Popular'); END IF;
  IF _total >= 500 THEN PERFORM public.award_badge(_author, 'Top Contributor'); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_vote_badges ON public.votes;
CREATE TRIGGER award_vote_badges
AFTER INSERT ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.check_vote_badges();

-- 9. Trigger: award badges on reaction (Beloved = 100 reactions)
CREATE OR REPLACE FUNCTION public.check_reaction_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _author uuid;
  _total int;
BEGIN
  SELECT user_id INTO _author FROM public.posts WHERE id = NEW.post_id;
  IF _author IS NULL THEN RETURN NEW; END IF;
  SELECT count(*) INTO _total FROM public.post_reactions r
    JOIN public.posts p ON p.id = r.post_id WHERE p.user_id = _author;
  IF _total >= 100 THEN PERFORM public.award_badge(_author, 'Beloved'); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_reaction_badges ON public.post_reactions;
CREATE TRIGGER award_reaction_badges
AFTER INSERT ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.check_reaction_badges();

-- 10. Trigger: award Social Butterfly on connection (50 follows)
CREATE OR REPLACE FUNCTION public.check_connection_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count int;
BEGIN
  SELECT count(*) INTO _count FROM public.connections WHERE follower_id = NEW.follower_id;
  IF _count >= 50 THEN PERFORM public.award_badge(NEW.follower_id, 'Social Butterfly'); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_connection_badges ON public.connections;
CREATE TRIGGER award_connection_badges
AFTER INSERT ON public.connections
FOR EACH ROW EXECUTE FUNCTION public.check_connection_badges();

-- 11. Trigger: award Community Builder on group creation
CREATE OR REPLACE FUNCTION public.check_group_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.award_badge(NEW.created_by, 'Community Builder');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_group_badges ON public.groups;
CREATE TRIGGER award_group_badges
AFTER INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.check_group_badges();

-- 12. Trigger: award Verified Member on phone verification
CREATE OR REPLACE FUNCTION public.check_verification_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
    PERFORM public.award_badge(NEW.user_id, 'Verified Member');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_verification_badges ON public.profiles;
CREATE TRIGGER award_verification_badges
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_verification_badges();
