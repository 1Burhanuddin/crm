
-- 1. Create customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  phone text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Enable row level security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 3. Allow users to select their own customers
CREATE POLICY "Users can view their customers"
  ON public.customers
  FOR SELECT
  USING (user_id = auth.uid());

-- 4. Allow users to insert their own customers
CREATE POLICY "Users can add their customers"
  ON public.customers
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. Allow users to update their customers
CREATE POLICY "Users can update their customers"
  ON public.customers
  FOR UPDATE
  USING (user_id = auth.uid());

-- 6. Allow users to delete their customers
CREATE POLICY "Users can delete their customers"
  ON public.customers
  FOR DELETE
  USING (user_id = auth.uid());
