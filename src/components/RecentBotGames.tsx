import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BotGameEntry {
  id: string;
  match_id: string;
  player1_id: string;
  player2_username: string;
  winner_id: string | null;
  result: string;
  total_moves: number;
  end_time: string;
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
      .select("id, match_id, player1_id, player2_username, winner_id, result, total_moves, end_time")
      .eq("player1_id", user.id)
      .ilike("player2_username", "Bot%")
      .order("end_time", { ascending: false })
      .limit(5);

    if (data) {
      setGames(data);
    }
  };

  const getResultStyles = (game: BotGameEntry) => {
    if (game.winner_id === user?.id) {
      return {
        label: "Victory",
        color: "bg-green-500/10 text-green-400 border-green-500/50",
        dot: "bg-green-500",
      };
    } else if (game.winner_id && game.winner_id !== user?.id) {
      return {
        label: "Defeat",
        color: "bg-red-500/10 text-red-400 border-red-500/50",
        dot: "bg-red-500",
      };
    }
    return {
      label: "Draw",
      color: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/50",
      dot: "bg-muted-foreground",
    };
  };

  const getDifficulty = (botName: string) => {
    return botName.replace("Bot (", "").replace(")", "");
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
    <Card className="w-[260px] border-2 border-primary/20 hover:border-primary/40 transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-rajdhani flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Recent Practice Games
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {games.map((game) => {
          const styles = getResultStyles(game);
          const difficulty = getDifficulty(game.player2_username);

          return (
            <div
              key={game.id}
              onClick={() => navigate(`/replay/${game.match_id}`)}
              className="p-2.5 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-card-dark/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${styles.color}`}>
                    {styles.label}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {difficulty}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Target className="h-2.5 w-2.5" />
                    {game.total_moves}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDistanceToNow(new Date(game.end_time), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
