
-- Remove the old insert policy
DROP POLICY IF EXISTS "Profiles are insertable by owner" ON public.profiles;

-- Allow inserts if the id in the new row matches the user's UID
CREATE POLICY "Profiles are insertable if id matches authenticated user"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
