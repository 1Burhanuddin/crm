
-- Enable policies for everyone (public demo: change to authenticated users later!)
CREATE POLICY "Allow all select" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.products FOR DELETE USING (true);

-- Make sure RLS is enabled (in case it was removed before)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
