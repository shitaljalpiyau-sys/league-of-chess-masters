import { useState, useEffect } from 'react';
import { useThemeStore } from '@/hooks/useThemeStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Paintbrush, RotateCcw } from 'lucide-react';

const PRESET_COLORS = {
  white: [
    { name: 'Pure White', color: '#FFFFFF' },
    { name: 'Ivory', color: '#FFFFF0' },
    { name: 'Cream', color: '#FFFACD' },
    { name: 'Glossy White', color: '#F8F8FF' },
    { name: 'Silver', color: '#C0C0C0' },
    { name: 'Gold', color: '#FFD700' },
  ],
  black: [
    { name: 'Pure Black', color: '#000000' },
    { name: 'Matte Black', color: '#1C1C1C' },
    { name: 'Charcoal', color: '#36454F' },
    { name: 'Glossy Black', color: '#0A0A0A' },
    { name: 'Carbon Fiber', color: '#2B2B2B' },
    { name: 'Dark Gray', color: '#404040' },
  ]
};

export const PieceColorCustomizer = () => {
  const { preferences, updatePieceColors } = useThemeStore();
  const [whiteColor, setWhiteColor] = useState('#FFFFFF');
  const [blackColor, setBlackColor] = useState('#000000');

  useEffect(() => {
    if (preferences?.custom_piece_colors) {
      setWhiteColor(preferences.custom_piece_colors.white);
      setBlackColor(preferences.custom_piece_colors.black);
    }
  }, [preferences]);

  const handleApply = () => {
    updatePieceColors({ white: whiteColor, black: blackColor });
  };

  const handleReset = () => {
    const defaultColors = { white: '#FFFFFF', black: '#000000' };
    setWhiteColor(defaultColors.white);
    setBlackColor(defaultColors.black);
    updatePieceColors(defaultColors);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-primary/20 rounded-lg">
            <Paintbrush className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-rajdhani font-bold text-lg text-foreground mb-2">
              Custom Piece Colors
            </h3>
            <p className="text-muted-foreground text-sm">
              Choose custom colors for your chess pieces. These colors will apply globally across all game modes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* White Pieces */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-foreground">White Pieces</Label>
            
            {/* Custom Color Picker */}
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={whiteColor}
                onChange={(e) => setWhiteColor(e.target.value)}
                className="w-16 h-16 rounded-lg border-2 border-border cursor-pointer"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{whiteColor.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">Custom Color</p>
              </div>
            </div>

            {/* Preset Colors */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COLORS.white.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setWhiteColor(preset.color)}
                  className={`
                    p-3 rounded-lg border-2 transition-all hover:scale-105
                    ${whiteColor === preset.color ? 'border-primary ring-2 ring-primary/30' : 'border-border'}
                  `}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                >
                  <div className="aspect-square flex items-center justify-center text-2xl">
                    ♚
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Black Pieces */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-foreground">Black Pieces</Label>
            
            {/* Custom Color Picker */}
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={blackColor}
                onChange={(e) => setBlackColor(e.target.value)}
                className="w-16 h-16 rounded-lg border-2 border-border cursor-pointer"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{blackColor.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">Custom Color</p>
              </div>
            </div>

            {/* Preset Colors */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COLORS.black.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setBlackColor(preset.color)}
                  className={`
                    p-3 rounded-lg border-2 transition-all hover:scale-105
                    ${blackColor === preset.color ? 'border-primary ring-2 ring-primary/30' : 'border-border'}
                  `}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                >
                  <div className="aspect-square flex items-center justify-center text-2xl text-white">
                    ♚
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 bg-background rounded-lg border border-border">
          <Label className="text-sm font-semibold text-foreground mb-3 block">Preview</Label>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-6xl mb-2" style={{ color: whiteColor, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                ♚ ♛ ♜ ♝ ♞ ♟
              </div>
              <p className="text-xs text-muted-foreground">White Pieces</p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-2" style={{ color: blackColor, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                ♚ ♛ ♜ ♝ ♞ ♟
              </div>
              <p className="text-xs text-muted-foreground">Black Pieces</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button onClick={handleApply} className="flex-1">
            Apply Colors
          </Button>
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
        </div>
      </Card>
    </div>
  );
};