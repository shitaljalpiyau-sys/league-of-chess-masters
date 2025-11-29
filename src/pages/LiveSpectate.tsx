import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Eye, Users, Clock, Swords } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AuthModal } from "@/components/AuthModal";

interface LiveGame {
  id: string;
  white_player_id: string;
  black_player_id: string;
  time_control: string;
  created_at: string;
  move_count: number;
  spectator_count: number;
  fen: string;
  white_player: {
    username: string;
    rating: number;
    class: string;
  };
  black_player: {
    username: string;
    rating: number;
    class: string;
  };
}

const LiveSpectate = () => {
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchLiveGames();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("live_games")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: "status=eq.active",
        },
        () => {
          fetchLiveGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLiveGames = async () => {
    const { data, error } = await supabase
      .from("games")
      .select(`
        id,
        fen,
        time_control,
        created_at,
        spectator_count,
        move_count,
        white_player_id,
        black_player_id,
        white_player:profiles!games_white_player_id_fkey(username, class, rating),
        black_player:profiles!games_black_player_id_fkey(username, class, rating)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Handle bot games where both players are the same
      const mappedGames = data.map(game => {
        const isBotGame = game.white_player_id === game.black_player_id;
        return {
          ...game,
          black_player: isBotGame 
            ? { username: 'Bot', class: 'BOT', rating: 1500 }
            : game.black_player
        };
      });
      setLiveGames(mappedGames as any);
    }
  };

  const getTimeElapsed = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diff = now - start;
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m`;
  };

  const watchGame = (gameId: string) => {
    if (!user) {
      // Not authenticated - open auth modal
      setPendingGameId(gameId);
      setAuthModalOpen(true);
    } else {
      // Authenticated - navigate to spectate
      navigate(`/spectate/${gameId}`);
    }
  };

  // Handle successful authentication
  useEffect(() => {
    if (user && pendingGameId) {
      navigate(`/spectate/${pendingGameId}`);
      setPendingGameId(null);
    }
  }, [user, pendingGameId, navigate]);

  return (
    <motion.div 
      className="min-h-screen pb-20 pt-20 px-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold font-rajdhani text-primary mb-3 flex items-center gap-3">
            <Eye className="h-10 w-10" />
            LIVE SPECTATE
          </h1>
          <p className="text-muted-foreground">
            Watch ongoing matches in real-time • {liveGames.length} live games
          </p>
        </div>

        {liveGames.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <Swords className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No live games</h3>
              <p className="text-muted-foreground">
                All players are offline. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {liveGames.map((game) => (
              <Card
                key={game.id}
                className="border-2 border-primary/20 hover:border-primary/50 transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold text-red-500">
                        LIVE
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {game.spectator_count} watching
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {getTimeElapsed(game.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-card-dark rounded-lg">
                      <div>
                        <p className="font-bold text-lg">
                          {game.white_player.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Class {game.white_player.class} • {game.white_player.rating}
                        </p>
                      </div>
                      <div className="text-2xl">⚪</div>
                    </div>

                    <div className="text-center py-2">
                      <p className="text-lg font-bold text-primary">VS</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Move {game.move_count} • {game.time_control}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-card-dark rounded-lg">
                      <div className="text-2xl">⚫</div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {game.black_player.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Class {game.black_player.class} • {game.black_player.rating}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => watchGame(game.id)}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Watch Live
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingGameId(null);
        }}
        mode="signup"
      />
    </motion.div>
  );
};

export default LiveSpectate;