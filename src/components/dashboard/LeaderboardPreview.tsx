import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const LeaderboardPreview = () => {
  const topPlayers = [
    { rank: 1, username: "ChessGod2024", rating: 2847, wins: 156, icon: "👑" },
    { rank: 2, username: "QueenDestroyer", rating: 2789, wins: 142, icon: "⭐" },
    { rank: 3, username: "GrandMasterZ", rating: 2756, wins: 138, icon: "💎" },
    { rank: 4, username: "TacticalNinja", rating: 2701, wins: 129, icon: "🔥" },
    { rank: 5, username: "EndgameKing", rating: 2689, wins: 124, icon: "⚡" },
  ];

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            TOP PLAYERS
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Elite performers leading the arena</p>
        </div>
        <Link to="/leaderboard">
          <Button variant="ghost" className="text-primary font-bold">
            Full Leaderboard →
          </Button>
        </Link>
      </div>

      <Card className="glass-panel border-2 border-border p-6">
        <div className="space-y-3">
          {topPlayers.map((player) => (
            <div
              key={player.rank}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer ${
                player.rank === 1
                  ? "bg-gradient-to-r from-[hsl(var(--premium-gold))]/20 to-amber-500/20 border-2 border-[hsl(var(--premium-gold))]/40"
                  : player.rank === 2
                  ? "bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-2 border-slate-400/30"
                  : player.rank === 3
                  ? "bg-gradient-to-r from-amber-700/20 to-amber-800/20 border-2 border-amber-700/30"
                  : "bg-card-dark border-2 border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`text-2xl font-black w-8 text-center ${
                    player.rank === 1
                      ? "text-[hsl(var(--premium-gold))]"
                      : player.rank === 2
                      ? "text-slate-400"
                      : player.rank === 3
                      ? "text-amber-700"
                      : "text-muted-foreground"
                  }`}
                >
                  {player.rank}
                </div>

                <div className="text-3xl">{player.icon}</div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-foreground text-lg">{player.username}</span>
                    {player.rank === 1 && <Crown className="w-5 h-5 text-[hsl(var(--premium-gold))]" />}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-semibold">Rating: {player.rating}</span>
                    <span className="font-semibold">Wins: {player.wins}</span>
                  </div>
                </div>

                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
};
