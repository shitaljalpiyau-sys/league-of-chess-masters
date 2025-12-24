import { TrendingGames } from "@/components/dashboard/TrendingGames";
import { LeaderboardPreview } from "@/components/dashboard/LeaderboardPreview";
import { RecentWinnings } from "@/components/dashboard/RecentWinnings";
import { usePageCustomization } from "@/contexts/PageCustomizationContext";
import { PlayerSearch } from "@/components/PlayerSearch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, Target, ChevronRight, Star, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GAME_CLASSES } from "@/config/pointsEconomy";

const Index = () => {
  const { preferences } = usePageCustomization();
  const { user } = useAuth();
  const spacingClass = preferences.ui_density === 'compact' ? 'space-y-6' : preferences.ui_density === 'spacious' ? 'space-y-12' : 'space-y-10';

  return (
    <div className={`min-h-screen pb-20 pt-6 px-4 md:px-6 lg:px-8 ${spacingClass} page-transition`}>
      <div className="container mx-auto max-w-7xl">
        
        {/* Hero Section - Luxury Green */}
        <div className="mb-10 text-center py-12 px-6 rounded-2xl luxury-card gold-border animate-fade-in-up">
          <div className="flex justify-center mb-4">
            <Crown className="w-12 h-12 text-accent animate-trophy-glow" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display mb-4 gold-text tracking-wider">
            ELITE CHESS ARENA
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 font-light">
            Rise through the ranks. Compete in tournaments. Claim your legacy.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {!user ? (
              <Link to="/auth">
                <Button className="btn-gold text-base px-8 py-3 h-auto">
                  Sign Up Now
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/play">
                <Button className="btn-gold text-base px-8 py-3 h-auto">
                  Play Now
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
            <Link to="/notice-board">
              <Button variant="outline" className="btn-luxury text-base px-8 py-3 h-auto">
                View How to Climb
              </Button>
            </Link>
          </div>

          {/* Player Search */}
          <div className="max-w-xl mx-auto">
            <PlayerSearch placeholder="Search players to challenge..." />
          </div>
        </div>

        {/* Class System Section - Front & Center */}
        <div className="mb-10 animate-fade-in-up stagger-1" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-accent" />
            <h2 className="text-2xl md:text-3xl font-display gold-text">Class Rankings</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {GAME_CLASSES.map((gameClass, index) => (
              <Card 
                key={gameClass.id} 
                className="luxury-card p-4 text-center hover-lift cursor-pointer group"
              >
                <div className={`text-2xl mb-2 ${index === 0 ? 'animate-trophy-glow' : ''}`}>
                  {gameClass.id === 'ELITE' && '👑'}
                  {gameClass.id === 'A' && '💎'}
                  {gameClass.id === 'B' && '🥈'}
                  {gameClass.id === 'C' && '🥉'}
                  {gameClass.id === 'D' && '⭐'}
                </div>
                <h3 className="font-display text-sm text-foreground group-hover:text-accent transition-colors">
                  {gameClass.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {gameClass.earnings}/hr
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Tournament Opportunities */}
        <div className="mb-10 p-6 rounded-2xl luxury-card animate-fade-in-up stagger-2" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-display gold-text">Tournament Opportunities</h2>
            </div>
            <Link to="/challenges">
              <Button variant="ghost" className="text-accent hover:text-accent/80">
                View All <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Daily Blitz", prize: "500 Points", time: "Starting Soon", status: "Open" },
              { name: "Weekly Championship", prize: "5,000 Points", time: "Saturday", status: "Register" },
              { name: "Elite Invitational", prize: "25,000 Points", time: "Monthly", status: "Elite Only" },
            ].map((tournament, i) => (
              <Card key={i} className="luxury-card p-4 hover-lift">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-foreground">{tournament.name}</span>
                </div>
                <p className="text-accent font-bold mb-1">{tournament.prize}</p>
                <p className="text-xs text-muted-foreground mb-3">{tournament.time}</p>
                <Button size="sm" className="w-full btn-luxury text-xs">
                  {tournament.status}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Progress & Milestones */}
        <div className="mb-10 p-6 rounded-2xl luxury-card animate-fade-in-up stagger-3" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-display gold-text">Your Progress</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Next Class Promotion</span>
                <span className="text-accent font-semibold">75%</span>
              </div>
              <div className="progress-bar-luxury h-3">
                <div className="progress-bar-fill h-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: "Wins This Week", value: "12", icon: "🏆" },
                { label: "Win Streak", value: "5", icon: "🔥" },
                { label: "Rank Position", value: "#47", icon: "📊" },
              ].map((stat, i) => (
                <div key={i} className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-xl mb-1">{stat.icon}</div>
                  <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Existing Sections */}
        <div className="p-6 rounded-2xl luxury-card mb-8">
          <TrendingGames />
        </div>

        <div className="p-6 rounded-2xl luxury-card mb-8">
          <LeaderboardPreview />
        </div>

        <div className="p-6 rounded-2xl luxury-card">
          <RecentWinnings />
        </div>
      </div>
    </div>
  );
};

export default Index;
