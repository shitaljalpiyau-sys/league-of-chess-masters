export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_user_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_limits: {
        Row: {
          challenge_count: number | null
          challenged_user_id: string
          created_at: string | null
          hour_window_start: string | null
          hourly_challenge_count: number | null
          id: string
          last_challenge_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenge_count?: number | null
          challenged_user_id: string
          created_at?: string | null
          hour_window_start?: string | null
          hourly_challenge_count?: number | null
          id?: string
          last_challenge_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenge_count?: number | null
          challenged_user_id?: string
          created_at?: string | null
          hour_window_start?: string | null
          hourly_challenge_count?: number | null
          id?: string
          last_challenge_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          challenged_id: string
          challenger_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_expired: boolean | null
          status: string
          time_control: string
          updated_at: string
        }
        Insert: {
          challenged_id: string
          challenger_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_expired?: boolean | null
          status?: string
          time_control: string
          updated_at?: string
        }
        Update: {
          challenged_id?: string
          challenger_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_expired?: boolean | null
          status?: string
          time_control?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_challenged_id_fkey"
            columns: ["challenged_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      chess_themes: {
        Row: {
          asset_url: string | null
          category: string
          created_at: string
          dark_square_color: string
          description: string | null
          has_custom_pieces: boolean
          id: string
          is_3d: boolean
          is_premium: boolean
          light_square_color: string
          name: string
          piece_colors: Json | null
          piece_style: string
          preview_emoji: string
          preview_image_url: string | null
          price: number
          rarity: string
          theme_type: string
        }
        Insert: {
          asset_url?: string | null
          category?: string
          created_at?: string
          dark_square_color: string
          description?: string | null
          has_custom_pieces?: boolean
          id?: string
          is_3d?: boolean
          is_premium?: boolean
          light_square_color: string
          name: string
          piece_colors?: Json | null
          piece_style?: string
          preview_emoji: string
          preview_image_url?: string | null
          price: number
          rarity?: string
          theme_type?: string
        }
        Update: {
          asset_url?: string | null
          category?: string
          created_at?: string
          dark_square_color?: string
          description?: string | null
          has_custom_pieces?: boolean
          id?: string
          is_3d?: boolean
          is_premium?: boolean
          light_square_color?: string
          name?: string
          piece_colors?: Json | null
          piece_style?: string
          preview_emoji?: string
          preview_image_url?: string | null
          price?: number
          rarity?: string
          theme_type?: string
        }
        Relationships: []
      }
      class_upgrade_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_class: string
          id: string
          requested_class: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          current_class: string
          id?: string
          requested_class: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          current_class?: string
          id?: string
          requested_class?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          chat_room_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_for_receiver: boolean | null
          deleted_for_sender: boolean | null
          id: string
          message: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          chat_room_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_for_receiver?: boolean | null
          deleted_for_sender?: boolean | null
          id?: string
          message: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          chat_room_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_for_receiver?: boolean | null
          deleted_for_sender?: boolean | null
          id?: string
          message?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_groups: {
        Row: {
          created_at: string | null
          friend_id: string
          group_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          group_name?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          group_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string | null
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_messages: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_messages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_spectators: {
        Row: {
          game_id: string
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          game_id: string
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          game_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_spectators_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          black_player_id: string
          black_time_remaining: number
          cached_spectator_count: number | null
          challenge_id: string | null
          created_at: string
          current_turn: string
          fen: string
          id: string
          move_count: number | null
          move_history: Json | null
          pgn: string
          result: string | null
          spectator_count: number | null
          status: string
          time_control: string
          updated_at: string
          white_player_id: string
          white_time_remaining: number
        }
        Insert: {
          black_player_id: string
          black_time_remaining?: number
          cached_spectator_count?: number | null
          challenge_id?: string | null
          created_at?: string
          current_turn?: string
          fen?: string
          id?: string
          move_count?: number | null
          move_history?: Json | null
          pgn?: string
          result?: string | null
          spectator_count?: number | null
          status?: string
          time_control: string
          updated_at?: string
          white_player_id: string
          white_time_remaining?: number
        }
        Update: {
          black_player_id?: string
          black_time_remaining?: number
          cached_spectator_count?: number | null
          challenge_id?: string | null
          created_at?: string
          current_turn?: string
          fen?: string
          id?: string
          move_count?: number | null
          move_history?: Json | null
          pgn?: string
          result?: string | null
          spectator_count?: number | null
          status?: string
          time_control?: string
          updated_at?: string
          white_player_id?: string
          white_time_remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: "games_black_player_id_fkey"
            columns: ["black_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_white_player_id_fkey"
            columns: ["white_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_chat_messages: {
        Row: {
          avatar_url: string | null
          class: string
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          class: string
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          class?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      master_progress: {
        Row: {
          created_at: string
          id: string
          last_power_used: number | null
          master_level: number
          master_xp: number
          total_losses: number
          total_matches: number
          total_wins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_power_used?: number | null
          master_level?: number
          master_xp?: number
          total_losses?: number
          total_matches?: number
          total_wins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_power_used?: number | null
          master_level?: number
          master_xp?: number
          total_losses?: number
          total_matches?: number
          total_wins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      match_history: {
        Row: {
          created_at: string | null
          end_time: string
          fen_history: Json | null
          id: string
          match_id: string
          move_timestamps: Json | null
          pgn: string
          player1_class: string
          player1_id: string
          player1_rating_after: number
          player1_rating_before: number
          player1_username: string
          player2_class: string
          player2_id: string
          player2_rating_after: number
          player2_rating_before: number
          player2_username: string
          result: string
          start_time: string
          total_moves: number
          tournament_id: string | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          fen_history?: Json | null
          id?: string
          match_id: string
          move_timestamps?: Json | null
          pgn: string
          player1_class: string
          player1_id: string
          player1_rating_after: number
          player1_rating_before: number
          player1_username: string
          player2_class: string
          player2_id: string
          player2_rating_after: number
          player2_rating_before: number
          player2_username: string
          result: string
          start_time: string
          total_moves: number
          tournament_id?: string | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          fen_history?: Json | null
          id?: string
          match_id?: string
          move_timestamps?: Json | null
          pgn?: string
          player1_class?: string
          player1_id?: string
          player1_rating_after?: number
          player1_rating_before?: number
          player1_username?: string
          player2_class?: string
          player2_id?: string
          player2_rating_after?: number
          player2_rating_before?: number
          player2_username?: string
          result?: string
          start_time?: string
          total_moves?: number
          tournament_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_queue: {
        Row: {
          created_at: string
          id: string
          rating: number
          status: string
          time_control: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          status?: string
          time_control: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          status?: string
          time_control?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          reactor_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          reactor_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          reactor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          min_class: string
          name: string
          preview_emoji: string
          price: number
          rarity: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_class?: string
          name: string
          preview_emoji?: string
          price: number
          rarity?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_class?: string
          name?: string
          preview_emoji?: string
          price?: number
          rarity?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class: string
          created_at: string
          email: string
          games_played: number
          games_won: number
          hourly_income: number
          id: string
          league: string
          level: number
          numeric_user_id: number | null
          points: number
          rating: number
          undo_moves: number
          updated_at: string
          username: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          class?: string
          created_at?: string
          email: string
          games_played?: number
          games_won?: number
          hourly_income?: number
          id: string
          league?: string
          level?: number
          numeric_user_id?: number | null
          points?: number
          rating?: number
          undo_moves?: number
          updated_at?: string
          username: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          class?: string
          created_at?: string
          email?: string
          games_played?: number
          games_won?: number
          hourly_income?: number
          id?: string
          league?: string
          level?: number
          numeric_user_id?: number | null
          points?: number
          rating?: number
          undo_moves?: number
          updated_at?: string
          username?: string
          xp?: number
        }
        Relationships: []
      }
      user_nfts: {
        Row: {
          id: string
          nft_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          nft_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          nft_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_nfts_nft_id_fkey"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "nft_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_page_preferences: {
        Row: {
          accent_color: string
          background_style: string
          button_style: string
          created_at: string
          id: string
          layout_style: string
          theme_mode: string
          ui_density: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          background_style?: string
          button_style?: string
          created_at?: string
          id?: string
          layout_style?: string
          theme_mode?: string
          ui_density?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          background_style?: string
          button_style?: string
          created_at?: string
          id?: string
          layout_style?: string
          theme_mode?: string
          ui_density?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_theme_preferences: {
        Row: {
          active_3d_theme_id: string | null
          active_board_theme_id: string | null
          active_piece_theme_id: string | null
          created_at: string
          custom_piece_colors: Json | null
          custom_square_colors: Json | null
          id: string
          is_3d_mode: boolean
          updated_at: string
          use_theme_boards: boolean | null
          user_id: string
        }
        Insert: {
          active_3d_theme_id?: string | null
          active_board_theme_id?: string | null
          active_piece_theme_id?: string | null
          created_at?: string
          custom_piece_colors?: Json | null
          custom_square_colors?: Json | null
          id?: string
          is_3d_mode?: boolean
          updated_at?: string
          use_theme_boards?: boolean | null
          user_id: string
        }
        Update: {
          active_3d_theme_id?: string | null
          active_board_theme_id?: string | null
          active_piece_theme_id?: string | null
          created_at?: string
          custom_piece_colors?: Json | null
          custom_square_colors?: Json | null
          id?: string
          is_3d_mode?: boolean
          updated_at?: string
          use_theme_boards?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_theme_preferences_active_3d_theme_id_fkey"
            columns: ["active_3d_theme_id"]
            isOneToOne: false
            referencedRelation: "chess_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_theme_preferences_active_board_theme_id_fkey"
            columns: ["active_board_theme_id"]
            isOneToOne: false
            referencedRelation: "chess_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_theme_preferences_active_piece_theme_id_fkey"
            columns: ["active_piece_theme_id"]
            isOneToOne: false
            referencedRelation: "chess_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_theme_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_themes: {
        Row: {
          id: string
          is_active: boolean
          purchased_at: string
          theme_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          purchased_at?: string
          theme_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          purchased_at?: string
          theme_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_themes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "chess_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_rankings: {
        Row: {
          created_at: string | null
          demoted: boolean | null
          ending_class: string | null
          ending_rating: number | null
          games_played: number | null
          games_won: number | null
          id: string
          promoted: boolean | null
          starting_class: string
          starting_rating: number
          updated_at: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          demoted?: boolean | null
          ending_class?: string | null
          ending_rating?: number | null
          games_played?: number | null
          games_won?: number | null
          id?: string
          promoted?: boolean | null
          starting_class: string
          starting_rating: number
          updated_at?: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          demoted?: boolean | null
          ending_class?: string | null
          ending_rating?: number | null
          games_played?: number | null
          games_won?: number | null
          id?: string
          promoted?: boolean | null
          starting_class?: string
          starting_rating?: number
          updated_at?: string | null
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_duplicate_challenge: {
        Args: { p_challenged_id: string; p_challenger_id: string }
        Returns: boolean
      }
      expire_old_challenges: { Args: never; Returns: undefined }
      expire_old_games: { Args: never; Returns: undefined }
      get_user_by_username_or_email: {
        Args: { identifier: string }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      is_username_available: {
        Args: { check_username: string }
        Returns: boolean
      }
      save_game_to_history: { Args: { p_game_id: string }; Returns: undefined }
      update_player_ratings: {
        Args: {
          loser_id: string
          loser_rating: number
          winner_id: string
          winner_rating: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
