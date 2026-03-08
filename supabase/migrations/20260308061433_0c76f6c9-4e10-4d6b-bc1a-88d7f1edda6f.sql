
-- Create listing_reviews table
CREATE TABLE public.listing_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  rating smallint NOT NULL DEFAULT 5,
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(listing_id, buyer_id)
);

ALTER TABLE public.listing_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Reviews viewable by everyone" ON public.listing_reviews
  FOR SELECT USING (true);

-- Only buyers who purchased can leave a review (buyer_id must match auth.uid)
CREATE POLICY "Buyers can create reviews" ON public.listing_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.user_id = auth.uid()
        AND transactions.listing_id = listing_reviews.listing_id
        AND transactions.type = 'purchase'
        AND transactions.status = 'completed'
    )
  );

-- Buyers can update own reviews
CREATE POLICY "Buyers can update own reviews" ON public.listing_reviews
  FOR UPDATE USING (auth.uid() = buyer_id);

-- Buyers can delete own reviews
CREATE POLICY "Buyers can delete own reviews" ON public.listing_reviews
  FOR DELETE USING (auth.uid() = buyer_id);
