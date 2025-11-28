CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: expire_old_challenges(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.expire_old_challenges() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.challenges
  SET status = 'expired',
      is_expired = true
  WHERE status = 'pending'
    AND expires_at < now()
    AND is_expired = false;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  random_avatar_num integer;
  avatar_path text;
BEGIN
  -- Generate random number between 1 and 10 for avatar selection
  random_avatar_num := floor(random() * 10 + 1)::integer;
  avatar_path := '/avatars/avatar-' || random_avatar_num || '.png';
  
  INSERT INTO public.profiles (
    id, 
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
    COALESCE(
      new.raw_user_meta_data->>'username',
      'ElitePlayer_' || substr(md5(random()::text), 1, 4)
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
$$;


--
-- Name: is_username_available(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_username_available(check_username text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = check_username
  );
$$;


--
-- Name: save_game_to_history(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_game_to_history(p_game_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_game RECORD;
  v_player1_profile RECORD;
  v_player2_profile RECORD;
  v_player1_rating_before INTEGER;
  v_player2_rating_before INTEGER;
BEGIN
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
  );
END;
$$;


--
-- Name: update_cached_spectator_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_cached_spectator_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
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
END;
$$;


--
-- Name: update_player_ratings(uuid, uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_player_ratings(winner_id uuid, loser_id uuid, winner_rating integer, loser_rating integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
  
  -- Update profiles
  UPDATE public.profiles SET rating = new_winner_rating WHERE id = winner_id;
  UPDATE public.profiles SET rating = new_loser_rating WHERE id = loser_id;
END;
$$;


--
-- Name: update_spectator_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_spectator_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.games
    SET spectator_count = spectator_count + 1
    WHERE id = NEW.game_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.games
    SET spectator_count = spectator_count - 1
    WHERE id = OLD.game_id;
    RETURN OLD;
  END IF;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_page_preferences_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_page_preferences_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: challenge_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenge_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    challenged_user_id uuid NOT NULL,
    challenge_count integer DEFAULT 1,
    last_challenge_at timestamp with time zone DEFAULT now(),
    hour_window_start timestamp with time zone DEFAULT now(),
    hourly_challenge_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    challenger_id uuid NOT NULL,
    challenged_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    time_control text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval),
    is_expired boolean DEFAULT false,
    CONSTRAINT challenges_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'cancelled'::text, 'completed'::text]))),
    CONSTRAINT different_players CHECK ((challenger_id <> challenged_id))
);

ALTER TABLE ONLY public.challenges REPLICA IDENTITY FULL;


--
-- Name: chess_themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chess_themes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    price integer NOT NULL,
    rarity text DEFAULT 'common'::text NOT NULL,
    is_premium boolean DEFAULT false NOT NULL,
    light_square_color text NOT NULL,
    dark_square_color text NOT NULL,
    piece_style text DEFAULT 'classic'::text NOT NULL,
    preview_emoji text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    theme_type text DEFAULT '2d_board'::text NOT NULL,
    category text DEFAULT 'board'::text NOT NULL,
    is_3d boolean DEFAULT false NOT NULL,
    asset_url text,
    preview_image_url text,
    piece_colors jsonb DEFAULT '{"black": "#000000", "white": "#ffffff"}'::jsonb,
    has_custom_pieces boolean DEFAULT false NOT NULL
);


--
-- Name: class_upgrade_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_upgrade_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    current_class text NOT NULL,
    requested_class text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    admin_notes text
);


--
-- Name: direct_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.direct_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: friend_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friend_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT friend_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: friendships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user1_id uuid NOT NULL,
    user2_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT friendships_check CHECK ((user1_id < user2_id))
);


--
-- Name: game_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    game_id uuid NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: game_spectators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_spectators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    game_id uuid NOT NULL,
    user_id uuid,
    joined_at timestamp with time zone DEFAULT now()
);


