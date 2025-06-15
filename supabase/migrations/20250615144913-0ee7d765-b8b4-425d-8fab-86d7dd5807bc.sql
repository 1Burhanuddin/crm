
-- 1. Add 'user_id' column to public.transactions
ALTER TABLE public.transactions
  ADD COLUMN user_id uuid DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;

-- 2. Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow users to view their own transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions
  FOR SELECT
  USING (user_id = auth.uid());

-- 4. Policy: Allow users to insert their own transactions
CREATE POLICY "Users can insert their own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. Policy: Allow users to update their own transactions
CREATE POLICY "Users can update their own transactions"
  ON public.transactions
  FOR UPDATE
  USING (user_id = auth.uid());

-- 6. Policy: Allow users to delete their own transactions
CREATE POLICY "Users can delete their own transactions"
  ON public.transactions
  FOR DELETE
  USING (user_id = auth.uid());
