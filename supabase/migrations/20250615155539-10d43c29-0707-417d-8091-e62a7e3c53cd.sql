
-- 1. Add user_id column to products, set default to uuid "00000000-0000-0000-0000-000000000000" (temporarily for existing rows)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- 2. For existing rows, set user_id to the null uuid (admin can later migrate/protect these if wanted)

-- 3. Remove the DEFAULT for new rows, user_id must be set explicitly on insert
ALTER TABLE public.products
ALTER COLUMN user_id DROP DEFAULT;

-- 4. Enable Row Level Security (RLS) if not enabled (should already be enabled but for safety)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies (since current ones allow all authenticated users access)
DROP POLICY IF EXISTS "Allow authenticated read" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.products;

-- 6. Only allow users to read their own products
CREATE POLICY "Users can view their own products"
  ON public.products
  FOR SELECT
  USING (user_id = auth.uid());

-- 7. Only allow users to insert their own products
CREATE POLICY "Users can add their products"
  ON public.products
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 8. Only allow users to update their own products
CREATE POLICY "Users can update their products"
  ON public.products
  FOR UPDATE
  USING (user_id = auth.uid());

-- 9. Only allow users to delete their own products
CREATE POLICY "Users can delete their products"
  ON public.products
  FOR DELETE
  USING (user_id = auth.uid());

