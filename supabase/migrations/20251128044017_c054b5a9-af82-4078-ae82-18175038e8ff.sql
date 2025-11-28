
-- ============================================
-- CRITICAL FIX: Add missing auth trigger for profile creation
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SECURITY FIX: Revoke dangerous RPC permissions
-- ============================================
REVOKE EXECUTE ON FUNCTION public.update_player_ratings FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_player_ratings TO service_role;

-- ============================================
-- ENABLE REALTIME: Add tables to publication
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_spectators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;

-- ============================================
-- DATA DELETION: Add missing DELETE policies
-- ============================================

-- challenge_limits
CREATE POLICY "Users can delete own challenge limits" ON public.challenge_limits
  FOR DELETE USING (auth.uid() = user_id);

-- direct_messages
CREATE POLICY "Users can delete sent messages" ON public.direct_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- game_messages
CREATE POLICY "Users can delete own game messages" ON public.game_messages
  FOR DELETE USING (auth.uid() = user_id);

-- global_chat_messages
CREATE POLICY "Users can delete own chat messages" ON public.global_chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- class_upgrade_requests
CREATE POLICY "Users can delete own upgrade requests" ON public.class_upgrade_requests
  FOR DELETE USING (auth.uid() = user_id);

-- user_themes
CREATE POLICY "Users can delete own themes" ON public.user_themes
  FOR DELETE USING (auth.uid() = user_id);

-- user_theme_preferences
CREATE POLICY "Users can delete own theme preferences" ON public.user_theme_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- user_page_preferences
CREATE POLICY "Users can delete own page preferences" ON public.user_page_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- user_nfts
CREATE POLICY "Users can delete own NFTs" ON public.user_nfts
  FOR DELETE USING (auth.uid() = user_id);

-- profiles (last - most important)
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- games (allow players to delete their own games)
CREATE POLICY "Players can delete their games" ON public.games
  FOR DELETE USING (auth.uid() = white_player_id OR auth.uid() = black_player_id);
