-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION expire_old_games()
RETURNS void AS $$
BEGIN
  UPDATE games
  SET 
    status = 'abandoned',
    result = 'abandoned'
  WHERE 
    status = 'active'
    AND created_at < NOW() - INTERVAL '5 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_duplicate_challenge(
  p_challenger_id uuid,
  p_challenged_id uuid
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM challenges 
    WHERE status = 'pending'
      AND (
        (challenger_id = p_challenger_id AND challenged_id = p_challenged_id)
        OR
        (challenger_id = p_challenged_id AND challenged_id = p_challenger_id)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auto_expire_games_trigger()
RETURNS trigger AS $$
BEGIN
  PERFORM expire_old_games();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;