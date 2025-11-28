import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Users, Target, Crown, Swords } from "lucide-react";

export default function NewLanding() {
  const gameCategories = [
    { name: "Blitz", image: "/chess-blitz.jpg", icon: Zap },
    { name: "Bullet", image: "/chess-bullet.jpg", icon: Target },
    { name: "Rapid", image: "/chess-rapid.jpg", icon: Crown },
    { name: "Classic", image: "/chess-classic.jpg", icon: Trophy },
    { name: "Puzzle Rush", image: "/chess-puzzle.jpg", icon: Swords },
    { name: "Tournaments", image: "/chess-tournament.jpg", icon: Users },
  ];

  const featuredGames = [
    {
      title: "Grandmaster Arena",
      category: "Tournament",
      players: "2,543",
      status: "Live",
      image: "/game-1.jpg"
    },
    {
      title: "Speed Chess Championship",
      category: "Blitz",
      players: "8,921",
      status: "Live",
      image: "/game-2.jpg"
    },
    {
      title: "Classic Masters",
      category: "Classical",
      players: "1,234",
      status: "Starting Soon",
      image: "/game-3.jpg"
    },
    {
      title: "Puzzle Sprint",
      category: "Training",
      players: "5,678",
      status: "Open",
      image: "/game-4.jpg"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-8 pb-16 px-6">
        <div className="max-w-screen-2xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">HOME</Link>
            <span>/</span>
            <span className="text-foreground">GAMES</span>
          </div>

          {/* Hero Image & Content */}
          <div className="relative rounded-2xl overflow-hidden bg-card-dark shadow-2xl">
            <div className="aspect-[21/9] bg-gradient-to-br from-card-darker to-card relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2361c977" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }} />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-12">
                <div className="max-w-4xl">
                  <h1 className="text-6xl font-bold text-foreground mb-4 tracking-tight">
                    Chess Master Arena
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                    Compete against players worldwide in the ultimate strategic battle. Master your moves, climb the ranks, and become a legend.
                  </p>
                  <div className="flex items-center gap-4">
                    <Link to="/play">
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-12">
                        Play Now
                      </Button>
                    </Link>
                    <Button size="lg" variant="outline" className="border-border hover:border-primary/50 hover:bg-primary/5 font-medium px-8 h-12">
                      Watch Tutorial
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-card-darker border-t border-border">
              <div className="flex items-center gap-8 px-12 py-4">
                <button className="text-sm font-medium text-primary border-b-2 border-primary pb-1">
                  Overview
                </button>
                <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Leaderboard
                </button>
                <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Tournaments
                </button>
                <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Training
                </button>
                <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  News
                </button>
                <div className="ml-auto">
                  <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                    Write a Review
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Game Modes */}
      <section className="py-12 px-6">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Popular Game Modes</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {gameCategories.map((category) => (
              <Link
                key={category.name}
                to={`/play?mode=${category.name.toLowerCase()}`}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-card-dark border border-border hover:border-primary/50 transition-all hover:scale-105 shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background/90" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <category.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Browse Games */}
      <section className="py-12 px-6">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Swords className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-3xl font-bold text-foreground">Browse Games</h2>
                <p className="text-sm text-muted-foreground mt-1">1092 active games</p>
              </div>
            </div>
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              View All →
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGames.map((game, index) => (
              <div
                key={index}
                className="group relative rounded-xl overflow-hidden bg-card-dark border border-border hover:border-primary/50 transition-all hover:scale-105 shadow-lg cursor-pointer"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-card-darker to-card relative">
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      game.status === 'Live' 
                        ? 'bg-primary/20 text-primary border border-primary/30' 
                        : 'bg-muted/20 text-muted-foreground border border-border'
                    }`}>
                      {game.status === 'Live' && <span className="inline-block w-2 h-2 bg-primary rounded-full mr-1.5 animate-pulse" />}
                      {game.status}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/95 to-transparent">
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{game.category}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{game.players} players</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Overview Content */}
      <section className="py-12 px-6 pb-24">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Chess Master Arena is the ultimate competitive chess platform where strategy meets innovation. 
                    Battle against opponents from around the world in real-time matches, participate in high-stakes tournaments, 
                    and climb the global leaderboard to prove your mastery.
                  </p>
                  <p>
                    Whether you're a beginner learning the fundamentals or a grandmaster refining advanced tactics, 
                    our platform offers game modes and training tools for every skill level. Join millions of players 
                    in the most engaging chess experience ever created.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Real-time Multiplayer", desc: "Compete against players worldwide instantly" },
                    { title: "Tournament System", desc: "Join competitive events with rewards" },
                    { title: "Training Mode", desc: "Master tactics with AI opponents" },
                    { title: "Global Leaderboard", desc: "Climb ranks and earn recognition" },
                    { title: "Puzzle Challenges", desc: "Sharpen skills with daily puzzles" },
                    { title: "Spectator Mode", desc: "Watch and learn from top players" },
                  ].map((feature, i) => (
                    <div key={i} className="p-4 rounded-lg bg-card-dark border border-border">
                      <h3 className="font-bold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-card-dark border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  {[
                    { label: "Active Players", value: "2.5M+" },
                    { label: "Daily Matches", value: "500K+" },
                    { label: "Prize Pool", value: "$1M+" },
                    { label: "Tournaments", value: "1,200+" },
                  ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <span className="text-sm font-bold text-primary">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <h3 className="text-lg font-bold text-foreground mb-2">Join the Arena</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your journey to chess mastery today
                </p>
                <Link to="/play">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                    Play Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