--
-- Name: games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.games (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    white_player_id uuid NOT NULL,
    black_player_id uuid NOT NULL,
    challenge_id uuid,
    fen text DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'::text NOT NULL,
    pgn text DEFAULT ''::text NOT NULL,
    current_turn text DEFAULT 'white'::text NOT NULL,
    time_control text NOT NULL,
    white_time_remaining integer DEFAULT 600000 NOT NULL,
    black_time_remaining integer DEFAULT 600000 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    result text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    spectator_count integer DEFAULT 0,
    move_history jsonb DEFAULT '[]'::jsonb,
    move_count integer DEFAULT 0,
    cached_spectator_count integer DEFAULT 0,
    CONSTRAINT games_result_check CHECK ((result = ANY (ARRAY['white_wins'::text, 'black_wins'::text, 'draw'::text, 'abandoned'::text]))),
    CONSTRAINT games_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'abandoned'::text])))
);

ALTER TABLE ONLY public.games REPLICA IDENTITY FULL;


--
-- Name: global_chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    class text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: match_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    player1_id uuid NOT NULL,
    player2_id uuid NOT NULL,
    player1_username text NOT NULL,
    player2_username text NOT NULL,
    player1_rating_before integer NOT NULL,
    player1_rating_after integer NOT NULL,
    player2_rating_before integer NOT NULL,
    player2_rating_after integer NOT NULL,
    player1_class text NOT NULL,
    player2_class text NOT NULL,
    winner_id uuid,
    result text NOT NULL,
    pgn text NOT NULL,
    fen_history jsonb,
    move_timestamps jsonb,
    total_moves integer NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    tournament_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: matchmaking_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matchmaking_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    time_control text NOT NULL,
    rating integer NOT NULL,
    status text DEFAULT 'waiting'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT matchmaking_queue_status_check CHECK ((status = ANY (ARRAY['waiting'::text, 'matched'::text, 'cancelled'::text])))
);


--
-- Name: nft_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nft_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price integer NOT NULL,
    min_class text DEFAULT 'C'::text NOT NULL,
    rarity text DEFAULT 'legendary'::text NOT NULL,
    image_url text,
    preview_emoji text DEFAULT '💎'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text NOT NULL,
    class text DEFAULT 'D'::text NOT NULL,
    rating integer DEFAULT 1200 NOT NULL,
    games_played integer DEFAULT 0 NOT NULL,
    games_won integer DEFAULT 0 NOT NULL,
    points integer DEFAULT 1250 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    undo_moves integer DEFAULT 3 NOT NULL,
    hourly_income integer DEFAULT 100 NOT NULL,
    email text NOT NULL,
    xp integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    league text DEFAULT 'Bronze'::text NOT NULL,
    avatar_url text,
    CONSTRAINT rating_range CHECK (((rating >= 100) AND (rating <= 5000))),
    CONSTRAINT username_length CHECK (((char_length(username) >= 3) AND (char_length(username) <= 16)))
);


--
-- Name: user_nfts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_nfts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nft_id uuid NOT NULL,
    purchased_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_page_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_page_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    layout_style text DEFAULT 'wide'::text NOT NULL,
    theme_mode text DEFAULT 'dark'::text NOT NULL,
    accent_color text DEFAULT 'gold'::text NOT NULL,
    background_style text DEFAULT 'default'::text NOT NULL,
    button_style text DEFAULT 'rounded'::text NOT NULL,
    ui_density text DEFAULT 'comfortable'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_theme_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_theme_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    active_board_theme_id uuid,
    active_piece_theme_id uuid,
    active_3d_theme_id uuid,
    is_3d_mode boolean DEFAULT false NOT NULL,
    custom_piece_colors jsonb DEFAULT '{"black": "#000000", "white": "#ffffff"}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_square_colors jsonb DEFAULT '{"dark": "#a67c52", "light": "#d4b896"}'::jsonb,
    use_theme_boards boolean DEFAULT true
);


--
-- Name: user_themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_themes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    theme_id uuid NOT NULL,
    purchased_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT false NOT NULL
);


--
-- Name: weekly_rankings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weekly_rankings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    week_start date NOT NULL,
    week_end date NOT NULL,
    starting_class text NOT NULL,
    ending_class text,
    starting_rating integer NOT NULL,
    ending_rating integer,
    games_played integer DEFAULT 0,
    games_won integer DEFAULT 0,
    promoted boolean DEFAULT false,
    demoted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: challenge_limits challenge_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_limits
    ADD CONSTRAINT challenge_limits_pkey PRIMARY KEY (id);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: chess_themes chess_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chess_themes
    ADD CONSTRAINT chess_themes_pkey PRIMARY KEY (id);


