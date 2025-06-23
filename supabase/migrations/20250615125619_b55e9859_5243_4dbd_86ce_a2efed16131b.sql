
-- Create a public storage bucket named 'avatars'
insert into storage.buckets
  (id, name, public)
values
  ('avatars', 'avatars', true);

-- Allow all users to upload, update, and delete their own files within the avatars bucket
-- but make sure the bucket is public for read access
-- (No policies needed for read access because public=true!)

-- Insert a permissive policy for uploads (optional; Supabase typically allows authenticated users to upload by default)
-- This can be skipped if you only need public reads and authenticated writes.
