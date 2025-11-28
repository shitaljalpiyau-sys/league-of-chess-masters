import { Trophy, TrendingUp, Medal, Crown, Swords } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface Player {
  id: string;
  username: string;
  rating: number;
  games_won: number;
  class: string;
  games_played: number;
  xp: number;
  level: number;
  avatar_url: string | null;
}

const Leaderboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filter, setFilter] = useState<"overall" | "week" | "month">("overall");

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("xp", { ascending: false })
      .limit(50);

    if (!error && data) {
      setPlayers(data);
    }

    // Subscribe to real-time updates
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleChallenge = async (player: Player) => {
    if (!profile) {
      toast({
        title: "Login required",
        description: "You must be logged in to send challenges",
        variant: "destructive",
      });
      return;
    }

    if (player.id === profile.id) {
      toast({
        title: "Cannot challenge yourself",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("challenges").insert({
      challenger_id: profile.id,
      challenged_id: player.id,
      time_control: "10+5",
    });

    if (error) {
      toast({
        title: "Failed to send challenge",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Challenge sent!",
        description: `Challenge sent to @${player.username}`,
      });
    }
  };

  const getPlayerIcon = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: "text-yellow-500" };
    if (rank === 2) return { icon: Medal, color: "text-gray-400" };
    if (rank === 3) return { icon: Medal, color: "text-orange-600" };
    return { icon: Trophy, color: "text-primary" };
  };

  const stats = profile ? [
    { label: "Your Rank", value: `#${players.findIndex(p => p.id === profile.id) + 1 || "N/A"}`, icon: TrendingUp },
    { label: "Your XP", value: profile.xp.toString(), icon: Trophy },
    { label: "Your Level", value: `Level ${profile.level}`, icon: Crown },
    { label: "Total Wins", value: profile.games_won.toString(), icon: Medal },
  ] : [];

  return (
    <motion.div 
      className="min-h-screen pb-20 pt-20 px-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold font-rajdhani text-primary mb-3">LEADERBOARD</h1>
          <p className="text-muted-foreground">Top players in Elite League</p>
        </div>

        {/* Your Stats */}
        {profile && stats.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold font-rajdhani mb-4">YOUR STATS</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-secondary border border-border rounded-lg p-4 flex items-center gap-4">
                  <stat.icon className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold font-rajdhani">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <button 
            onClick={() => setFilter("overall")}
            className={filter === "overall" ? "bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm" : "bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-secondary/80 border border-border"}
          >
            Overall
          </button>
          <button 
            onClick={() => setFilter("week")}
            className={filter === "week" ? "bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm" : "bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-secondary/80 border border-border"}
          >
            This Week
          </button>
          <button 
            onClick={() => setFilter("month")}
            className={filter === "month" ? "bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm" : "bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-secondary/80 border border-border"}
          >
            This Month
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-secondary border-b border-border px-6 py-4 grid grid-cols-12 gap-4 font-bold text-sm">
            <div className="col-span-1">RANK</div>
            <div className="col-span-3">PLAYER</div>
            <div className="col-span-2">XP</div>
            <div className="col-span-1">LEVEL</div>
            <div className="col-span-2">WIN RATE</div>
            <div className="col-span-1">CLASS</div>
            <div className="col-span-2">ACTION</div>
          </div>
          
          <div className="divide-y divide-border">
              {players.map((player, index) => {
                const rankInfo = getPlayerIcon(index + 1);
                const IconComponent = rankInfo.icon;
                const winRate = player.games_played > 0 
                  ? Math.round((player.games_won / player.games_played) * 100) 
                  : 0;
                return (
                  <div 
                    key={player.id}
                    className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-secondary/50 transition-colors"
                  >
                    <div className="col-span-1">
                      <span className="text-lg font-bold font-rajdhani">{index + 1}</span>
                    </div>
                    
                    <div className="col-span-3 flex items-center gap-3">
                      <IconComponent className={`h-6 w-6 ${rankInfo.color}`} />
                      <div>
                        <button
                          onClick={() => navigate(`/profile/${player.id}`)}
                          className="font-bold hover:text-primary transition-colors"
                        >
                          @{player.username}
                        </button>
                        {index < 3 && (
                          <span className="ml-2 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                            TOP {index + 1}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <span className="font-bold text-primary">{player.xp} XP</span>
                    </div>
                    
                    <div className="col-span-1">
                      <span className="text-muted-foreground font-semibold">{player.level}</span>
                    </div>
                    
                    <div className="col-span-2">
                      <span className="text-muted-foreground">{winRate}%</span>
                    </div>
                    
                    <div className="col-span-1">
                      <span className="font-bold text-primary">Class {player.class}</span>
                    </div>
                    
                    <div className="col-span-2">
                      {profile && player.id !== profile.id ? (
                        <Button
                          size="sm"
                          onClick={() => handleChallenge(player)}
                          className="gap-1 hover:scale-105 transition-transform"
                        >
                          <Swords className="h-3 w-3" />
                          Challenge
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">You</span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      );
    };

export default Leaderboard;
