import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Swords, Clock, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface Game {
  id: string;
  white_player_id: string;
  black_player_id: string;
  status: string;
  time_control: string;
  created_at: string;
  white_player: {
    username: string;
    rating: number;
  };
  black_player: {
    username: string;
    rating: number;
  };
}

const ChallengeArena = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    if (!user) return;
    
    fetchGames();

    // Subscribe to game updates
    const channel = supabase
      .channel('challenge-arena')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `white_player_id=eq.${user.id},black_player_id=eq.${user.id}`
        },
        () => {
          fetchGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchGames = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        white_player:profiles!games_white_player_id_fkey(username, rating),
        black_player:profiles!games_black_player_id_fkey(username, rating)
      `)
      .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGames(data as any);
    }
  };

  const getOpponentInfo = (game: Game) => {
    if (game.white_player_id === user?.id) {
      return {
        name: game.black_player.username,
        rating: game.black_player.rating,
        color: 'White'
      };
    }
    return {
      name: game.white_player.username,
      rating: game.white_player.rating,
      color: 'Black'
    };
  };

  return (
    <motion.div 
      className="min-h-screen pb-20 pt-20 px-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold font-rajdhani text-primary mb-3">CHALLENGE ARENA</h1>
          <p className="text-muted-foreground">Your active challenge matches</p>
        </div>

        {games.length === 0 ? (
          <Card className="p-12 text-center">
            <Swords className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Active Games</h2>
            <p className="text-muted-foreground mb-6">
              Accept a challenge or use quick match to start playing!
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/challenges')}>
                View Challenges
              </Button>
              <Button onClick={() => navigate('/play')} variant="outline">
                Quick Match
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => {
              const opponent = getOpponentInfo(game);
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card
                    className="p-6 hover:border-primary transition-all cursor-pointer"
                    onClick={() => navigate(`/game/${game.id}`)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Playing as {opponent.color}
                        </span>
                      </div>
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Opponent</p>
                        <p className="font-bold text-lg">{opponent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Rating: {opponent.rating}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {game.time_control}
                      </div>

                      <Button className="w-full" variant="default">
                        Continue Game
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChallengeArena;