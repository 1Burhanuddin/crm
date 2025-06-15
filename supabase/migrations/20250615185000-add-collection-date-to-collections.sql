
-- Add 'collection_date' (date, nullable, defaults to now)
ALTER TABLE public.collections
  ADD COLUMN collection_date date DEFAULT now();
