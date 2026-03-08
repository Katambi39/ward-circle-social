
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function: notify on new comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  post_owner_id uuid;
  post_title text;
  commenter_name text;
BEGIN
  SELECT user_id, title INTO post_owner_id, post_title FROM public.posts WHERE id = NEW.post_id;
  
  IF post_owner_id IS NULL OR post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  IF NEW.is_anonymous THEN
    commenter_name := 'Someone';
  ELSE
    SELECT display_name INTO commenter_name FROM public.profiles WHERE user_id = NEW.user_id;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    post_owner_id,
    'comment',
    commenter_name || ' commented on your post',
    left(NEW.content, 100),
    '/post/' || NEW.post_id,
    jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- Trigger function: notify on vote
CREATE OR REPLACE FUNCTION public.notify_on_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  post_owner_id uuid;
  post_title text;
BEGIN
  SELECT user_id, title INTO post_owner_id, post_title FROM public.posts WHERE id = NEW.post_id;
  
  IF post_owner_id IS NULL OR post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Only notify on upvotes
  IF NEW.vote_type != 1 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    post_owner_id,
    'upvote',
    'Someone upvoted your post',
    left(post_title, 100),
    '/post/' || NEW.post_id,
    jsonb_build_object('post_id', NEW.post_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_vote
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_vote();

-- Trigger function: notify on group join
CREATE OR REPLACE FUNCTION public.notify_on_group_join()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  group_creator_id uuid;
  group_name_val text;
  joiner_name text;
BEGIN
  SELECT created_by, name INTO group_creator_id, group_name_val FROM public.groups WHERE id = NEW.group_id;
  
  IF group_creator_id IS NULL OR group_creator_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO joiner_name FROM public.profiles WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    group_creator_id,
    'group_join',
    joiner_name || ' joined ' || group_name_val,
    NULL,
    '/groups',
    jsonb_build_object('group_id', NEW.group_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_join
  AFTER INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_group_join();