--
-- Name: class_upgrade_requests class_upgrade_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_upgrade_requests
    ADD CONSTRAINT class_upgrade_requests_pkey PRIMARY KEY (id);


--
-- Name: direct_messages direct_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_pkey PRIMARY KEY (id);


--
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (id);


--
-- Name: friend_requests friend_requests_sender_id_receiver_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_sender_id_receiver_id_key UNIQUE (sender_id, receiver_id);


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);


--
-- Name: friendships friendships_user1_id_user2_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user1_id_user2_id_key UNIQUE (user1_id, user2_id);


--
-- Name: game_messages game_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_messages
    ADD CONSTRAINT game_messages_pkey PRIMARY KEY (id);


--
-- Name: game_spectators game_spectators_game_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_spectators
    ADD CONSTRAINT game_spectators_game_id_user_id_key UNIQUE (game_id, user_id);


--
-- Name: game_spectators game_spectators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_spectators
    ADD CONSTRAINT game_spectators_pkey PRIMARY KEY (id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: global_chat_messages global_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_chat_messages
    ADD CONSTRAINT global_chat_messages_pkey PRIMARY KEY (id);


--
-- Name: match_history match_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_history
    ADD CONSTRAINT match_history_pkey PRIMARY KEY (id);


--
-- Name: matchmaking_queue matchmaking_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matchmaking_queue
    ADD CONSTRAINT matchmaking_queue_pkey PRIMARY KEY (id);


--
-- Name: matchmaking_queue matchmaking_queue_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matchmaking_queue
    ADD CONSTRAINT matchmaking_queue_user_id_key UNIQUE (user_id);


--
-- Name: nft_items nft_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nft_items
    ADD CONSTRAINT nft_items_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_unique UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: user_nfts user_nfts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_nfts
    ADD CONSTRAINT user_nfts_pkey PRIMARY KEY (id);


--
-- Name: user_nfts user_nfts_user_id_nft_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_nfts
    ADD CONSTRAINT user_nfts_user_id_nft_id_key UNIQUE (user_id, nft_id);


--
-- Name: user_page_preferences user_page_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_page_preferences
    ADD CONSTRAINT user_page_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_page_preferences user_page_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_page_preferences
    ADD CONSTRAINT user_page_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_theme_preferences user_theme_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_theme_preferences
    ADD CONSTRAINT user_theme_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_theme_preferences user_theme_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_theme_preferences
    ADD CONSTRAINT user_theme_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_themes user_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_themes
    ADD CONSTRAINT user_themes_pkey PRIMARY KEY (id);


--
-- Name: user_themes user_themes_user_id_theme_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_themes
    ADD CONSTRAINT user_themes_user_id_theme_id_key UNIQUE (user_id, theme_id);


--
-- Name: profiles username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT username_unique UNIQUE (username);


--
-- Name: weekly_rankings weekly_rankings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_rankings
    ADD CONSTRAINT weekly_rankings_pkey PRIMARY KEY (id);


--
-- Name: weekly_rankings weekly_rankings_user_id_week_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_rankings
    ADD CONSTRAINT weekly_rankings_user_id_week_start_key UNIQUE (user_id, week_start);


--
-- Name: idx_challenges_challenged; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenges_challenged ON public.challenges USING btree (challenged_id);


--
-- Name: idx_challenges_challenger; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenges_challenger ON public.challenges USING btree (challenger_id);


--
-- Name: idx_challenges_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenges_status ON public.challenges USING btree (status);


--
-- Name: idx_challenges_status_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenges_status_expires ON public.challenges USING btree (status, expires_at) WHERE (status = 'pending'::text);


--
-- Name: idx_challenges_users; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenges_users ON public.challenges USING btree (challenger_id, challenged_id);


--
-- Name: idx_friend_requests_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friend_requests_receiver ON public.friend_requests USING btree (receiver_id, status) WHERE (status = 'pending'::text);


--
-- Name: idx_friendships_users; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendships_users ON public.friendships USING btree (user1_id, user2_id);


--
-- Name: idx_game_spectators_game_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_spectators_game_user ON public.game_spectators USING btree (game_id, user_id);


--
-- Name: idx_game_spectators_joined; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_spectators_joined ON public.game_spectators USING btree (joined_at DESC);


--
-- Name: idx_games_black_player; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_games_black_player ON public.games USING btree (black_player_id) WHERE (status = 'active'::text);


--
-- Name: idx_games_challenge_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_games_challenge_id ON public.games USING btree (challenge_id) WHERE (challenge_id IS NOT NULL);


--
-- Name: idx_games_players; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_games_players ON public.games USING btree (white_player_id, black_player_id, status);


--
-- Name: idx_games_status_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_games_status_updated ON public.games USING btree (status, updated_at);


--
-- Name: idx_games_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_games_updated ON public.games USING btree (updated_at DESC) WHERE (status = 'active'::text);


--
-- Name: idx_games_white_player; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_games_white_player ON public.games USING btree (white_player_id) WHERE (status = 'active'::text);


--
-- Name: idx_global_chat_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_global_chat_class ON public.global_chat_messages USING btree (class, created_at DESC);


--
-- Name: idx_profiles_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_class ON public.profiles USING btree (class);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_email_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email_lower ON public.profiles USING btree (lower(email));


--
-- Name: idx_profiles_league; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_league ON public.profiles USING btree (league);


--
-- Name: idx_profiles_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_level ON public.profiles USING btree (level);


--
-- Name: idx_profiles_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_rating ON public.profiles USING btree (rating DESC);


--
-- Name: idx_profiles_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username);


