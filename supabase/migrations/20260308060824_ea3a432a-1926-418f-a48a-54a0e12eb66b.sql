
-- Listing categories enum
CREATE TYPE public.listing_category AS ENUM ('products', 'services', 'digital', 'property');
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'paused', 'removed');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'purchase', 'sale', 'refund');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Marketplace listings
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category listing_category NOT NULL DEFAULT 'products',
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  images text[] DEFAULT '{}',
  location text,
  county text,
  constituency text,
  condition text,
  is_negotiable boolean NOT NULL DEFAULT false,
  status listing_status NOT NULL DEFAULT 'active',
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings viewable by everyone" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create listings" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own listings" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = seller_id);

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Wallets
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own wallet" ON public.wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  counterparty_id uuid,
  type transaction_type NOT NULL,
  amount numeric(12,2) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'completed',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can create transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Listing favorites/saved
CREATE TABLE public.listing_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE public.listing_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON public.listing_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON public.listing_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON public.listing_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to handle purchase (atomic wallet transfer)
CREATE OR REPLACE FUNCTION public.process_purchase(
  _buyer_id uuid,
  _seller_id uuid,
  _listing_id uuid,
  _amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer_balance numeric;
  result jsonb;
BEGIN
  -- Ensure wallets exist
  INSERT INTO public.wallets (user_id, balance) VALUES (_buyer_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.wallets (user_id, balance) VALUES (_seller_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

  -- Check buyer balance
  SELECT balance INTO buyer_balance FROM public.wallets WHERE user_id = _buyer_id FOR UPDATE;
  IF buyer_balance < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Deduct from buyer
  UPDATE public.wallets SET balance = balance - _amount, updated_at = now() WHERE user_id = _buyer_id;
  -- Credit seller
  UPDATE public.wallets SET balance = balance + _amount, updated_at = now() WHERE user_id = _seller_id;

  -- Record transactions
  INSERT INTO public.transactions (user_id, listing_id, counterparty_id, type, amount, description)
  VALUES (_buyer_id, _listing_id, _seller_id, 'purchase', _amount, 'Purchase');
  INSERT INTO public.transactions (user_id, listing_id, counterparty_id, type, amount, description)
  VALUES (_seller_id, _listing_id, _buyer_id, 'sale', _amount, 'Sale');

  -- Mark listing as sold
  UPDATE public.listings SET status = 'sold' WHERE id = _listing_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Storage bucket for listing images
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);

CREATE POLICY "Anyone can read listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-images');

CREATE POLICY "Users can delete own listing images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
