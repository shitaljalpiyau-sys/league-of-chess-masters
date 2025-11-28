import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, TrendingDown, Minus, Play } from "lucide-react";

interface MatchHistoryEntry {
  id: string;
  match_id: string;
  player1_id: string;
  player2_id: string;
  player1_username: string;
  player2_username: string;
  player1_rating_before: number;
  player1_rating_after: number;
  player2_rating_before: number;
  player2_rating_after: number;
  player1_class: string;
  player2_class: string;
  winner_id: string | null;
  result: string;
  total_moves: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

interface MatchHistoryProps {
  userId: string;
}

export const MatchHistory = ({ userId }: MatchHistoryProps) => {
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("match_history")
      .select("*")
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order("end_time", { ascending: false })
      .limit(50);

    if (!error && data) {
      setHistory(data);
    }
    setLoading(false);
  };

  const getMatchResult = (match: MatchHistoryEntry) => {
    const isPlayer1 = match.player1_id === userId;
    const opponentName = isPlayer1 ? match.player2_username : match.player1_username;
    const opponentClass = isPlayer1 ? match.player2_class : match.player1_class;
    const ratingBefore = isPlayer1 ? match.player1_rating_before : match.player2_rating_before;
    const ratingAfter = isPlayer1 ? match.player1_rating_after : match.player2_rating_after;
    const ratingChange = ratingAfter - ratingBefore;

    let result = "Draw";
    let resultColor = "text-muted-foreground";

    if (match.winner_id === userId) {
      result = "Win";
      resultColor = "text-green-500";
    } else if (match.winner_id && match.winner_id !== userId) {
      result = "Loss";
      resultColor = "text-red-500";
    }

    return {
      opponentName,
      opponentClass,
      result,
      resultColor,
      ratingChange,
      ratingBefore,
      ratingAfter,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading match history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-bold mb-2">No match history</p>
          <p className="text-muted-foreground">Play some games to see your history here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((match) => {
        const {
          opponentName,
          opponentClass,
          result,
          resultColor,
          ratingChange,
          ratingBefore,
          ratingAfter,
        } = getMatchResult(match);

        return (
          <Card
            key={match.id}
            className="border-2 hover:border-primary/50 transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${resultColor}`}>
                    {result}
                  </div>
                  <div>
                    <p className="font-bold text-lg">vs {opponentName}</p>
                    <p className="text-sm text-muted-foreground">
                      Class {opponentClass} • {match.total_moves} moves
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    {ratingChange > 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : ratingChange < 0 ? (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    ) : (
                      <Minus className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span
                      className={`font-bold text-lg ${
                        ratingChange > 0
                          ? "text-green-500"
                          : ratingChange < 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {ratingChange > 0 ? "+" : ""}
                      {ratingChange}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ratingBefore} → {ratingAfter}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatDate(match.end_time)}</span>
                <span>Duration: {getDuration(match.start_time, match.end_time)}</span>
              </div>

              <Button
                onClick={() => navigate(`/replay/${match.match_id}`)}
                variant="outline"
                className="w-full mt-4"
              >
                <Play className="mr-2 h-4 w-4" />
                Watch Replay
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MatchHistory;