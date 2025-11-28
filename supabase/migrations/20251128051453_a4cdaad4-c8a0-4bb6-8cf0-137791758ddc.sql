-- Update RLS policies for game_messages to only allow players in the game to view messages
DROP POLICY IF EXISTS "Players can view messages in their games" ON public.game_messages;
DROP POLICY IF EXISTS "Players can send messages in their games" ON public.game_messages;
DROP POLICY IF EXISTS "Users can delete own game messages" ON public.game_messages;

-- Only the two players in the game can view messages
CREATE POLICY "Only game players can view messages"
ON public.game_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_messages.game_id
    AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())
    AND games.status = 'active'
  )
);

-- Only the two players can send messages during active games
CREATE POLICY "Only game players can send messages"
ON public.game_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_messages.game_id
    AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())
    AND games.status = 'active'
  )
);

-- Players can delete their own messages
CREATE POLICY "Players can delete own messages"
ON public.game_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to auto-delete game messages when game ends
CREATE OR REPLACE FUNCTION public.cleanup_game_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a game status changes to completed or abandoned, delete all its messages
  IF NEW.status IN ('completed', 'abandoned') AND OLD.status = 'active' THEN
    DELETE FROM public.game_messages WHERE game_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to cleanup messages when game ends
DROP TRIGGER IF EXISTS cleanup_messages_on_game_end ON public.games;
CREATE TRIGGER cleanup_messages_on_game_end
AFTER UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_game_messages();