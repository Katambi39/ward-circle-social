-- Escrow holds table for 72-hour buyer protection
CREATE TABLE public.escrow_holds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'held',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  release_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '72 hours'),
  released_at TIMESTAMP WITH TIME ZONE,
  dispute_reason TEXT
);

ALTER TABLE public.escrow_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own escrow holds"
ON public.escrow_holds FOR SELECT
TO authenticated
USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Admins can view all escrow holds"
ON public.escrow_holds FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create escrow holds"
ON public.escrow_holds FOR INSERT
TO authenticated
WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Admins can update escrow holds"
ON public.escrow_holds FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Marketplace reports table
CREATE TYPE public.report_type AS ENUM (
  'scam', 'fake_item', 'non_delivery', 'seller_dispute', 
  'listing_violation', 'refund_request', 'other'
);

CREATE TABLE public.marketplace_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID,
  listing_id UUID REFERENCES public.listings(id),
  report_type public.report_type NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.marketplace_reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports"
ON public.marketplace_reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports"
ON public.marketplace_reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.marketplace_reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to release mature escrow holds
CREATE OR REPLACE FUNCTION public.release_mature_escrows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Find all held escrows past their release time
  UPDATE public.escrow_holds
  SET status = 'released', released_at = now()
  WHERE status = 'held' AND release_at <= now();
  
  -- Credit seller wallets for released escrows
  UPDATE public.wallets w
  SET balance = w.balance + e.amount, updated_at = now()
  FROM public.escrow_holds e
  WHERE e.seller_id = w.user_id
    AND e.status = 'released'
    AND e.released_at = now();
END;
$$;

-- Updated purchase function that uses escrow instead of direct transfer
CREATE OR REPLACE FUNCTION public.process_purchase(_buyer_id uuid, _seller_id uuid, _listing_id uuid, _amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer_balance numeric;
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

  -- Create escrow hold (funds held for 72 hours)
  INSERT INTO public.escrow_holds (buyer_id, seller_id, listing_id, amount)
  VALUES (_buyer_id, _seller_id, _listing_id, _amount);

  -- Record transactions
  INSERT INTO public.transactions (user_id, listing_id, counterparty_id, type, amount, description, status)
  VALUES (_buyer_id, _listing_id, _seller_id, 'purchase', _amount, 'Purchase - funds in escrow', 'pending');
  INSERT INTO public.transactions (user_id, listing_id, counterparty_id, type, amount, description, status)
  VALUES (_seller_id, _listing_id, _buyer_id, 'sale', _amount, 'Sale - funds held 72hrs', 'pending');

  -- Mark listing as sold
  UPDATE public.listings SET status = 'sold' WHERE id = _listing_id;

  RETURN jsonb_build_object('success', true, 'escrow', true, 'release_after', '72 hours');
END;
$$;