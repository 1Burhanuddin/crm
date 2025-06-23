
-- Add an 'advance_amount' column to the 'orders' table for tracking advance payments
ALTER TABLE public.orders ADD COLUMN advance_amount NUMERIC NOT NULL DEFAULT 0;
