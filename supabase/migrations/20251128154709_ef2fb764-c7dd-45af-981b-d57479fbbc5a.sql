-- Fix recursion issues in trigger functions by adding proper guards

-- Fix update_updated_at to prevent recursion
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

-- Fix cleanup_game_messages to prevent recursion
CREATE OR REPLACE FUNCTION public.cleanup_game_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Prevent recursion: only run if status actually changed to completed/abandoned
  IF NEW.status IN ('completed', 'abandoned') AND OLD.status != NEW.status THEN
    DELETE FROM public.game_messages WHERE game_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix expire_old_challenges to be idempotent
CREATE OR REPLACE FUNCTION public.expire_old_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update challenges that aren't already expired
  -- Use WHERE clause to prevent updating already expired challenges
  UPDATE public.challenges
  SET status = 'expired',
      is_expired = true
  WHERE status = 'pending'
    AND expires_at < now()
    AND is_expired = false
    AND status IS DISTINCT FROM 'expired';
END;
$function$;

-- Fix expire_old_games to be idempotent
CREATE OR REPLACE FUNCTION public.expire_old_games()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update games that aren't already abandoned
  UPDATE games
  SET 
    status = 'abandoned',
    result = 'abandoned'
  WHERE 
    status = 'active'
    AND created_at < NOW() - INTERVAL '5 hours'
    AND status IS DISTINCT FROM 'abandoned';
END;
$function$;