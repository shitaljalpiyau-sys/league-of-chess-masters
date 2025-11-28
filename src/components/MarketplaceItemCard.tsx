import { Lock, Eye, Star, Check, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface MarketplaceItemCardProps {
  id: string;
  name: string;
  description: string | null;
  preview_emoji: string;
  price: number;
  rarity: string;
  type: string;
  isOwned: boolean;
  isLocked: boolean;
  requiredClass?: string;
  userClass: string;
  onPurchase: () => void;
  onApply: () => void;
  onPreview: () => void;
}

const getRarityStyles = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'legendary':
      return {
        border: 'border-2 border-purple-500',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
        gradient: 'from-purple-500/20 via-pink-500/10 to-purple-500/20',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      };
    case 'epic':
      return {
        border: 'border-2 border-yellow-500',
        glow: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]',
        gradient: 'from-yellow-500/20 via-orange-500/10 to-yellow-500/20',
        badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
      };
    case 'rare':
      return {
        border: 'border-2 border-blue-500',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
        gradient: 'from-blue-500/20 via-cyan-500/10 to-blue-500/20',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      };
    default:
      return {
        border: 'border border-border',
        glow: '',
        gradient: 'from-card to-card',
        badge: 'bg-muted text-muted-foreground border-border'
      };
  }
};

export const MarketplaceItemCard = ({
  name,
  description,
  preview_emoji,
  price,
  rarity,
  type,
  isOwned,
  isLocked,
  requiredClass,
  onPurchase,
  onApply,
  onPreview
}: MarketplaceItemCardProps) => {
  const styles = getRarityStyles(rarity);

  return (
    <div
      className={`
        relative bg-gradient-to-br ${styles.gradient} rounded-lg overflow-hidden
        ${styles.border} ${styles.glow}
        transition-all duration-300 hover:scale-[1.02]
        ${isLocked ? 'opacity-60' : ''}
      `}
    >
      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 backdrop-blur-sm bg-background/50 z-10 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-12 w-12 text-primary mx-auto mb-2" />
            <p className="text-sm font-bold text-primary">
              Requires Class {requiredClass}
            </p>
          </div>
        </div>
      )}

      {/* Owned Badge */}
      {isOwned && !isLocked && (
        <div className="absolute top-3 right-3 z-20">
          <Badge className="bg-primary/90 text-primary-foreground">
            <Check className="h-3 w-3 mr-1" />
            OWNED
          </Badge>
        </div>
      )}

      {/* Rarity Badge */}
      <div className="absolute top-3 left-3 z-20">
        <Badge className={styles.badge}>
          <Sparkles className="h-3 w-3 mr-1" />
          {rarity.toUpperCase()}
        </Badge>
      </div>

      {/* Preview Section */}
      <div className="h-48 bg-gradient-to-br from-background to-muted flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_100%)]" />
        <span className="text-8xl relative z-10 group-hover:scale-110 transition-transform">
          {preview_emoji}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-rajdhani font-bold text-xl text-foreground mb-1">
            {name}
          </h3>
          <Badge variant="outline" className="text-xs mb-2">
            {type}
          </Badge>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <span className="font-rajdhani font-bold text-2xl text-primary">
              {price === 0 ? 'FREE' : price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onPreview}
            disabled={isLocked}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

          {isOwned ? (
            <Button
              size="sm"
              className="w-full bg-primary hover:bg-primary/90"
              onClick={onApply}
              disabled={isLocked}
            >
              Apply Theme
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full bg-primary hover:bg-primary/90"
              onClick={onPurchase}
              disabled={isLocked}
            >
              <Lock className="h-4 w-4 mr-2" />
              Buy Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
