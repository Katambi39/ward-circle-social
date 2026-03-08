
-- Conversations table (between two users, or user and page)
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one uuid NOT NULL,
  participant_two uuid NOT NULL,
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_one, participant_two)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Security definer to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _conversation_id
      AND (participant_one = _user_id OR participant_two = _user_id)
  )
$$;

CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT TO authenticated
USING (participant_one = auth.uid() OR participant_two = auth.uid());

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (participant_one = auth.uid() OR participant_two = auth.uid());

CREATE POLICY "Participants can update conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (participant_one = auth.uid() OR participant_two = auth.uid());

-- Direct messages table
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON public.direct_messages FOR SELECT TO authenticated
USING (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Participants can send messages"
ON public.direct_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND public.is_conversation_participant(auth.uid(), conversation_id)
);

CREATE POLICY "Recipients can mark as read"
ON public.direct_messages FOR UPDATE TO authenticated
USING (
  public.is_conversation_participant(auth.uid(), conversation_id)
  AND sender_id != auth.uid()
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Index for fast message lookups
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversations_participants ON public.conversations(participant_one, participant_two);
