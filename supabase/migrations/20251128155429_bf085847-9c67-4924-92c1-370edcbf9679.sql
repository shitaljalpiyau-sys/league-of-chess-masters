-- Comprehensive fix for all recursion issues and PGRST116 errors

-- 1. Fix update_spectator_count to prevent recursion
CREATE OR REPLACE FUNCTION public.update_spectator_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Prevent recursion: only update if count actually needs to change
  IF TG_OP = 'INSERT' THEN
    UPDATE public.games
    SET spectator_count = spectator_count + 1
    WHERE id = NEW.game_id
      AND spectator_count IS DISTINCT FROM (spectator_count + 1);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.games
    SET spectator_count = spectator_count - 1
    WHERE id = OLD.game_id
      AND spectator_count > 0
      AND spectator_count IS DISTINCT FROM (spectator_count - 1);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- 2. Fix update_cached_spectator_count to prevent recursion
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
    WHERE id = NEW.game_id
      AND cached_spectator_count IS DISTINCT FROM (COALESCE(cached_spectator_count, 0) + 1);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE games 
    SET cached_spectator_count = GREATEST(COALESCE(cached_spectator_count, 1) - 1, 0)
    WHERE id = OLD.game_id
      AND cached_spectator_count IS DISTINCT FROM GREATEST(COALESCE(cached_spectator_count, 1) - 1, 0);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- 3. Fix update_user_page_preferences_updated_at to prevent recursion
CREATE OR REPLACE FUNCTION public.update_user_page_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update if updated_at hasn't been modified in this operation
  IF (TG_OP = 'UPDATE' AND NEW.updated_at = OLD.updated_at) THEN
    NEW.updated_at = now();
  ELSIF (TG_OP = 'INSERT') THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Fix update_player_ratings to be idempotent and prevent recursion
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
  
  -- Update profiles ONLY if rating actually changed (prevents recursion)
  UPDATE public.profiles 
  SET rating = new_winner_rating 
  WHERE id = winner_id
    AND rating IS DISTINCT FROM new_winner_rating;
  
  UPDATE public.profiles 
  SET rating = new_loser_rating 
  WHERE id = loser_id
    AND rating IS DISTINCT FROM new_loser_rating;
END;
$function$;

-- 5. Fix save_game_to_history to be idempotent (prevent duplicate inserts)
CREATE OR REPLACE FUNCTION public.save_game_to_history(p_game_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_game RECORD;
  v_player1_profile RECORD;
  v_player2_profile RECORD;
  v_player1_rating_before INTEGER;
  v_player2_rating_before INTEGER;
BEGIN
  -- Check if already saved to history (prevent duplicates)
  IF EXISTS (SELECT 1 FROM public.match_history WHERE match_id = p_game_id) THEN
    RETURN;
  END IF;

  -- Get game details
  SELECT * INTO v_game FROM public.games WHERE id = p_game_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get player profiles
  SELECT * INTO v_player1_profile FROM public.profiles WHERE id = v_game.white_player_id;
  SELECT * INTO v_player2_profile FROM public.profiles WHERE id = v_game.black_player_id;
  
  -- Get ratings before (from weekly_rankings or current rating)
  v_player1_rating_before := v_player1_profile.rating;
  v_player2_rating_before := v_player2_profile.rating;
  
  -- Insert into match history
  INSERT INTO public.match_history (
    match_id,
    player1_id,
    player2_id,
    player1_username,
    player2_username,
    player1_rating_before,
    player1_rating_after,
    player2_rating_before,
    player2_rating_after,
    player1_class,
    player2_class,
    winner_id,
    result,
    pgn,
    move_timestamps,
    total_moves,
    start_time,
    end_time
  ) VALUES (
    v_game.id,
    v_game.white_player_id,
    v_game.black_player_id,
    v_player1_profile.username,
    v_player2_profile.username,
    v_player1_rating_before,
    v_player1_profile.rating,
    v_player2_rating_before,
    v_player2_profile.rating,
    v_player1_profile.class,
    v_player2_profile.class,
    CASE 
      WHEN v_game.result = '1-0' THEN v_game.white_player_id
      WHEN v_game.result = '0-1' THEN v_game.black_player_id
      ELSE NULL
    END,
    v_game.result,
    v_game.pgn,
    v_game.move_history,
    v_game.move_count,
    v_game.created_at,
    now()
  )
  ON CONFLICT (match_id) DO NOTHING;  -- Prevent duplicate inserts
END;
$function$;

-- 6. Fix auto_expire_games_trigger to prevent recursion
CREATE OR REPLACE FUNCTION public.auto_expire_games_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only call expire function if it's an INSERT or status changed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    PERFORM expire_old_games();
  END IF;
  RETURN NULL;
END;
$function$;