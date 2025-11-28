import { useState, useEffect } from 'react';
import { Star, ChevronLeft, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePointsEarning } from '@/hooks/usePointsEarning';
import { MarketplaceItemCard } from '@/components/MarketplaceItemCard';
import { ItemPreviewModal } from '@/components/ItemPreviewModal';

type Category = 'board' | 'pieces' | 'animations' | 'backgrounds' | 'upgrade' | 'limited';
type RarityFilter = 'all' | 'legendary' | 'epic' | 'rare' | 'common';

const CLASS_ORDER = ['D', 'C', 'B', 'A', 'ELITE'];

const getClassLevel = (userClass: string): number => {
  return CLASS_ORDER.indexOf(userClass);
};

export default function Marketplace() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [allThemes, setAllThemes] = useState<any[]>([]);
  const [ownedThemes, setOwnedThemes] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('board');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [userPoints, setUserPoints] = useState(profile?.points || 0);
  const [hourlyIncome, setHourlyIncome] = useState(100);
  const { points, updatePoints } = usePointsEarning(userPoints, hourlyIncome);

  useEffect(() => {
    loadData();
    loadUserIncome();
  }, []);

  useEffect(() => {
    if (profile) {
      setUserPoints(profile.points);
    }
  }, [profile]);

  const loadUserIncome = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('hourly_income')
      .eq('id', user.id)
      .single();
    if (data) setHourlyIncome(data.hourly_income || 100);
  };

  const loadData = async () => {
    // Load themes
    const { data: themes } = await supabase
      .from('chess_themes')
      .select('*')
      .order('price', { ascending: true });

    setAllThemes(themes || []);

    // Load owned themes
    if (user) {
      const { data: owned } = await supabase
        .from('user_themes')
        .select('theme_id')
        .eq('user_id', user.id);

      setOwnedThemes(owned?.map(t => t.theme_id) || []);
    }
  };

  const categories = [
    { id: 'board' as Category, name: 'Board Themes', type: '2d_board' },
    { id: 'pieces' as Category, name: 'Piece Themes', type: '2d_pieces' },
    { id: 'animations' as Category, name: 'Animations', type: 'animation' },
    { id: 'backgrounds' as Category, name: 'Background Themes', type: 'background' },
    { id: 'limited' as Category, name: 'Limited Items', type: '3d_full' }
  ];

  const rarityFilters: RarityFilter[] = ['all', 'legendary', 'epic', 'rare', 'common'];

  const getFilteredItems = () => {
    const currentCategory = categories.find(c => c.id === activeCategory);
    let filtered = allThemes.filter(t => t.theme_type === currentCategory?.type);

    if (rarityFilter !== 'all') {
      filtered = filtered.filter(t => t.rarity.toLowerCase() === rarityFilter);
    }

    return filtered;
  };

  const getRequiredClass = (item: any): string | undefined => {
    // Class requirements based on rarity
    switch (item.rarity.toLowerCase()) {
      case 'legendary': return 'A';
      case 'epic': return 'B';
      case 'rare': return 'C';
      default: return undefined;
    }
  };

  const isItemLocked = (item: any): boolean => {
    if (!profile) return true;
    const requiredClass = getRequiredClass(item);
    if (!requiredClass) return false;

    const userLevel = getClassLevel(profile.class);
    const requiredLevel = getClassLevel(requiredClass);
    return userLevel < requiredLevel;
  };

  const handlePurchase = async (item: any) => {
    if (!user || !profile) {
      toast.error('Please login to purchase items');
      return;
    }

    if (points < item.price) {
      toast.error('Not enough points!');
      return;
    }

    if (isItemLocked(item)) {
      toast.error(`Requires Class ${getRequiredClass(item)} or higher!`);
      return;
    }

    try {
      // Deduct points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: points - item.price })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Add theme to inventory
      const { error: insertError } = await supabase
        .from('user_themes')
        .insert({
          user_id: user.id,
          theme_id: item.id
        });

      if (insertError) throw insertError;

      toast.success('Purchase successful!');
      updatePoints(points - item.price);
      loadData();
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed');
    }
  };

  const handleApply = async (item: any) => {
    if (!user) return;

    try {
      const updates: any = {};
      
      if (item.theme_type === '2d_board') {
        updates.active_board_theme_id = item.id;
      } else if (item.theme_type === '2d_pieces') {
        updates.active_piece_theme_id = item.id;
      } else if (item.theme_type === '3d_full') {
        updates.active_3d_theme_id = item.id;
        updates.is_3d_mode = true;
      }

      const { error } = await supabase
        .from('user_theme_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Theme applied!');
    } catch (error) {
      console.error('Apply error:', error);
      toast.error('Failed to apply theme');
    }
  };

  const filteredItems = getFilteredItems();
  const lockedItemCount = filteredItems.filter(isItemLocked).length;

  return (
    <div className="min-h-screen pb-20 pt-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold font-rajdhani text-primary">
                PREMIUM MARKETPLACE
              </h1>
              <p className="text-muted-foreground">
                Exclusive themes and items for chess masters
              </p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg px-6 py-4">
            <div className="text-sm text-muted-foreground mb-1">Your Points</div>
            <div className="text-3xl font-bold font-rajdhani text-primary flex items-center gap-2">
              <Star className="h-6 w-6" />
              {points.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Motivation Banner */}
        {lockedItemCount > 0 && (
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <p className="font-bold text-primary">Unlock Premium Items!</p>
              <p className="text-sm text-muted-foreground">
                {lockedItemCount} item{lockedItemCount > 1 ? 's' : ''} available at higher classes. Upgrade to access exclusive content!
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/notice-board')}
            >
              Learn More
            </Button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setActiveCategory(cat.id)}
              className="whitespace-nowrap"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Rarity Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {rarityFilters.map((rarity) => (
            <Button
              key={rarity}
              variant={rarityFilter === rarity ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRarityFilter(rarity)}
              className="whitespace-nowrap"
            >
              {rarity === 'all' ? 'ALL' : rarity.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <MarketplaceItemCard
              key={item.id}
              id={item.id}
              name={item.name}
              description={item.description}
              preview_emoji={item.preview_emoji}
              price={item.price}
              rarity={item.rarity}
              type={item.theme_type}
              isOwned={ownedThemes.includes(item.id)}
              isLocked={isItemLocked(item)}
              requiredClass={getRequiredClass(item)}
              userClass={profile?.class || 'D'}
              onPurchase={() => handlePurchase(item)}
              onApply={() => handleApply(item)}
              onPreview={() => {
                setPreviewItem(item);
                setShowPreviewModal(true);
              }}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              No items found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later for new items
            </p>
          </div>
        )}

        {/* Preview Modal */}
        <ItemPreviewModal
          open={showPreviewModal}
          onOpenChange={setShowPreviewModal}
          item={previewItem}
          isOwned={previewItem ? ownedThemes.includes(previewItem.id) : false}
          isLocked={previewItem ? isItemLocked(previewItem) : false}
          requiredClass={previewItem ? getRequiredClass(previewItem) : undefined}
          onPurchase={() => previewItem && handlePurchase(previewItem)}
          onApply={() => previewItem && handleApply(previewItem)}
        />
      </div>
    </div>
  );
}
