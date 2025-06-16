
-- Add collection_id column to transactions table to link transactions with collections
ALTER TABLE public.transactions 
ADD COLUMN collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE;

-- Add an index for better performance when querying by collection_id
CREATE INDEX idx_transactions_collection_id ON public.transactions(collection_id);
