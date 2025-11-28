import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChessTheme {
  id: string;
  name: string;
  price: number;
  rarity: string;
  is_premium: boolean;
  light_square_color: string;
  dark_square_color: string;
  piece_style: string;
  preview_emoji: string;
  description: string | null;
  theme_type?: string;
  category?: string;
  is_3d?: boolean;
  piece_colors?: { white: string; black: string };
  has_custom_pieces?: boolean;
}

interface UserPreferences {
  is_3d_mode: boolean;
  custom_piece_colors: { white: string; black: string };
  custom_square_colors?: { light: string; dark: string };
  active_board_theme_id: string | null;
  active_piece_theme_id: string | null;
  active_3d_theme_id: string | null;
  use_theme_boards: boolean;
}

interface ThemeContextType {
  activeTheme: ChessTheme | null;
  activePieceTheme: ChessTheme | null;
  active3DTheme: ChessTheme | null;
  allThemes: ChessTheme[];
  userThemes: ChessTheme[];
  userPreferences: UserPreferences | null;
  isLoading: boolean;
  purchaseTheme: (themeId: string) => Promise<boolean>;
  applyTheme: (themeId: string) => Promise<void>;
  refreshThemes: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [activeTheme, setActiveTheme] = useState<ChessTheme | null>(null);
  const [activePieceTheme, setActivePieceTheme] = useState<ChessTheme | null>(null);
  const [active3DTheme, setActive3DTheme] = useState<ChessTheme | null>(null);
  const [allThemes, setAllThemes] = useState<ChessTheme[]>([]);
  const [userThemes, setUserThemes] = useState<ChessTheme[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadThemes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Load all available themes
      const { data: themes, error: themesError } = await supabase
        .from('chess_themes')
        .select('*')
        .order('price', { ascending: true });

      if (themesError) throw themesError;
      const themesWithTypes = (themes || []).map(theme => ({
        ...theme,
        piece_colors: theme.piece_colors as { white: string; black: string }
      }));
      setAllThemes(themesWithTypes);

      if (user) {
        // Load user's purchased themes with proper join
        const { data: userThemeData, error: userThemesError } = await supabase
          .from('user_themes')
          .select(`
            theme_id,
            is_active,
            chess_themes (
              id,
              name,
              price,
              rarity,
              is_premium,
              light_square_color,
              dark_square_color,
              piece_style,
              preview_emoji,
              description
            )
          `)
          .eq('user_id', user.id);

        if (userThemesError) throw userThemesError;

        // Extract themes from join result
        const purchased = userThemeData
          ?.map(ut => {
            const theme = ut.chess_themes;
            return theme && typeof theme === 'object' && 'id' in theme ? theme as ChessTheme : null;
          })
          .filter((t): t is ChessTheme => t !== null) || [];
        
        setUserThemes(purchased);

        // Load user preferences for new system
        const { data: prefs } = await supabase
          .from('user_theme_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (prefs) {
          setUserPreferences({
            is_3d_mode: prefs.is_3d_mode,
            custom_piece_colors: prefs.custom_piece_colors as { white: string; black: string },
            custom_square_colors: prefs.custom_square_colors as { light: string; dark: string } | undefined,
            active_board_theme_id: prefs.active_board_theme_id,
            active_piece_theme_id: prefs.active_piece_theme_id,
            active_3d_theme_id: prefs.active_3d_theme_id,
            use_theme_boards: prefs.use_theme_boards !== false
          });

          // Apply custom square colors to DOM
          if (prefs.custom_square_colors) {
            const colors = prefs.custom_square_colors as { light: string; dark: string };
            document.documentElement.style.setProperty('--chess-light-square', colors.light);
            document.documentElement.style.setProperty('--chess-dark-square', colors.dark);
          }

          // Set active board theme from preferences
          if (prefs.active_board_theme_id) {
            const boardTheme = themesWithTypes?.find(t => t.id === prefs.active_board_theme_id);
            if (boardTheme) setActiveTheme(boardTheme);
          }

          // Set active piece theme from preferences
          if (prefs.active_piece_theme_id) {
            const pieceTheme = themesWithTypes?.find(t => t.id === prefs.active_piece_theme_id);
            if (pieceTheme) setActivePieceTheme(pieceTheme);
          }

          // Set active 3D theme from preferences
          if (prefs.active_3d_theme_id) {
            const theme3D = themesWithTypes?.find(t => t.id === prefs.active_3d_theme_id);
            if (theme3D) setActive3DTheme(theme3D);
          }
        }

        // Find active theme from old system or use default (backward compatibility)
        const activeUserTheme = userThemeData?.find(ut => ut.is_active);
        if (activeUserTheme && !prefs?.active_board_theme_id) {
          const activeThemeData = activeUserTheme.chess_themes;
          if (activeThemeData && typeof activeThemeData === 'object' && 'id' in activeThemeData) {
          setActiveTheme(activeThemeData as ChessTheme);
          }
        }
        
        if (!activeUserTheme && !prefs?.active_board_theme_id) {
          // Set Classic Wooden as default
          const defaultTheme = themesWithTypes?.find(t => t.name === 'Classic Wooden');
          if (defaultTheme) {
            setActiveTheme(defaultTheme);
            // Auto-add default theme to user
            await supabase.from('user_themes').upsert({
              user_id: user.id,
              theme_id: defaultTheme.id,
              is_active: true
            });
          }
        }
      } else {
        // Not logged in - use default theme
        const defaultTheme = themesWithTypes?.find(t => t.name === 'Classic Wooden');
        if (defaultTheme) setActiveTheme(defaultTheme);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadThemes();
  }, []);