--
-- Name: idx_profiles_username_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_username_lower ON public.profiles USING btree (lower(username));


--
-- Name: game_spectators update_cached_spectator_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cached_spectator_count_trigger AFTER INSERT OR DELETE ON public.game_spectators FOR EACH ROW EXECUTE FUNCTION public.update_cached_spectator_count();


--
-- Name: challenge_limits update_challenge_limits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_challenge_limits_updated_at BEFORE UPDATE ON public.challenge_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: challenges update_challenges_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: class_upgrade_requests update_class_upgrade_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_class_upgrade_requests_updated_at BEFORE UPDATE ON public.class_upgrade_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: games update_games_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: game_spectators update_spectator_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_spectator_count_trigger AFTER INSERT OR DELETE ON public.game_spectators FOR EACH ROW EXECUTE FUNCTION public.update_spectator_count();


--
-- Name: user_page_preferences update_user_page_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_page_preferences_updated_at BEFORE UPDATE ON public.user_page_preferences FOR EACH ROW EXECUTE FUNCTION public.update_user_page_preferences_updated_at();


--
-- Name: user_theme_preferences update_user_theme_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_theme_preferences_updated_at BEFORE UPDATE ON public.user_theme_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: weekly_rankings update_weekly_rankings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_weekly_rankings_updated_at BEFORE UPDATE ON public.weekly_rankings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: challenge_limits challenge_limits_challenged_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_limits
    ADD CONSTRAINT challenge_limits_challenged_user_id_fkey FOREIGN KEY (challenged_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: challenge_limits challenge_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_limits
    ADD CONSTRAINT challenge_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: challenges challenges_challenged_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_challenged_id_fkey FOREIGN KEY (challenged_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: challenges challenges_challenger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_challenger_id_fkey FOREIGN KEY (challenger_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: class_upgrade_requests class_upgrade_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_upgrade_requests
    ADD CONSTRAINT class_upgrade_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: direct_messages direct_messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: direct_messages direct_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: friend_requests friend_requests_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: friend_requests friend_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: friendships friendships_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: friendships friendships_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: game_messages game_messages_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_messages
    ADD CONSTRAINT game_messages_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: game_messages game_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_messages
    ADD CONSTRAINT game_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: game_spectators game_spectators_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_spectators
    ADD CONSTRAINT game_spectators_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: game_spectators game_spectators_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_spectators
    ADD CONSTRAINT game_spectators_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: games games_black_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_black_player_id_fkey FOREIGN KEY (black_player_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: games games_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE SET NULL;


--
-- Name: games games_white_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_white_player_id_fkey FOREIGN KEY (white_player_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: global_chat_messages global_chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_chat_messages
    ADD CONSTRAINT global_chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: match_history match_history_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_history
    ADD CONSTRAINT match_history_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: match_history match_history_player1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_history
    ADD CONSTRAINT match_history_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: match_history match_history_player2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_history
    ADD CONSTRAINT match_history_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: matchmaking_queue matchmaking_queue_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matchmaking_queue
    ADD CONSTRAINT matchmaking_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_nfts user_nfts_nft_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_nfts
    ADD CONSTRAINT user_nfts_nft_id_fkey FOREIGN KEY (nft_id) REFERENCES public.nft_items(id) ON DELETE CASCADE;


--
-- Name: user_nfts user_nfts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_nfts
    ADD CONSTRAINT user_nfts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_page_preferences user_page_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_page_preferences
    ADD CONSTRAINT user_page_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_theme_preferences user_theme_preferences_active_3d_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_theme_preferences
    ADD CONSTRAINT user_theme_preferences_active_3d_theme_id_fkey FOREIGN KEY (active_3d_theme_id) REFERENCES public.chess_themes(id);


--
-- Name: user_theme_preferences user_theme_preferences_active_board_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_theme_preferences
    ADD CONSTRAINT user_theme_preferences_active_board_theme_id_fkey FOREIGN KEY (active_board_theme_id) REFERENCES public.chess_themes(id);


--
-- Name: user_theme_preferences user_theme_preferences_active_piece_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_theme_preferences
    ADD CONSTRAINT user_theme_preferences_active_piece_theme_id_fkey FOREIGN KEY (active_piece_theme_id) REFERENCES public.chess_themes(id);


--
-- Name: user_theme_preferences user_theme_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_theme_preferences
    ADD CONSTRAINT user_theme_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_themes user_themes_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_themes
    ADD CONSTRAINT user_themes_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.chess_themes(id) ON DELETE CASCADE;


--
-- Name: weekly_rankings weekly_rankings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_rankings
    ADD CONSTRAINT weekly_rankings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: nft_items Anyone can view NFT items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view NFT items" ON public.nft_items FOR SELECT USING (true);


--
-- Name: games Anyone can view active games; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active games" ON public.games FOR SELECT USING (((status = 'active'::text) OR (auth.uid() = white_player_id) OR (auth.uid() = black_player_id)));


--
-- Name: match_history Anyone can view match history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view match history" ON public.match_history FOR SELECT USING (true);


--
-- Name: profiles Anyone can view profiles for signup validation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view profiles for signup validation" ON public.profiles FOR SELECT USING (true);


--
-- Name: weekly_rankings Anyone can view rankings for leaderboard; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view rankings for leaderboard" ON public.weekly_rankings FOR SELECT USING (true);


--
-- Name: game_spectators Anyone can view spectators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view spectators" ON public.game_spectators FOR SELECT USING (true);


--
-- Name: chess_themes Anyone can view themes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view themes" ON public.chess_themes FOR SELECT USING (true);


--
-- Name: games Players can create games; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Players can create games" ON public.games FOR INSERT WITH CHECK (((auth.uid() = white_player_id) OR (auth.uid() = black_player_id)));


--
-- Name: game_messages Players can send messages in their games; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Players can send messages in their games" ON public.game_messages FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.games
  WHERE ((games.id = game_messages.game_id) AND ((games.white_player_id = auth.uid()) OR (games.black_player_id = auth.uid())))))));


--
-- Name: games Players can update their games; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Players can update their games" ON public.games FOR UPDATE USING (((auth.uid() = white_player_id) OR (auth.uid() = black_player_id)));


--
-- Name: game_messages Players can view messages in their games; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Players can view messages in their games" ON public.game_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.games
  WHERE ((games.id = game_messages.game_id) AND ((games.white_player_id = auth.uid()) OR (games.black_player_id = auth.uid()))))));


