
-- 1. Create a "collections" table for payment tracking
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  amount numeric NOT NULL,
  collected_at timestamp with time zone DEFAULT now(),
  remarks text,
  -- Optionally, link to an order or transaction if relevant for "due"
  order_id uuid,
  transaction_id uuid
);

-- Foreign keys (do not use references to auth.users per best practices)
ALTER TABLE public.collections ADD CONSTRAINT fk_collections_customer
  FOREIGN KEY (customer_id) REFERENCES public.customers (id) ON DELETE CASCADE;

-- 2. Enable Row Level Security for privacy
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- 3. Allow each user to manage only their collections
CREATE POLICY "Users can read their own collections"
  ON public.collections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own collections"
  ON public.collections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own collections"
  ON public.collections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own collections"
  ON public.collections FOR DELETE
  USING (user_id = auth.uid());
