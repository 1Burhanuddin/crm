
-- Add an 'advance_amount' column to 'orders' table
ALTER TABLE public.orders ADD COLUMN advance_amount NUMERIC NOT NULL DEFAULT 0;
