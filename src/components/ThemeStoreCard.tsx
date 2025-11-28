import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Sparkles, Eye } from 'lucide-react';
import { ThemePreviewDialog } from './ThemePreviewDialog';

interface ThemeStoreCardProps {
  id: string;
  name: string;
  description: string | null;
  preview_emoji: string;
  price: number;
  rarity: string;
  theme_type: string;
  is_3d: boolean;
  isOwned: boolean;
  isActive?: boolean;
  onPurchase: () => void;
  onApply: () => void;
  light_square_color?: string;
  dark_square_color?: string;
  piece_colors?: { white: string; black: string };
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    case 'rare': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'epic': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'legendary': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
};

export const ThemeStoreCard = ({
  name,
  description,
  preview_emoji,
  price,
  rarity,
  theme_type,
  is_3d,
  isOwned,
  isActive,
  onPurchase,
  onApply,
  light_square_color,
  dark_square_color,
  piece_colors
}: ThemeStoreCardProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  
  return (
    <>
      <Card className="bg-card border-border overflow-hidden hover:border-primary/50 transition-all group">
      <div className="relative">
        {/* Preview */}
        <div className="h-40 bg-gradient-to-br from-card-dark to-card-darker flex items-center justify-center">
          <span className="text-7xl group-hover:scale-110 transition-transform">
            {preview_emoji}
          </span>
          {is_3d && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Sparkles className="h-3 w-3 mr-1" />
                3D
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-rajdhani font-bold text-lg text-foreground">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            </div>
            <Badge className={getRarityColor(rarity)}>
              {rarity}
            </Badge>
          </div>

          {/* Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {theme_type === '2d_board' && '🎨 Board'}
              {theme_type === '2d_pieces' && '♟️ Pieces'}
              {theme_type === '3d_full' && '🎲 Full 3D'}
            </Badge>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-primary font-rajdhani font-bold text-xl">
                <span>{price}</span>
                <span className="text-sm">pts</span>
              </div>

              {isOwned ? (
                <div className="flex gap-2">
                  {isActive ? (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={onApply}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Apply
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={onPurchase}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Buy
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
    
    <ThemePreviewDialog
      open={previewOpen}
      onOpenChange={setPreviewOpen}
      themeName={name}
      lightSquareColor={light_square_color}
      darkSquareColor={dark_square_color}
      pieceColors={piece_colors}
    />
    </>
  );
};
