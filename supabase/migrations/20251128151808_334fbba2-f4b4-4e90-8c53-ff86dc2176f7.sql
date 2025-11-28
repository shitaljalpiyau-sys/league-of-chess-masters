
-- Fix recursive trigger by adding recursion prevention
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Prevent recursion: only update if timestamp hasn't been modified in this operation
  IF (TG_OP = 'UPDATE' AND NEW.updated_at = OLD.updated_at) THEN
    NEW.updated_at = now();
  ELSIF (TG_OP = 'INSERT') THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix profile updates to prevent cascading recursion
CREATE OR REPLACE FUNCTION public.update_player_ratings(winner_id uuid, loser_id uuid, winner_rating integer, loser_rating integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  k_factor INTEGER := 32;
  expected_winner FLOAT;
  expected_loser FLOAT;
  new_winner_rating INTEGER;
  new_loser_rating INTEGER;
BEGIN
  -- Calculate expected scores
  expected_winner := 1.0 / (1.0 + power(10.0, (loser_rating - winner_rating)::FLOAT / 400.0));
  expected_loser := 1.0 / (1.0 + power(10.0, (winner_rating - loser_rating)::FLOAT / 400.0));
  
  -- Calculate new ratings
  new_winner_rating := winner_rating + round(k_factor * (1.0 - expected_winner));
  new_loser_rating := loser_rating + round(k_factor * (0.0 - expected_loser));
  
  -- Ensure minimum rating of 100
  new_winner_rating := GREATEST(new_winner_rating, 100);
  new_loser_rating := GREATEST(new_loser_rating, 100);
  
  -- Update profiles (triggers will handle updated_at)
  UPDATE public.profiles 
  SET rating = new_winner_rating 
  WHERE id = winner_id;
  
  UPDATE public.profiles 
  SET rating = new_loser_rating 
  WHERE id = loser_id;
END;
$function$;

-- Add recursion prevention to game spectator count updates
CREATE OR REPLACE FUNCTION public.update_cached_spectator_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Use silent update to avoid triggering other triggers
    UPDATE games 
    SET cached_spectator_count = COALESCE(cached_spectator_count, 0) + 1
    WHERE id = NEW.game_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE games 
    SET cached_spectator_count = GREATEST(COALESCE(cached_spectator_count, 1) - 1, 0)
    WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;