--
-- Name: challenges Users can create challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create challenges" ON public.challenges FOR INSERT WITH CHECK ((auth.uid() = challenger_id));


--
-- Name: friendships Users can create friendships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create friendships" ON public.friendships FOR INSERT WITH CHECK (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));


--
-- Name: class_upgrade_requests Users can create their own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own requests" ON public.class_upgrade_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: challenges Users can delete own challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own challenges" ON public.challenges FOR DELETE USING ((auth.uid() = challenger_id));


--
-- Name: friendships Users can delete their friendships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their friendships" ON public.friendships FOR DELETE USING (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));


--
-- Name: friend_requests Users can delete their sent requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their sent requests" ON public.friend_requests FOR DELETE USING ((auth.uid() = sender_id));


--
-- Name: user_page_preferences Users can insert own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own preferences" ON public.user_page_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_theme_preferences Users can insert own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own preferences" ON public.user_theme_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: challenge_limits Users can insert their own challenge limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own challenge limits" ON public.challenge_limits FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_themes Users can insert their own themes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own themes" ON public.user_themes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: game_spectators Users can join as spectators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can join as spectators" ON public.game_spectators FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: matchmaking_queue Users can join matchmaking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can join matchmaking" ON public.matchmaking_queue FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: matchmaking_queue Users can leave matchmaking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can leave matchmaking" ON public.matchmaking_queue FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: game_spectators Users can leave spectating; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can leave spectating" ON public.game_spectators FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: direct_messages Users can mark their received messages as read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can mark their received messages as read" ON public.direct_messages FOR UPDATE USING ((auth.uid() = receiver_id));


