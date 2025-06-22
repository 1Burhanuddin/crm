-- Add converted_to_order field to quotations table
ALTER TABLE public.quotations 
ADD COLUMN converted_to_order BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance on converted_to_order field
CREATE INDEX idx_quotations_converted_to_order ON public.quotations(converted_to_order); 