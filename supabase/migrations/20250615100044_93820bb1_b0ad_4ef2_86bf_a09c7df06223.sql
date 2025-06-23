
-- 1. Create transactions table (ledger entries)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT now(),
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('udhaar', 'paid')), -- credit/debit
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Optional: create an index for faster customer lookups
CREATE INDEX ON public.transactions(customer_id);

-- 3. Enable row level security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS: allow anyone to insert/read/update/delete for now (can be tightened later)
CREATE POLICY "Allow all access to transactions"
  ON public.transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

