import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Star, Lock, Check, Sparkles } from 'lucide-react';

interface ItemPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    name: string;
    description: string | null;
    preview_emoji: string;
    price: number;
    rarity: string;
    type: string;
    light_square_color?: string;
    dark_square_color?: string;
    piece_colors?: { white: string; black: string };
  } | null;
  isOwned: boolean;
  isLocked: boolean;
  requiredClass?: string;
  onPurchase: () => void;
  onApply: () => void;
}

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'legendary': return 'text-purple-400';
    case 'epic': return 'text-yellow-400';
    case 'rare': return 'text-blue-400';
    default: return 'text-muted-foreground';
  }
};

export const ItemPreviewModal = ({
  open,
  onOpenChange,
  item,
  isOwned,
  isLocked,
  requiredClass,
  onPurchase,
  onApply
}: ItemPreviewModalProps) => {
  if (!item) return null;

  // Render preview board for board themes
  const renderBoardPreview = () => {
    if (!item.light_square_color || !item.dark_square_color) return null;

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const pieces: Record<string, string> = {
      'e8': '♚', 'd8': '♛', 'c8': '♝', 'f8': '♝', 'b8': '♞', 'g8': '♞', 'a8': '♜', 'h8': '♜',
      'a7': '♟', 'b7': '♟', 'c7': '♟', 'd7': '♟', 'e7': '♟', 'f7': '♟', 'g7': '♟', 'h7': '♟',
      'e1': '♔', 'd1': '♕', 'c1': '♗', 'f1': '♗', 'b1': '♘', 'g1': '♘', 'a1': '♖', 'h1': '♖',
      'a2': '♙', 'b2': '♙', 'c2': '♙', 'd2': '♙', 'e2': '♙', 'f2': '♙', 'g2': '♙', 'h2': '♙'
    };

    return (
      <div className="flex justify-center my-6">
        <div className="inline-block border-4 border-border rounded-lg overflow-hidden shadow-2xl">
          <div className="grid grid-cols-8 gap-0">
            {ranks.map((rank, rankIdx) =>
              files.map((file, fileIdx) => {
                const square = `${file}${rank}`;
                const isLight = (rankIdx + fileIdx) % 2 === 0;
                const piece = pieces[square];
                const bgColor = isLight ? item.light_square_color : item.dark_square_color;

                return (
                  <div
                    key={square}
                    style={{ backgroundColor: bgColor }}
                    className="w-16 h-16 flex items-center justify-center text-4xl"
                  >
                    {piece && (
                      <span
                        style={{
                          color: piece.charCodeAt(0) < 9818
                            ? item.piece_colors?.white || '#ffffff'
                            : item.piece_colors?.black || '#000000'
                        }}
                        className="drop-shadow-lg"
                      >
                        {piece}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{item.preview_emoji}</span>
            <div>
              <h2 className="text-2xl font-rajdhani font-bold">{item.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {item.type}
                </Badge>
                <Badge className={`text-xs ${getRarityColor(item.rarity)}`}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  {item.rarity.toUpperCase()}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Preview Content */}
        <div className="py-4">
          {item.description && (
            <p className="text-muted-foreground mb-6">{item.description}</p>
          )}

          {/* Board Preview */}
          {(item.light_square_color || item.dark_square_color) && renderBoardPreview()}

          {/* Large Emoji Preview for non-board items */}
          {!item.light_square_color && !item.dark_square_color && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[160px]">{item.preview_emoji}</span>
            </div>
          )}

          {/* Price Display */}
          <div className="bg-muted rounded-lg p-4 flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-primary" />
              <span className="font-rajdhani font-bold text-3xl text-primary">
                {item.price === 0 ? 'FREE' : item.price.toLocaleString()}
              </span>
              <span className="text-muted-foreground">points</span>
            </div>
            {isOwned && (
              <Badge className="bg-primary/90 text-primary-foreground">
                <Check className="h-4 w-4 mr-1" />
                OWNED
              </Badge>
            )}
          </div>

          {/* Lock Message */}
          {isLocked && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mt-4 flex items-center gap-3">
              <Lock className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-bold text-destructive">Locked Item</p>
                <p className="text-sm text-muted-foreground">
                  Requires Class {requiredClass} or higher to purchase
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {isOwned ? (
            <Button
              onClick={() => {
                onApply();
                onOpenChange(false);
              }}
              className="bg-primary hover:bg-primary/90"
              disabled={isLocked}
            >
              Apply Theme
            </Button>
          ) : (
            <Button
              onClick={() => {
                onPurchase();
                onOpenChange(false);
              }}
              className="bg-primary hover:bg-primary/90"
              disabled={isLocked}
            >
              <Lock className="h-4 w-4 mr-2" />
              Buy Now
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
