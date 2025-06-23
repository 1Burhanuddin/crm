
-- Add converted_to_order field to quotations table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'quotations' 
        AND column_name = 'converted_to_order'
    ) THEN
        ALTER TABLE public.quotations 
        ADD COLUMN converted_to_order BOOLEAN NOT NULL DEFAULT false;
        
        -- Create index for better performance on converted_to_order field
        CREATE INDEX idx_quotations_converted_to_order ON public.quotations(converted_to_order);
    END IF;
END $$;
