import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

export const BoardColorCustomizer = () => {
  const { userPreferences, refreshThemes } = useTheme();
  const { user } = useAuth();
  const [lightColor, setLightColor] = useState('#A8B6C4');
  const [darkColor, setDarkColor] = useState('#1E2A39');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userPreferences?.custom_square_colors) {
      const colors = userPreferences.custom_square_colors as { light: string; dark: string };
      setLightColor(colors.light || '#A8B6C4');
      setDarkColor(colors.dark || '#1E2A39');
    }
  }, [userPreferences]);

  const handleSave = async () => {
    if (!user) {
      toast.error('Please log in to save your preferences');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_theme_preferences')
        .upsert({
          user_id: user.id,
          custom_square_colors: {
            light: lightColor,
            dark: darkColor
          }
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Apply colors globally
      document.documentElement.style.setProperty('--chess-light-square', lightColor);
      document.documentElement.style.setProperty('--chess-dark-square', darkColor);

      await refreshThemes();
      toast.success('Board colors saved!');
    } catch (error) {
      console.error('Error saving colors:', error);
      toast.error('Failed to save board colors');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const defaultLight = '#A8B6C4';
    const defaultDark = '#1E2A39';
    
    setLightColor(defaultLight);
    setDarkColor(defaultDark);

    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_theme_preferences')
        .upsert({
          user_id: user.id,
          custom_square_colors: {
            light: defaultLight,
            dark: defaultDark
          }
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      document.documentElement.style.setProperty('--chess-light-square', defaultLight);
      document.documentElement.style.setProperty('--chess-dark-square', defaultDark);

      await refreshThemes();
      toast.success('Board colors reset to default!');
    } catch (error) {
      console.error('Error resetting colors:', error);
      toast.error('Failed to reset board colors');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold font-rajdhani text-foreground">
            Board Square Colors
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="light-color" className="text-sm font-medium text-foreground">
              Light Squares
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="light-color"
                type="color"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                className="h-10 w-20 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                className="flex-1 h-10 px-3 rounded border border-border bg-background text-foreground"
                placeholder="#A8B6C4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dark-color" className="text-sm font-medium text-foreground">
              Dark Squares
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="dark-color"
                type="color"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                className="h-10 w-20 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                className="flex-1 h-10 px-3 rounded border border-border bg-background text-foreground"
                placeholder="#1E2A39"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Preview</Label>
          <div className="grid grid-cols-4 gap-0 w-full max-w-xs border-2 border-border rounded overflow-hidden">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="aspect-square"
                style={{
                  backgroundColor: i % 2 === 0 ? lightColor : darkColor
                }}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSaving ? 'Saving...' : 'Save Colors'}
        </Button>
      </div>
    </Card>
  );
};
