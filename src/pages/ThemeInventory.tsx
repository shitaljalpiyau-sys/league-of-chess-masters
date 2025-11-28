import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Calendar, Trophy, Check } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

const ThemeInventory = () => {
  const { userThemes, activeTheme, applyTheme, isLoading } = useTheme();
  
  const ownedThemes = useMemo(() => {
    return userThemes.map(theme => ({
      ...theme,
      acquired: new Date().toLocaleDateString(),
      isEquipped: activeTheme?.id === theme.id
    }));
  }, [userThemes, activeTheme]);

  const totalValue = useMemo(() => {
    return userThemes.reduce((sum, theme) => sum + theme.price, 0);
  }, [userThemes]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "from-purple-500/20 to-pink-500/20 border-purple-500/50";
      case "epic": return "from-yellow-500/20 to-orange-500/20 border-yellow-500/50";
      case "rare": return "from-blue-500/20 to-cyan-500/20 border-blue-500/50";
      default: return "from-gray-500/20 to-gray-600/20 border-gray-500/50";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 pt-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold font-rajdhani text-primary mb-2">Loading your themes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold font-rajdhani text-primary mb-3">MY THEMES</h1>
          <p className="text-muted-foreground">View and manage your chess board themes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">Total Themes</h3>
            </div>
            <div className="text-3xl font-bold font-rajdhani">{ownedThemes.length}</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-6 w-6 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">Equipped</h3>
            </div>
            <div className="text-2xl font-bold font-rajdhani">
              {activeTheme?.name || "None"}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-6 w-6 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">Collection Value</h3>
            </div>
            <div className="text-3xl font-bold font-rajdhani flex items-center gap-2">
              <Star className="h-6 w-6" />
              {totalValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Themes Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Themes</TabsTrigger>
            <TabsTrigger value="equipped">Equipped</TabsTrigger>
            <TabsTrigger value="legendary">Legendary</TabsTrigger>
            <TabsTrigger value="epic">Epic</TabsTrigger>
            <TabsTrigger value="rare">Rare</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedThemes.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">You don't own any themes yet. Visit the Marketplace to get started!</p>
                </div>
              ) : (
                ownedThemes.map((theme) => (
                  <div 
                    key={theme.id}
                    className={`bg-gradient-to-br ${getRarityColor(theme.rarity)} border rounded-lg p-6 transition-all relative`}
                  >
                    {theme.isEquipped && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        ACTIVE
                      </div>
                    )}
                    
                    <div className="text-6xl mb-4 text-center">{theme.preview_emoji}</div>
                    
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold font-rajdhani mb-1">{theme.name}</h3>
                      <span className="text-xs uppercase text-primary font-bold">
                        {theme.rarity}
                      </span>
                      {theme.description && (
                        <p className="text-xs text-muted-foreground mt-2">{theme.description}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Acquired
                        </span>
                        <span className="font-semibold">{theme.acquired}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Value
                        </span>
                        <span className="font-semibold">{theme.price === 0 ? 'FREE' : theme.price.toLocaleString()}</span>
                      </div>

                      <Button
                        onClick={() => applyTheme(theme.id)}
                        disabled={theme.isEquipped}
                        className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                          theme.isEquipped 
                            ? 'bg-secondary text-secondary-foreground border border-border cursor-not-allowed' 
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        {theme.isEquipped ? 'Currently Equipped' : 'Equip Theme'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="equipped" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedThemes.filter(t => t.isEquipped).map((theme) => (
                <div 
                  key={theme.id}
                  className={`bg-gradient-to-br ${getRarityColor(theme.rarity)} border rounded-lg p-6 transition-all relative`}
                >
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    ACTIVE
                  </div>
                  
                  <div className="text-6xl mb-4 text-center">{theme.preview_emoji}</div>
                  
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold font-rajdhani mb-1">{theme.name}</h3>
                    <span className="text-xs uppercase text-primary font-bold">
                      {theme.rarity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {["legendary", "epic", "rare"].map((rarity) => (
            <TabsContent key={rarity} value={rarity} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedThemes.filter(t => t.rarity === rarity).map((theme) => (
                  <div 
                    key={theme.id}
                    className={`bg-gradient-to-br ${getRarityColor(theme.rarity)} border rounded-lg p-6 transition-all relative`}
                  >
                    {theme.isEquipped && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        ACTIVE
                      </div>
                    )}
                    
                    <div className="text-6xl mb-4 text-center">{theme.preview_emoji}</div>
                    
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold font-rajdhani mb-1">{theme.name}</h3>
                      <span className="text-xs uppercase text-primary font-bold">
                        {theme.rarity}
                      </span>
                    </div>

                    <Button
                      onClick={() => applyTheme(theme.id)}
                      disabled={theme.isEquipped}
                      className="w-full"
                    >
                      {theme.isEquipped ? 'Currently Equipped' : 'Equip Theme'}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default ThemeInventory;
