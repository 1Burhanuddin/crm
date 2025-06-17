
-- Create a function to get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  email_confirmed_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if user is authenticated (you can add role checks here later)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Create a function to delete a user permanently (admin only)
CREATE OR REPLACE FUNCTION delete_user_permanently(user_id_to_delete uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if user is authenticated (you can add role checks here later)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete from auth.users (this will cascade to other tables due to foreign keys)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  
  RETURN true;
END;
$$;
