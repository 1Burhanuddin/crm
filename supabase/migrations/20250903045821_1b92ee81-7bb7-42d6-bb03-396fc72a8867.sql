-- Add mobile number field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN mobile_number text;