
-- Create a `bills` table
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  bill_date DATE NOT NULL DEFAULT now(),
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own bills
CREATE POLICY "select_own_bills" ON public.bills
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own bills
CREATE POLICY "insert_own_bills" ON public.bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own bills
CREATE POLICY "update_own_bills" ON public.bills
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own bills
CREATE POLICY "delete_own_bills" ON public.bills
  FOR DELETE USING (auth.uid() = user_id);
