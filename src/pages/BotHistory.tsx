import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Play, ArrowLeft, Brain, Target, Clock, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BotMatchEntry {
  id: string;
  match_id: string;
  player1_id: string;
  player1_username: string;
  player2_username: string;
  winner_id: string | null;
  result: string;
  total_moves: number;
  start_time: string;
  end_time: string;
  pgn: string;
  created_at: string;
}

export const BotHistory = () => {
  const [history, setHistory] = useState<BotMatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, page]);

  const fetchHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("match_history")
      .select("*")
      .eq("player1_id", user.id)
      .ilike("player2_username", "Bot%")
      .order("end_time", { ascending: false })
      .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

    if (!error && data) {
      setHistory(data);
    }
    setLoading(false);
  };

  const getMatchResult = (match: BotMatchEntry) => {
    const difficulty = match.player2_username.replace("Bot (", "").replace(")", "").toLowerCase();
    
    let result = "Draw";
    let resultColor = "text-muted-foreground";

    if (match.winner_id === user?.id) {
      result = "Win";
      resultColor = "text-green-500";
    } else if (match.winner_id && match.winner_id !== user?.id) {
      result = "Loss";
      resultColor = "text-red-500";
    }

    return {
      difficulty,
      result,
      resultColor,
    };
  };

  const getDifficultyBadge = (difficulty: string) => {
    const badges = {
      easy: { color: "bg-green-500/10 text-green-400 border-green-500/30", icon: Target },
      moderate: { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", icon: Target },
      hard: { color: "bg-red-500/10 text-red-400 border-red-500/30", icon: Brain },
      "super-hard": { color: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: Brain },
    };

    const badge = badges[difficulty as keyof typeof badges] || badges.moderate;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border ${badge.color} text-xs font-semibold uppercase`}>
        <Icon className="h-3.5 w-3.5" />
        {difficulty}
      </div>
    );
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
    const seconds = Math.floor((diff % 60000) / 1000);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const parseMoves = (pgn: string) => {
    // Parse PGN to extract moves
    const moveRegex = /\d+\.\s*([a-hKQRBNO0-8+#x=-]+)\s*([a-hKQRBNO0-8+#x=-]+)?/g;
    const moves: string[] = [];
    let match;
    
    while ((match = moveRegex.exec(pgn)) !== null) {
      if (match[1]) moves.push(match[1]);
      if (match[2]) moves.push(match[2]);
    }
    
    return moves;
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20 pt-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading bot game history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="min-h-screen pb-20 pt-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <Button
              onClick={() => navigate("/play")}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Play
            </Button>
          </div>

          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-bold mb-2">No bot games played yet</p>
              <p className="text-muted-foreground mb-4">
                Play against the bot to see your practice history here
              </p>
              <Button onClick={() => navigate("/play/bot")} className="bg-primary text-primary-foreground">
                <Target className="mr-2 h-4 w-4" />
                Practice Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button
            onClick={() => navigate("/play")}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Play
          </Button>

          <h1 className="text-3xl font-bold font-rajdhani text-foreground">
            Practice History
          </h1>

          <div className="w-20"></div>
        </div>

        <div className="space-y-4">
          {history.map((match) => {
            const { difficulty, result, resultColor } = getMatchResult(match);
            const moves = parseMoves(match.pgn);

            return (
              <Card
                key={match.id}
                className="border-2 hover:border-primary/50 transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold font-rajdhani ${resultColor}`}>
                        {result}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-bold text-lg">vs Bot</p>
                          {getDifficultyBadge(difficulty)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="h-3.5 w-3.5" />
                            {match.total_moves} moves
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {getDuration(match.start_time, match.end_time)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => navigate(`/replay/${match.match_id}`)}
                      variant="default"
                      className="bg-primary text-primary-foreground"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Watch Replay
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatDate(match.end_time)}
                    </p>
                  </div>

                  {moves.length > 0 && (
                    <div className="bg-card-dark/50 rounded-lg p-3 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
                        Move History
                      </p>
                      <ScrollArea className="h-20">
                        <div className="flex flex-wrap gap-2">
                          {moves.map((move, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1.5 text-xs"
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  index % 2 === 0 ? "bg-blue-500" : "bg-red-500"
                                }`}
                              />
                              <span className="font-mono text-foreground/80">
                                {move}
                              </span>
                              {index < moves.length - 1 && (
                                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={history.length < ITEMS_PER_PAGE}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BotHistory;
