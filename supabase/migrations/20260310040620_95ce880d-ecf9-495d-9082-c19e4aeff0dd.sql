
-- Chat conversations table
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  mode text NOT NULL DEFAULT 'chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.ai_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversations" ON public.ai_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.ai_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.ai_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Chat messages table
CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  verification jsonb,
  file_url text,
  file_name text,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.ai_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = ai_messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create messages" ON public.ai_messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = ai_messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete messages" ON public.ai_messages FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = ai_messages.conversation_id AND user_id = auth.uid())
);

-- Storage bucket for AI chat files
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('ai-chat-files', 'ai-chat-files', true, 10485760);

-- Storage policies
CREATE POLICY "Users can upload ai chat files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ai-chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view ai chat files" ON storage.objects FOR SELECT USING (bucket_id = 'ai-chat-files');
CREATE POLICY "Users can delete own ai chat files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ai-chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);
