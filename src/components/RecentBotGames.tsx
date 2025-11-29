import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock, Target, Trophy, Play } from "lucide-react";
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
        label: "WIN",
        borderGlow: "border-l-4 border-l-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]",
        bgColor: "bg-gradient-to-r from-green-500/5 to-transparent",
        textColor: "text-green-400",
        icon: Trophy,
        xp: "+50 XP"
      };
    } else if (game.winner_id && game.winner_id !== user?.id) {
      return {
        label: "LOSS",
        borderGlow: "border-l-4 border-l-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
        bgColor: "bg-gradient-to-r from-red-500/5 to-transparent",
        textColor: "text-red-400",
        icon: Trophy,
        xp: "-18 XP"
      };
    }
    return {
      label: "DRAW",
      borderGlow: "border-l-4 border-l-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]",
      bgColor: "bg-gradient-to-r from-blue-500/5 to-transparent",
      textColor: "text-blue-400",
      icon: Trophy,
      xp: "+6 XP"
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
    <Card className="w-[280px] border-2 border-primary/20 hover:border-primary/30 transition-all">
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
          const ResultIcon = styles.icon;

          return (
            <div
              key={game.id}
              onClick={() => navigate(`/replay/${game.match_id}`)}
              className={`
                relative rounded-lg cursor-pointer group overflow-hidden
                h-12 flex items-center gap-3 px-3 py-2
                ${styles.borderGlow} ${styles.bgColor}
                hover:scale-[1.02] transition-all duration-200
                hover:shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]
              `}
            >
              {/* Result Status */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <ResultIcon className={`h-4 w-4 ${styles.textColor}`} />
                <span className={`text-xs font-bold font-rajdhani ${styles.textColor}`}>
                  {styles.label}
                </span>
              </div>

              {/* XP Gained */}
              <span className="text-[10px] text-muted-foreground font-semibold">
                {styles.xp}
              </span>

              {/* Difficulty */}
              <span className="text-[10px] text-muted-foreground uppercase font-semibold px-2 py-0.5 rounded bg-background/50">
                {difficulty}
              </span>

              {/* Moves */}
              <div className="flex items-center gap-1 ml-auto">
                <Target className="h-3 w-3 text-muted-foreground/70" />
                <span className="text-[10px] text-muted-foreground">{game.total_moves}</span>
              </div>

              {/* Replay Icon (appears on hover) */}
              <Play className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Time */}
              <div className="absolute -bottom-0.5 left-3 right-3">
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDistanceToNow(new Date(game.end_time), { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
