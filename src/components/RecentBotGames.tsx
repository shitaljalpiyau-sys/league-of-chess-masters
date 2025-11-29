import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock, Target, Trophy, Skull, Minus, Play, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getPowerXPReward } from "@/hooks/useBotGame";

interface BotGameEntry {
  id: string;
  match_id: string;
  player1_id: string;
  player2_username: string;
  winner_id: string | null;
  result: string;
  total_moves: number;
  end_time: string;
  created_at: string;
}

export const RecentBotGames = () => {
  const [games, setGames] = useState<BotGameEntry[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchRecentGames();
      
      // Subscribe to new bot games
      const channel = supabase
        .channel(`bot_games_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "match_history",
            filter: `player1_id=eq.${user.id}`,
          },
          () => {
            fetchRecentGames();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchRecentGames = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("match_history")
      .select("id, match_id, player1_id, player2_username, winner_id, result, total_moves, end_time, created_at")
      .eq("player1_id", user.id)
      .ilike("player2_username", "Bot%")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      setGames(data);
    }
  };

  const extractPowerFromBotName = (botName: string): number => {
    // Extract power from "Bot (Power X)" format
    const match = botName.match(/Power (\d+)/);
    return match ? parseInt(match[1]) : 50; // Default to 50 if parsing fails
  };

  const getResultColor = (result: string, isWin: boolean) => {
    if (result === 'draw') return 'border-l-blue-500 bg-blue-500/5';
    return isWin ? 'border-l-green-500 bg-green-500/5' : 'border-l-red-500 bg-red-500/5';
  };

  const getResultIcon = (result: string, isWin: boolean) => {
    if (result === 'draw') return Minus;
    return isWin ? Trophy : Skull;
  };

  if (games.length === 0) {
    return (
      <Card className="w-[260px] border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-rajdhani flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Recent Practice Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">
            No bot games yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-[280px] border-2 border-primary/20 hover:border-primary/30 transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-rajdhani flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Recent Practice Games
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {games.map((game) => {
          const isWin = game.winner_id === user?.id;
          const ResultIcon = getResultIcon(game.result, isWin);
          const botPower = extractPowerFromBotName(game.player2_username);
          const xpReward = isWin ? getPowerXPReward(botPower) : 0;
          
          return (
            <div
              key={game.id}
              onClick={() => navigate(`/replay/${game.match_id}`)}
              className={`flex items-center justify-between gap-3 p-3 rounded-lg border-l-4 ${getResultColor(game.result, isWin)} hover:scale-[1.02] transition-all cursor-pointer group`}
            >
              {/* Result Icon */}
              <div className="flex-shrink-0">
                <ResultIcon className={`h-5 w-5 ${
                  game.result === 'draw' 
                    ? 'text-blue-400' 
                    : isWin 
                      ? 'text-green-400' 
                      : 'text-red-400'
                }`} />
              </div>

              {/* Game Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`font-bold ${
                    game.result === 'draw' 
                      ? 'text-blue-400' 
                      : isWin 
                        ? 'text-green-400' 
                        : 'text-red-400'
                  }`}>
                    {game.result === 'draw' ? 'DRAW' : isWin ? 'WIN' : 'LOSS'}
                  </span>
                  {isWin && xpReward > 0 && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="flex items-center gap-1 text-accent font-semibold">
                        <Zap className="h-3 w-3" />
                        +{xpReward} XP
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground truncate">
                    Power {botPower}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{game.total_moves} moves</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              {/* Replay Icon */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-4 w-4 text-primary" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
