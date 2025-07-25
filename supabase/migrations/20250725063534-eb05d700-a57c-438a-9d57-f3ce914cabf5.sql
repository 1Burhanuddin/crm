-- Create a table to store customer collection date preferences
CREATE TABLE public.customer_collection_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  preferred_collection_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, customer_id)
);

-- Enable Row Level Security
ALTER TABLE public.customer_collection_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own customer preferences" 
ON public.customer_collection_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customer preferences" 
ON public.customer_collection_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer preferences" 
ON public.customer_collection_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customer preferences" 
ON public.customer_collection_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customer_collection_preferences_updated_at
BEFORE UPDATE ON public.customer_collection_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();