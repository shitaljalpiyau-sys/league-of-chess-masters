import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Chess } from "chess.js";
import { UniversalChessBoard } from "@/components/shared/UniversalChessBoard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Clock, Eye } from "lucide-react";
import { toast } from "sonner";
import { SpectatorChat } from "@/components/SpectatorChat";
import { useSpectatorPresence } from "@/hooks/useSpectatorPresence";
import { Badge } from "@/components/ui/badge";

const SpectateGame = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<any>(null);
  const [chess] = useState(new Chess());
  const [loading, setLoading] = useState(true);
  const { viewerCount, spectators } = useSpectatorPresence(gameId || "");

  useEffect(() => {
    if (!gameId) return;

    fetchGame();
    joinAsSpectator();

    // Subscribe to game updates
    const channel = supabase
      .channel(`game_${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const updatedGame = payload.new;
          setGame((prev: any) => ({
            ...updatedGame,
            white_player: prev?.white_player,
            black_player: prev?.black_player,
          }));
          
          // Update board
          chess.load(updatedGame.fen);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      leaveAsSpectator();
    };
  }, [gameId]);

  const fetchGame = async () => {
    if (!gameId) return;

    const { data, error } = await supabase
      .from("games")
      .select(`
        *,
        white_player:profiles!games_white_player_id_fkey(username, rating, class),
        black_player:profiles!games_black_player_id_fkey(username, rating, class)
      `)
      .eq("id", gameId)
      .single();

    if (error || !data) {
      toast.error("Game not found");
      navigate("/spectate");
      return;
    }

    setGame(data);
    chess.load(data.fen);
    setLoading(false);
  };

  const joinAsSpectator = async () => {
    if (!user || !gameId) return;

    await supabase.from("game_spectators").insert({
      game_id: gameId,
      user_id: user.id,
    });
  };

  const leaveAsSpectator = async () => {
    if (!user || !gameId) return;

    await supabase
      .from("game_spectators")
      .delete()
      .eq("game_id", gameId)
      .eq("user_id", user.id);
  };

  if (loading || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-20 px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button
            onClick={() => navigate("/spectate")}
            variant="outline"
            size="sm"
            className="hover:scale-105 active:scale-95 transition-transform"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Live Games
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-2 animate-pulse px-3 py-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </Badge>
            <Badge className="gap-2 bg-primary/10 text-primary border-primary/20">
              <Eye className="h-4 w-4" />
              <span className="font-bold">{viewerCount}</span>
              <span>watching</span>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base sm:text-lg font-bold">{game.white_player.username}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Class {game.white_player.class} • {game.white_player.rating}
                  </p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>

              <div className="mb-4">
                <UniversalChessBoard
                  chess={chess}
                  playerColor="white"
                  isPlayerTurn={false}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div className="text-right">
                  <p className="text-base sm:text-lg font-bold">{game.black_player.username}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Class {game.black_player.class} • {game.black_player.rating}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Spectators */}
            {spectators.length > 0 && (
              <div className="mt-4 bg-card border border-border rounded-lg p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Active Spectators ({spectators.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {spectators.map((spectator) => (
                    <Badge
                      key={spectator.user_id}
                      variant="secondary"
                      className="text-xs"
                    >
                      @{spectator.username}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Game Info */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Game Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Control</span>
                  <span className="font-bold">{game.time_control}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moves</span>
                  <span className="font-bold">{game.move_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Turn</span>
                  <span className="font-bold capitalize">{game.current_turn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="destructive" className="gap-1.5">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </Badge>
                </div>
              </div>
            </div>

            {/* Spectator Chat */}
            <div className="h-[500px]">
              <SpectatorChat gameId={gameId || ""} viewerCount={viewerCount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpectateGame;