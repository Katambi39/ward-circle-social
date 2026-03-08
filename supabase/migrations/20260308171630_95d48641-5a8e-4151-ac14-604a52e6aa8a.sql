
-- Trigger to notify story owner when someone replies
CREATE OR REPLACE FUNCTION public.notify_on_story_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  story_owner_id uuid;
  replier_name text;
  reply_preview text;
BEGIN
  SELECT user_id INTO story_owner_id FROM public.stories WHERE id = NEW.story_id;
  
  IF story_owner_id IS NULL OR story_owner_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO replier_name FROM public.profiles WHERE user_id = NEW.sender_id;

  IF NEW.reply_type = 'reaction' THEN
    reply_preview := replier_name || ' reacted ' || NEW.content || ' to your story';
  ELSE
    reply_preview := left(NEW.content, 100);
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    story_owner_id,
    'story_reply',
    CASE WHEN NEW.reply_type = 'reaction' 
      THEN replier_name || ' reacted to your story'
      ELSE replier_name || ' replied to your story'
    END,
    reply_preview,
    '/',
    jsonb_build_object('story_id', NEW.story_id, 'reply_id', NEW.id, 'sender_id', NEW.sender_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_story_reply_notify
  AFTER INSERT ON public.story_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_story_reply();
