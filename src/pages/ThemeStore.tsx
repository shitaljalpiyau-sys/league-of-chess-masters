import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/hooks/useThemeStore';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeStoreCard } from '@/components/ThemeStoreCard';
import { PieceColorCustomizer } from '@/components/PieceColorCustomizer';
import { BoardSelector } from '@/components/BoardSelector';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Palette, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ThemeStore() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    boardThemes,
    pieceThemes,
    themes3D,
    ownedThemes,
    preferences,
    loading,
    purchaseTheme,
    applyTheme,
    toggle3DMode
  } = useThemeStore();

  const [activeTab, setActiveTab] = useState('boards');

  const handlePurchase = async (themeId: string, price: number) => {
    await purchaseTheme(themeId, price);
  };

  const handleApply = async (themeId: string, themeType: string) => {
    await applyTheme(themeId, themeType);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading themes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/marketplace')} className="border-border">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold font-rajdhani text-foreground">
                Theme Store
              </h1>
              <p className="text-muted-foreground mt-1">
                Customize your chess experience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="text-lg px-4 py-2 bg-primary/20 text-primary border-primary/30">
              {profile?.points || 0} points
            </Badge>
            {preferences && (
              <Button
                onClick={toggle3DMode}
                variant={preferences.is_3d_mode ? 'default' : 'outline'}
                className="border-border"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {preferences.is_3d_mode ? '3D Mode' : '2D Mode'}
              </Button>
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-rajdhani font-bold text-lg text-foreground mb-2">
                About Theme Store
              </h3>
              <p className="text-muted-foreground text-sm">
                Purchase and apply custom themes to personalize your chess board and pieces. 
                2D themes cost 100 points, while premium 3D themes cost 1,000 points. 
                Themes apply globally across all game modes!
              </p>
            </div>
          </div>
        </Card>

        {/* Theme Categories */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-card border border-border">
            <TabsTrigger value="selector" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              ⚙️ Board Selector
            </TabsTrigger>
            <TabsTrigger value="boards" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              🎨 Board Skins
            </TabsTrigger>
            <TabsTrigger value="pieces" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              ♟️ Piece Sets
            </TabsTrigger>
            <TabsTrigger value="colors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              🎨 Custom Colors
            </TabsTrigger>
            <TabsTrigger value="3d" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              🎲 3D Themes
            </TabsTrigger>
          </TabsList>

          {/* Board Selector */}
          <TabsContent value="selector" className="mt-6">
            <BoardSelector />
          </TabsContent>

          {/* 2D Board Themes */}
          <TabsContent value="boards" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boardThemes.map((theme) => (
                <ThemeStoreCard
                  key={theme.id}
                  {...theme}
                  isOwned={ownedThemes.includes(theme.id)}
                  isActive={preferences?.active_board_theme_id === theme.id}
                  onPurchase={() => handlePurchase(theme.id, theme.price)}
                  onApply={() => handleApply(theme.id, theme.theme_type)}
                />
              ))}
            </div>
          </TabsContent>

          {/* 2D Piece Themes */}
          <TabsContent value="pieces" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pieceThemes.map((theme) => (
                <ThemeStoreCard
                  key={theme.id}
                  {...theme}
                  isOwned={ownedThemes.includes(theme.id)}
                  isActive={preferences?.active_piece_theme_id === theme.id}
                  onPurchase={() => handlePurchase(theme.id, theme.price)}
                  onApply={() => handleApply(theme.id, theme.theme_type)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Custom Colors */}
          <TabsContent value="colors" className="mt-6">
            <PieceColorCustomizer />
          </TabsContent>

          {/* 3D Full Themes */}
          <TabsContent value="3d" className="mt-6">
            <Card className="p-6 bg-primary/10 border-primary/30 mb-6">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-rajdhani font-bold text-lg">Premium 3D Experience</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Full 3D themes include realistic board, pieces, shadows, and rotatable camera. 
                Toggle between 2D and 3D anytime using the mode switcher above.
              </p>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes3D.map((theme) => (
                <ThemeStoreCard
                  key={theme.id}
                  {...theme}
                  isOwned={ownedThemes.includes(theme.id)}
                  isActive={preferences?.active_3d_theme_id === theme.id}
                  onPurchase={() => handlePurchase(theme.id, theme.price)}
                  onApply={() => handleApply(theme.id, theme.theme_type)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