  const purchaseTheme = async (themeId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Please log in to purchase themes", variant: "destructive" });
        return false;
      }

      // Check if already owned
      const alreadyOwned = userThemes.some(t => t.id === themeId);
      if (alreadyOwned) {
        toast({ title: "Already Owned", description: "You already own this theme" });
        return false;
      }

      // Get theme price
      const theme = allThemes.find(t => t.id === themeId);
      if (!theme) return false;

      // Check user points
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      if (!profile || profile.points < theme.price) {
        toast({ title: "Insufficient Points", description: `You need ${theme.price} points to purchase this theme`, variant: "destructive" });
        return false;
      }

      // Deduct points and add theme
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: profile.points - theme.price })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from('user_themes')
        .insert({
          user_id: user.id,
          theme_id: themeId,
          is_active: false
        });

      if (insertError) throw insertError;

      toast({ title: "Purchase Successful!", description: `${theme.name} has been added to your collection` });
      await loadThemes();
      return true;
    } catch (error) {
      console.error('Error purchasing theme:', error);
      toast({ title: "Purchase Failed", description: "Something went wrong", variant: "destructive" });
      return false;
    }
  };

  const applyTheme = async (themeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Deactivate all themes
      await supabase
        .from('user_themes')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate selected theme
      await supabase
        .from('user_themes')
        .update({ is_active: true })
        .eq('user_id', user.id)
        .eq('theme_id', themeId);

      const theme = allThemes.find(t => t.id === themeId);
      if (theme) {
        setActiveTheme(theme);
        toast({ title: "Theme Applied", description: `${theme.name} is now your active theme` });
      }
      
      await loadThemes();
    } catch (error) {
      console.error('Error applying theme:', error);
      toast({ title: "Error", description: "Failed to apply theme", variant: "destructive" });
    }
  };

  const refreshThemes = async () => {
    await loadThemes();
  };

  return (
    <ThemeContext.Provider value={{ 
      activeTheme, 
      activePieceTheme,
      active3DTheme,
      allThemes, 
      userThemes, 
      userPreferences,
      isLoading,
      purchaseTheme,
      applyTheme,
      refreshThemes
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
