
-- Create a user profiles table to store PIN (hashed) and to link with Supabase user id
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  pin_hash text not null,
  created_at timestamp with time zone default now() not null
);

-- RLS: Enable and allow only the user (owner) to read/update their profile
alter table public.profiles enable row level security;
create policy "Profiles are readable by owner" on profiles
  for select using (auth.uid() = id);
create policy "Profiles are insertable by owner" on profiles
  for insert with check (auth.uid() = id);
create policy "Profiles are updatable by owner" on profiles
  for update using (auth.uid() = id);

-- Optionally, ensure that only the owner can set their own PIN
