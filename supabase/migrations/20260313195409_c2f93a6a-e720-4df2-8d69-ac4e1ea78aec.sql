
-- Call signaling table for WebRTC
CREATE TABLE public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  caller_id uuid NOT NULL,
  callee_id uuid NOT NULL,
  call_type text NOT NULL DEFAULT 'voice', -- 'voice' or 'video'
  status text NOT NULL DEFAULT 'ringing', -- 'ringing', 'answered', 'ended', 'missed', 'rejected'
  signal_data jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view calls" ON public.call_signals
  FOR SELECT TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

CREATE POLICY "Users can create calls" ON public.call_signals
  FOR INSERT TO authenticated
  WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Participants can update calls" ON public.call_signals
  FOR UPDATE TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

CREATE POLICY "Participants can delete calls" ON public.call_signals
  FOR DELETE TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

-- Enable realtime for call signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;

-- Sticker packs table
CREATE TABLE public.sticker_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_url text,
  creator_id uuid,
  is_official boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  sticker_count integer NOT NULL DEFAULT 0,
  download_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sticker_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packs viewable by everyone" ON public.sticker_packs
  FOR SELECT USING (true);

CREATE POLICY "Users can create packs" ON public.sticker_packs
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update packs" ON public.sticker_packs
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete packs" ON public.sticker_packs
  FOR DELETE TO authenticated
  USING (creator_id = auth.uid());

-- Individual stickers table
CREATE TABLE public.stickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid REFERENCES public.sticker_packs(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  emoji_tag text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stickers viewable by everyone" ON public.stickers
  FOR SELECT USING (true);

CREATE POLICY "Pack creators can add stickers" ON public.stickers
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.sticker_packs WHERE id = pack_id AND creator_id = auth.uid()));

CREATE POLICY "Pack creators can delete stickers" ON public.stickers
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sticker_packs WHERE id = pack_id AND creator_id = auth.uid()));

-- User's collected sticker packs
CREATE TABLE public.user_sticker_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pack_id uuid REFERENCES public.sticker_packs(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, pack_id)
);

ALTER TABLE public.user_sticker_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own packs" ON public.user_sticker_packs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can add packs" ON public.user_sticker_packs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove packs" ON public.user_sticker_packs
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Storage buckets for voice notes and stickers
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('stickers', 'stickers', true);

-- Storage policies for voice notes
CREATE POLICY "Users can upload voice notes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'voice-notes');

CREATE POLICY "Voice notes are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'voice-notes');

CREATE POLICY "Users can delete own voice notes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for stickers
CREATE POLICY "Users can upload stickers" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stickers');

CREATE POLICY "Stickers are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'stickers');

CREATE POLICY "Users can delete own stickers" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'stickers' AND (storage.foldername(name))[1] = auth.uid()::text);
