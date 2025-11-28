import { Card } from "@/components/ui/card";
import { Eye, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TrendingGames = () => {
  const trendingGames = [
    {
      id: 1,
      player1: "GrandMasterX",
      player2: "ChessNinja99",
      viewers: 1247,
      timeControl: "10+0",
      status: "live",
    },
    {
      id: 2,
      player1: "QueenSlayer",
      player2: "KnightRider",
      viewers: 892,
      timeControl: "5+3",
      status: "live",
    },
    {
      id: 3,
      player1: "PawnStorm",
      player2: "EndGameKing",
      viewers: 654,
      timeControl: "15+10",
      status: "live",
    },
  ];

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <span className="text-primary">🔥</span>
            TRENDING GAMES
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Watch the most popular matches right now</p>
        </div>
        <Button variant="ghost" className="text-primary font-bold">
          View All →
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trendingGames.map((game) => (
          <Card
            key={game.id}
            className="glass-panel border-2 border-border hover:border-primary/50 p-5 transition-all duration-300 hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-red-500 uppercase">Live</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-semibold">{game.viewers}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold">
                  {game.player1[0]}
                </div>
                <span className="font-bold text-foreground">{game.player1}</span>
              </div>

              <div className="text-center text-xs font-bold text-muted-foreground">VS</div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-destructive to-red-600 flex items-center justify-center text-xs font-bold">
                  {game.player2[0]}
                </div>
                <span className="font-bold text-foreground">{game.player2}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t-2 border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">{game.timeControl}</span>
              </div>
              <Button size="sm" variant="default" className="font-bold">
                Watch
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
