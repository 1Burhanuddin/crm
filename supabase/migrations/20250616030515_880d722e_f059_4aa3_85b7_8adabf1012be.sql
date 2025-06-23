
-- Ensure collection_date column exists in collections table
-- This migration is safe to run multiple times
DO $$ 
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'collections' 
        AND column_name = 'collection_date'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE public.collections 
        ADD COLUMN collection_date date DEFAULT now();
    END IF;
END $$;
