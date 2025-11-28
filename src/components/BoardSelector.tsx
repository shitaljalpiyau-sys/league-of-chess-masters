import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, Check } from 'lucide-react';
import { useThemeStore } from '@/hooks/useThemeStore';
import { ThemePreviewDialog } from './ThemePreviewDialog';

const BOARD_STYLES = [
  {
    id: '2d_classic',
    name: '2D Classic',
    category: '2D',
    lightColor: '#f0d9b5',
    darkColor: '#b58863',
    emoji: '🎯'
  },
  {
    id: '2d_modern',
    name: '2D Modern',
    category: '2D',
    lightColor: '#e8e8e8',
    darkColor: '#4a5f73',
    emoji: '⚡'
  },
  {
    id: '2d_wooden',
    name: '2D Wooden',
    category: '2D',
    lightColor: '#d4a574',
    darkColor: '#8b5a2b',
    emoji: '🪵'
  },
  {
    id: '2d_marble',
    name: '2D Marble',
    category: '2D',
    lightColor: '#f5f5f5',
    darkColor: '#333333',
    emoji: '🏛️'
  },
  {
    id: '2d_neon',
    name: '2D Neon',
    category: '2D',
    lightColor: '#00ff88',
    darkColor: '#0088ff',
    emoji: '🌟'
  },
  {
    id: '3d_wooden',
    name: '3D Wooden',
    category: '3D',
    lightColor: '#c9a87c',
    darkColor: '#7b5938',
    emoji: '🪵',
    is3D: true
  },
  {
    id: '3d_stone',
    name: '3D Stone',
    category: '3D',
    lightColor: '#d0d0d0',
    darkColor: '#505050',
    emoji: '🗿',
    is3D: true
  },
  {
    id: '3d_glass',
    name: '3D Glass',
    category: '3D',
    lightColor: '#e0f0ff',
    darkColor: '#4080c0',
    emoji: '💎',
    is3D: true
  }
];

export const BoardSelector = () => {
  const { preferences, boardThemes, applyTheme } = useThemeStore();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<any>(null);

  const handleStyleSelect = (styleId: string) => {
    const style = BOARD_STYLES.find(s => s.id === styleId);
    if (!style) return;

    // Find matching theme in store
    const matchingTheme = boardThemes.find(t => 
      t.name.toLowerCase().includes(style.name.toLowerCase().replace('2d ', '').replace('3d ', ''))
    );

    if (matchingTheme) {
      applyTheme(matchingTheme.id, matchingTheme.theme_type);
    }
    
    setSelectedStyle(styleId);
  };

  const handlePreview = (styleId: string) => {
    const style = BOARD_STYLES.find(s => s.id === styleId);
    if (style) {
      setPreviewTheme(style);
      setPreviewOpen(true);
    }
  };

  const activeStyleId = preferences?.active_board_theme_id 
    ? boardThemes.find(t => t.id === preferences.active_board_theme_id)?.name.toLowerCase()
    : null;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-primary/20 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-rajdhani font-bold text-lg text-foreground mb-2">
              Board Selector
            </h3>
            <p className="text-muted-foreground text-sm">
              Choose from classic 2D boards or premium 3D experiences. Each style offers unique visual aesthetics.
            </p>
          </div>
        </div>

        {/* 2D Boards */}
        <div className="mb-8">
          <Label className="text-base font-semibold text-foreground mb-4 block">2D Board Styles</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {BOARD_STYLES.filter(s => s.category === '2D').map((style) => {
              const isActive = activeStyleId && activeStyleId.includes(style.name.toLowerCase().replace('2d ', ''));
              
              return (
                <div key={style.id} className="space-y-2">
                  <button
                    onClick={() => handleStyleSelect(style.id)}
                    className={`
                      w-full aspect-square rounded-lg border-2 transition-all hover:scale-105
                      ${isActive ? 'border-primary ring-4 ring-primary/30' : 'border-border'}
                      relative overflow-hidden
                    `}
                  >
                    {/* Mini board preview */}
                    <div className="grid grid-cols-4 gap-0 w-full h-full">
                      {[...Array(16)].map((_, i) => {
                        const isLight = Math.floor(i / 4) % 2 === i % 2;
                        return (
                          <div
                            key={i}
                            style={{
                              backgroundColor: isLight ? style.lightColor : style.darkColor
                            }}
                          />
                        );
                      })}
                    </div>
                    
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <Check className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    
                    <div className="absolute bottom-1 right-1 text-2xl">
                      {style.emoji}
                    </div>
                  </button>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground text-center">
                      {style.name}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handlePreview(style.id)}
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3D Boards */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Label className="text-base font-semibold text-foreground">3D Board Styles</Label>
            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">Premium</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {BOARD_STYLES.filter(s => s.category === '3D').map((style) => {
              const isActive = activeStyleId && activeStyleId.includes(style.name.toLowerCase().replace('3d ', ''));
              
              return (
                <div key={style.id} className="space-y-2">
                  <button
                    onClick={() => handleStyleSelect(style.id)}
                    className={`
                      w-full aspect-square rounded-lg border-2 transition-all hover:scale-105
                      ${isActive ? 'border-primary ring-4 ring-primary/30' : 'border-border'}
                      relative overflow-hidden
                    `}
                  >
                    {/* Mini board preview with 3D effect */}
                    <div className="grid grid-cols-4 gap-0 w-full h-full" style={{ transform: 'perspective(200px) rotateX(20deg)' }}>
                      {[...Array(16)].map((_, i) => {
                        const isLight = Math.floor(i / 4) % 2 === i % 2;
                        return (
                          <div
                            key={i}
                            style={{
                              backgroundColor: isLight ? style.lightColor : style.darkColor,
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                            }}
                          />
                        );
                      })}
                    </div>
                    
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <Check className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    
                    <div className="absolute bottom-1 right-1 text-2xl">
                      {style.emoji}
                    </div>
                  </button>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground text-center">
                      {style.name}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handlePreview(style.id)}
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {previewTheme && (
        <ThemePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          themeName={previewTheme.name}
          lightSquareColor={previewTheme.lightColor}
          darkSquareColor={previewTheme.darkColor}
        />
      )}
    </div>
  );
};