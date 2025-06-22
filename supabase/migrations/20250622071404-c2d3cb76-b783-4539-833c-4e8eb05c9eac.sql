
-- Create quotations table
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  product_id UUID NOT NULL,
  qty INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  job_date DATE NOT NULL,
  assigned_to TEXT NOT NULL,
  site_address TEXT,
  remarks TEXT,
  valid_until DATE,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Create policies for quotations
CREATE POLICY "Users can view their own quotations" 
  ON public.quotations 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own quotations" 
  ON public.quotations 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quotations" 
  ON public.quotations 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own quotations" 
  ON public.quotations 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX idx_quotations_user_id ON public.quotations(user_id);
CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_quotations_customer_id ON public.quotations(customer_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