--
-- Name: user_nfts Users can purchase NFTs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can purchase NFTs" ON public.user_nfts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: friend_requests Users can send friend requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK ((auth.uid() = sender_id));


--
-- Name: direct_messages Users can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages" ON public.direct_messages FOR INSERT WITH CHECK ((auth.uid() = sender_id));


--
-- Name: global_chat_messages Users can send messages to their class; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages to their class" ON public.global_chat_messages FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (class = ( SELECT profiles.class
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));


--
-- Name: friend_requests Users can update friend requests they received; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update friend requests they received" ON public.friend_requests FOR UPDATE USING ((auth.uid() = receiver_id));


--
-- Name: user_page_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own preferences" ON public.user_page_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_theme_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own preferences" ON public.user_theme_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: challenges Users can update their challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their challenges" ON public.challenges FOR UPDATE USING (((auth.uid() = challenger_id) OR (auth.uid() = challenged_id)));


--
-- Name: challenge_limits Users can update their own challenge limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own challenge limits" ON public.challenge_limits FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_themes Users can update their own themes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own themes" ON public.user_themes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: matchmaking_queue Users can update their queue entry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their queue entry" ON public.matchmaking_queue FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: matchmaking_queue Users can view matchmaking queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view matchmaking queue" ON public.matchmaking_queue FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: global_chat_messages Users can view messages from their class; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages from their class" ON public.global_chat_messages FOR SELECT TO authenticated USING ((class = ( SELECT profiles.class
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: user_page_preferences Users can view own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own preferences" ON public.user_page_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_theme_preferences Users can view own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own preferences" ON public.user_theme_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: challenges Users can view their challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their challenges" ON public.challenges FOR SELECT USING (((auth.uid() = challenger_id) OR (auth.uid() = challenged_id)));


--
-- Name: friend_requests Users can view their friend requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their friend requests" ON public.friend_requests FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));


--
-- Name: friendships Users can view their friendships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their friendships" ON public.friendships FOR SELECT USING (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));


--
-- Name: direct_messages Users can view their messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their messages" ON public.direct_messages FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));


--
-- Name: user_nfts Users can view their own NFTs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own NFTs" ON public.user_nfts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: challenge_limits Users can view their own challenge limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own challenge limits" ON public.challenge_limits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: weekly_rankings Users can view their own rankings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own rankings" ON public.weekly_rankings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: class_upgrade_requests Users can view their own requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own requests" ON public.class_upgrade_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_themes Users can view their own themes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own themes" ON public.user_themes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: challenge_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.challenge_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: challenges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: chess_themes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chess_themes ENABLE ROW LEVEL SECURITY;

--
-- Name: class_upgrade_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_upgrade_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: direct_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: friend_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: friendships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

--
-- Name: game_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: game_spectators; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_spectators ENABLE ROW LEVEL SECURITY;

--
-- Name: games; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

--
-- Name: global_chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.global_chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: match_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;

--
-- Name: matchmaking_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: nft_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nft_items ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_nfts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_nfts ENABLE ROW LEVEL SECURITY;

--
-- Name: user_page_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_page_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_theme_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_theme_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_themes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

--
-- Name: weekly_rankings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weekly_rankings ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


