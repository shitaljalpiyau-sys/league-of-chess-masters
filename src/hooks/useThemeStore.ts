import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Theme {
  id: string;
  name: string;
  description: string | null;
  light_square_color: string;
  dark_square_color: string;
  preview_emoji: string;
  price: number;
  is_premium: boolean;
  rarity: string;
  theme_type: string;
  category: string;
  is_3d: boolean;
  piece_colors: { white: string; black: string };
  has_custom_pieces: boolean;
}

interface UserThemePreferences {
  active_board_theme_id: string | null;
  active_piece_theme_id: string | null;
  active_3d_theme_id: string | null;
  is_3d_mode: boolean;
  custom_piece_colors: { white: string; black: string };
}

export const useThemeStore = () => {
  const { user, profile } = useAuth();
  const [allThemes, setAllThemes] = useState<Theme[]>([]);
  const [ownedThemes, setOwnedThemes] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserThemePreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all available themes
  const fetchThemes = async () => {
    const { data, error } = await supabase
      .from('chess_themes')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching themes:', error);
      return;
    }

    const themes = (data || []).map(theme => ({
      ...theme,
      piece_colors: theme.piece_colors as { white: string; black: string }
    }));

    setAllThemes(themes);
  };

  // Fetch user's owned themes
  const fetchOwnedThemes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_themes')
      .select('theme_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching owned themes:', error);
      return;
    }

    setOwnedThemes(data?.map(t => t.theme_id) || []);
  };

  // Fetch user preferences
  const fetchPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_theme_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error);
      return;
    }

    if (!data) {
      // Create default preferences
      const { data: newPrefs, error: insertError } = await supabase
        .from('user_theme_preferences')
        .insert({
          user_id: user.id,
          is_3d_mode: false,
          custom_piece_colors: { white: '#ffffff', black: '#000000' }
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating preferences:', insertError);
        return;
      }

      setPreferences({
        ...newPrefs,
        custom_piece_colors: newPrefs.custom_piece_colors as { white: string; black: string }
      });
    } else {
      setPreferences({
        ...data,
        custom_piece_colors: data.custom_piece_colors as { white: string; black: string }
      });
    }
  };

  // Purchase theme
  const purchaseTheme = async (themeId: string, price: number) => {
    if (!user || !profile) {
      toast.error('Please login to purchase themes');
      return false;
    }

    if (profile.xp < price) {
      toast.error('Not enough XP!');
      return false;
    }

    try {
      // Deduct XP
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ xp: profile.xp - price })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Add theme to user inventory
      const { error: insertError } = await supabase
        .from('user_themes')
        .insert({
          user_id: user.id,
          theme_id: themeId,
          is_active: false
        });

      if (insertError) throw insertError;

      toast.success('Theme purchased successfully!');
      fetchOwnedThemes();
      return true;
    } catch (error) {
      console.error('Error purchasing theme:', error);
      toast.error('Failed to purchase theme');
      return false;
    }
  };

  // Apply theme
  const applyTheme = async (themeId: string, themeType: string) => {
    if (!user || !preferences) return false;

    try {
      const updates: Partial<UserThemePreferences> = {};

      if (themeType === '2d_board') {
        updates.active_board_theme_id = themeId;
      } else if (themeType === '2d_pieces') {
        updates.active_piece_theme_id = themeId;
      } else if (themeType === '3d_full') {
        updates.active_3d_theme_id = themeId;
        updates.is_3d_mode = true;
      }

      const { error } = await supabase
        .from('user_theme_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Theme applied!');
      fetchPreferences();
      return true;
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error('Failed to apply theme');
      return false;
    }
  };

  // Toggle 2D/3D mode
  const toggle3DMode = async () => {
    if (!user || !preferences) return;

    try {
      const { error } = await supabase
        .from('user_theme_preferences')
        .update({ is_3d_mode: !preferences.is_3d_mode })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`Switched to ${!preferences.is_3d_mode ? '3D' : '2D'} mode`);
      fetchPreferences();
    } catch (error) {
      console.error('Error toggling mode:', error);
      toast.error('Failed to toggle mode');
    }
  };

  // Update piece colors
  const updatePieceColors = async (colors: { white: string; black: string }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_theme_preferences')
        .update({ custom_piece_colors: colors })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Piece colors updated!');
      fetchPreferences();
    } catch (error) {
      console.error('Error updating colors:', error);
      toast.error('Failed to update colors');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchThemes(),
        fetchOwnedThemes(),
        fetchPreferences()
      ]);
      setLoading(false);
    };

    loadData();
  }, [user?.id]);

  return {
    allThemes,
    ownedThemes,
    preferences,
    loading,
    purchaseTheme,
    applyTheme,
    toggle3DMode,
    updatePieceColors,
    boardThemes: allThemes.filter(t => t.theme_type === '2d_board'),
    pieceThemes: allThemes.filter(t => t.theme_type === '2d_pieces'),
    themes3D: allThemes.filter(t => t.theme_type === '3d_full')
  };
};
