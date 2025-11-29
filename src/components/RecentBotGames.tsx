import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Trophy, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface GameRecord {
  id: string;
  result: string;
  created_at: string;
  white_player_id: string;
  black_player_id: string;
  xp_gained: number;
}

export const RecentBotGames = () => {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetchRecentGames();
  }, [user]);

  const fetchRecentGames = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
      .in('status', ['completed', 'abandoned'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      const gamesWithXP = data.map(game => {
        const isWhite = game.white_player_id === user.id;
        let xpGained = 0;
        
        if (game.result === '1-0') {
          xpGained = isWhite ? 50 : -18;
        } else if (game.result === '0-1') {
          xpGained = isWhite ? -18 : 50;
        } else if (game.result === '1/2-1/2') {
          xpGained = 6;
        }

        return {
          ...game,
          xp_gained: xpGained
        };
      });

      setGames(gamesWithXP);
    }
    setLoading(false);
  };

  const getResultText = (game: GameRecord) => {
    const isWhite = game.white_player_id === user?.id;
    
    if (game.result === 'abandoned') return 'ABANDONED';
    if (game.result === '1-0') return isWhite ? 'WIN' : 'LOSS';
    if (game.result === '0-1') return isWhite ? 'LOSS' : 'WIN';
    if (game.result === '1/2-1/2') return 'DRAW';
    return 'ONGOING';
  };

  const getResultColor = (resultText: string) => {
    if (resultText === 'WIN') return 'text-green-400';
    if (resultText === 'LOSS') return 'text-red-400';
    if (resultText === 'DRAW') return 'text-yellow-400';
    return 'text-muted-foreground';
  };

  return (
    <Card className="p-6 md:p-8 bg-[rgba(20,20,25,0.85)] border-[1.5px] border-green-500/40 shadow-[0_8px_32px_rgba(34,197,94,0.15),0_0_1px_rgba(34,197,94,0.3)] rounded-2xl backdrop-blur-md h-full flex flex-col">
      <div className="mb-4 md:mb-6">
        <h2 className="text-2xl md:text-3xl font-bold font-rajdhani text-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)] tracking-wide">
          Recent Gameplays
        </h2>
        <p className="text-xs text-muted-foreground/80 mt-1">
          Your match history and results
        </p>
      </div>

      <ScrollArea className="flex-1 pr-2 md:pr-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {games.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground/60">
                <p className="text-sm">No games played yet</p>
                <p className="text-xs mt-1">Challenge the Master to start!</p>
              </div>
            ) : (
              games.map((game) => {
              const resultText = getResultText(game);
              const resultColor = getResultColor(resultText);

              return (
                <Card
                  key={game.id}
                  className="p-4 bg-background/40 border-green-500/20 hover:border-green-500/40 hover:bg-background/60 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className={`h-4 w-4 ${resultColor}`} />
                        <span className={`text-sm font-bold ${resultColor}`}>
                          {resultText}
                        </span>
                        {game.xp_gained !== 0 && (
                          <span className={`text-xs font-semibold ${game.xp_gained > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {game.xp_gained > 0 ? '+' : ''}{game.xp_gained} XP
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(game.created_at), 'MMM d, yyyy • HH:mm')}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-green-500/30 hover:border-green-500/60 hover:bg-green-500/10"
                      onClick={() => navigate(`/replay/${game.id}`)}
                    >
                      Replay
                    </Button>
                  </div>
                </Card>
                );
              })
            )}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
