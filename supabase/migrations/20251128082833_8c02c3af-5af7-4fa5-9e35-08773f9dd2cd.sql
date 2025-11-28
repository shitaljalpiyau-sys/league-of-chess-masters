-- Add numeric_user_id field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS numeric_user_id BIGINT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_numeric_user_id ON public.profiles(numeric_user_id);

-- Update the handle_new_user function to generate random numeric ID and username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  random_avatar_num integer;
  avatar_path text;
  random_numeric_id bigint;
  random_username text;
  collision_check boolean;
BEGIN
  -- Generate random numeric ID between 100000000 and 999999999 (9 digits)
  -- Loop until we find a unique ID
  LOOP
    random_numeric_id := floor(random() * 900000000 + 100000000)::bigint;
    
    -- Check if this ID already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE numeric_user_id = random_numeric_id) INTO collision_check;
    
    -- Exit loop if ID is unique
    EXIT WHEN NOT collision_check;
  END LOOP;
  
  -- Generate random username
  random_username := 'Player' || substr(md5(random()::text), 1, 8);
  
  -- Generate random number between 1 and 10 for avatar selection
  random_avatar_num := floor(random() * 10 + 1)::integer;
  avatar_path := '/avatars/avatar-' || random_avatar_num || '.png';
  
  INSERT INTO public.profiles (
    id,
    numeric_user_id,
    username,
    email,
    class,
    rating,
    points,
    games_played,
    games_won,
    xp,
    level,
    league,
    avatar_url
  )
  VALUES (
    new.id,
    random_numeric_id,
    COALESCE(
      new.raw_user_meta_data->>'username',
      random_username
    ),
    COALESCE(
      new.raw_user_meta_data->>'email',
      new.email
    ),
    'D',
    1200,
    1250,
    0,
    0,
    0,
    1,
    'Bronze',
    avatar_path
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$function$;

-- Create function to get user by username or email for login
CREATE OR REPLACE FUNCTION public.get_user_by_username_or_email(identifier text)
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, email
  FROM public.profiles
  WHERE username = identifier OR email = identifier
  LIMIT 1;
$$;

-- Update existing profiles to have numeric_user_id if they don't have one
DO $$
DECLARE
  profile_record RECORD;
  random_numeric_id bigint;
  collision_check boolean;
BEGIN
  FOR profile_record IN SELECT id FROM public.profiles WHERE numeric_user_id IS NULL LOOP
    -- Generate unique numeric ID for existing users
    LOOP
      random_numeric_id := floor(random() * 900000000 + 100000000)::bigint;
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE numeric_user_id = random_numeric_id) INTO collision_check;
      EXIT WHEN NOT collision_check;
    END LOOP;
    
    UPDATE public.profiles
    SET numeric_user_id = random_numeric_id
    WHERE id = profile_record.id;
  END LOOP;
END $$;