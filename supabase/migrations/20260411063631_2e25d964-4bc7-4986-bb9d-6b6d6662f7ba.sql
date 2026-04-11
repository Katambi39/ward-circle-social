
DROP TRIGGER IF EXISTS on_vote_notify ON public.votes;
CREATE TRIGGER on_vote_notify
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_vote();

DROP TRIGGER IF EXISTS on_comment_notify ON public.comments;
CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

DROP TRIGGER IF EXISTS on_group_join_notify ON public.group_members;
CREATE TRIGGER on_group_join_notify
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_group_join();

DROP TRIGGER IF EXISTS on_story_reply_notify ON public.story_replies;
CREATE TRIGGER on_story_reply_notify
  AFTER INSERT ON public.story_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_story_reply();

ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
