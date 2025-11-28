import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GamesLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Games", count: 1092 },
    { id: "blitz", name: "Blitz", count: 342 },
    { id: "bullet", name: "Bullet", count: 289 },
    { id: "rapid", name: "Rapid", count: 178 },
    { id: "classical", name: "Classical", count: 156 },
    { id: "puzzle", name: "Puzzles", count: 127 },
  ];

  const filters = [
    { id: "live", label: "LIVE NOW", active: false },
    { id: "free", label: "FREE-TO-PLAY", active: false },
    { id: "tournament", label: "TOURNAMENTS", active: false },
    { id: "rated", label: "RATED", active: false },
  ];

  const games = [
    {
      id: 1,
      title: "Grandmaster Arena",
      subtitle: "Tournament, Strategy",
      thumbnail: "/game-1.jpg",
      platforms: ["web", "mobile"],
      rating: 4.8,
      players: "2.5K",
      status: "live"
    },
    {
      id: 2,
      title: "Speed Chess",
      subtitle: "Blitz, Fast-Paced",
      thumbnail: "/game-2.jpg",
      platforms: ["web", "mobile", "desktop"],
      rating: 4.9,
      players: "8.9K",
      status: "live"
    },
    {
      id: 3,
      title: "Classic Masters",
      subtitle: "Classical, Strategic",
      thumbnail: "/game-3.jpg",
      platforms: ["web", "desktop"],
      rating: 4.7,
      players: "1.2K",
      status: null
    },
    {
      id: 4,
      title: "Puzzle Rush",
      subtitle: "Training, Tactical",
      thumbnail: "/game-4.jpg",
      platforms: ["web", "mobile"],
      rating: 4.6,
      players: "5.6K",
      status: null
    },
    {
      id: 5,
      title: "Bullet Battle",
      subtitle: "Bullet, Ultra-Fast",
      thumbnail: "/game-5.jpg",
      platforms: ["web", "mobile"],
      rating: 4.8,
      players: "3.2K",
      status: "live"
    },
    {
      id: 6,
      title: "Rapid Fire",
      subtitle: "Rapid, Competitive",
      thumbnail: "/game-6.jpg",
      platforms: ["web"],
      rating: 4.5,
      players: "920",
      status: null
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">HOME</Link>
            <span>/</span>
            <span className="text-foreground">GAMES</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-3">Games Library</h1>
          <p className="text-lg text-muted-foreground">
            Discover the best chess games for web, console, mobile, and web3 platforms.
          </p>
        </div>

        {/* Category Tags */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Popular Categories</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-card-dark text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for games"
                className="pl-10 bg-card-dark border-border focus:border-primary"
              />
            </div>

            {/* Filter Buttons */}
            <div className="space-y-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-card-dark border border-border hover:border-primary/30 text-left transition-all group"
                >
                  <div className="w-3 h-3 rounded-full border-2 border-muted-foreground group-hover:border-primary transition-colors" />
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {filter.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Platform Filter */}
            <div className="p-6 rounded-xl bg-card-dark border border-border">
              <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Platform</h3>
              <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                Show More
              </button>
            </div>
          </aside>

          {/* Games Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">🎮</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Browse Games</h2>
                  <p className="text-sm text-muted-foreground">{games.length * 182} results</p>
                </div>
              </div>
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                Trending
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {games.map((game) => (
                <Link
                  key={game.id}
                  to={`/game/${game.id}`}
                  className="group relative rounded-xl overflow-hidden bg-card-dark border border-border hover:border-primary/50 transition-all hover:scale-105 shadow-lg"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[16/9] bg-gradient-to-br from-card-darker to-card relative overflow-hidden">
                    {game.status === 'live' && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          LIVE
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">{game.subtitle}</p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {game.platforms.map((platform) => (
                          <div
                            key={platform}
                            className="w-6 h-6 rounded bg-muted/20 flex items-center justify-center"
                            title={platform}
                          >
                            <span className="text-xs text-muted-foreground">
                              {platform === 'web' ? '🌐' : platform === 'mobile' ? '📱' : '💻'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>⭐ {game.rating}</span>
                        <span>•</span>
                        <span>{game.players}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More */}
            <div className="mt-12 text-center">
              <Button
                variant="outline"
                size="lg"
                className="border-border hover:border-primary/50 hover:bg-primary/5 px-12"
              >
                Load More Games
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
