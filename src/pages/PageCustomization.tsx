import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BoardColorCustomizer } from '@/components/BoardColorCustomizer';
import { PieceColorCustomizer } from '@/components/PieceColorCustomizer';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PageCustomization() {
  const { userPreferences, refreshThemes } = useTheme();
  const { user } = useAuth();

  const handleThemeToggle = async (enabled: boolean) => {
    if (!user) {
      toast.error('Please log in to change settings');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_theme_preferences')
        .upsert({
          user_id: user.id,
          use_theme_boards: enabled
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      await refreshThemes();
      toast.success(enabled ? 'Theme boards enabled' : 'Custom colors enabled');
    } catch (error) {
      console.error('Error updating theme preference:', error);
      toast.error('Failed to update preference');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Chess Board Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your chess board appearance</p>
      </div>

      <div className="space-y-6">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="use-theme" className="text-base font-semibold">
              Use Theme Boards
            </Label>
            <p className="text-sm text-muted-foreground">
              When disabled, your custom board colors will override any theme
            </p>
          </div>
          <Switch
            id="use-theme"
            checked={userPreferences?.use_theme_boards !== false}
            onCheckedChange={handleThemeToggle}
          />
        </div>

        {/* Board Color Customizer */}
        <BoardColorCustomizer />

        {/* Piece Color Customizer */}
        <PieceColorCustomizer />
      </div>
    </div>
  );
}