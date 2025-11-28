import { TrendingGames } from "@/components/dashboard/TrendingGames";
import { LeaderboardPreview } from "@/components/dashboard/LeaderboardPreview";
import { RecentWinnings } from "@/components/dashboard/RecentWinnings";
import { usePageCustomization } from "@/contexts/PageCustomizationContext";
import { PlayerSearch } from "@/components/PlayerSearch";
import { Card } from "@/components/ui/card";

const Index = () => {
  const { preferences } = usePageCustomization();
  const spacingClass = preferences.ui_density === 'compact' ? 'space-y-8' : preferences.ui_density === 'spacious' ? 'space-y-16' : 'space-y-12';

  return (
    <div className={`min-h-screen pb-20 pt-8 px-4 md:px-6 lg:px-8 ${spacingClass}`}>
      <div className="container mx-auto">
        {/* Hero Section - Refined */}
        <div className="mb-12 text-center py-8 rounded-2xl bg-gradient-to-br from-[hsl(var(--section-1))] to-[hsl(var(--card-dark))] border-2 border-border">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            ELITE CHESS ARENA
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-semibold mb-6">
            Experience the future of competitive chess — Watch trending matches, climb the leaderboard, and claim victory
          </p>
          
          {/* Player Search */}
          <div className="max-w-2xl mx-auto px-4">
            <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
              <PlayerSearch placeholder="Search for players to challenge..." />
            </Card>
          </div>
        </div>

        {/* Section 1: Trending Games */}
        <div className="p-8 rounded-2xl bg-[hsl(var(--section-1))] border-2 border-border">
          <TrendingGames />
        </div>

        {/* Separator */}
        <div className="h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent my-8" />

        {/* Section 2: Top Players Leaderboard */}
        <div className="p-8 rounded-2xl bg-[hsl(var(--section-2))] border-2 border-border">
          <LeaderboardPreview />
        </div>

        {/* Separator */}
        <div className="h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent my-8" />

        {/* Section 3: Recent Winnings */}
        <div className="p-8 rounded-2xl bg-[hsl(var(--section-3))] border-2 border-border">
          <RecentWinnings />
        </div>
      </div>
    </div>
  );
};

export default Index;
