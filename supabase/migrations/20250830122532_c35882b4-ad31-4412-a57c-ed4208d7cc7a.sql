-- Add business information fields to profiles table for GST billing
ALTER TABLE public.profiles 
ADD COLUMN business_address TEXT,
ADD COLUMN gst_number VARCHAR(15),
ADD COLUMN pan_number VARCHAR(10),
ADD COLUMN business_type TEXT DEFAULT 'individual',
ADD COLUMN state TEXT,
ADD COLUMN pincode VARCHAR(10),
ADD COLUMN bank_name TEXT,
ADD COLUMN account_number TEXT,
ADD COLUMN ifsc_code VARCHAR(11),
ADD COLUMN upi_id TEXT,
ADD COLUMN terms_conditions TEXT;

-- Add GST and tax fields to bills table
ALTER TABLE public.bills
ADD COLUMN subtotal NUMERIC DEFAULT 0,
ADD COLUMN tax_rate NUMERIC DEFAULT 18,
ADD COLUMN tax_amount NUMERIC DEFAULT 0,
ADD COLUMN discount_amount NUMERIC DEFAULT 0,
ADD COLUMN bill_number TEXT,
ADD COLUMN due_date DATE,
ADD COLUMN notes TEXT,
ADD COLUMN payment_terms TEXT DEFAULT '30 days';

-- Create inventory/products tracking table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity_in_stock NUMERIC NOT NULL DEFAULT 0,
  reorder_level NUMERIC DEFAULT 10,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS on inventory table
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory
CREATE POLICY "Users can view their own inventory" 
ON public.inventory 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inventory" 
ON public.inventory 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory" 
ON public.inventory 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory" 
ON public.inventory 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for inventory updates
CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();