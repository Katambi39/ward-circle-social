
-- 2FA settings per user
CREATE TABLE IF NOT EXISTS public.user_2fa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  method text NOT NULL DEFAULT 'email_otp',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own 2fa settings"
  ON public.user_2fa FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2fa settings"
  ON public.user_2fa FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2fa settings"
  ON public.user_2fa FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- WebAuthn / passkey credentials
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  device_name text DEFAULT 'My Passkey',
  transports text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webauthn credentials"
  ON public.webauthn_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add webauthn credentials"
  ON public.webauthn_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete webauthn credentials"
  ON public.webauthn_credentials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own webauthn credentials"
  ON public.webauthn_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
