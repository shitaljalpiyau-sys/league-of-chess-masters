import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Users, Eye, Loader2, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Player {
  id: string;
  username: string;
  class: string;
  rating: number;
  points: number;
  in_match?: boolean;
  match_id?: string;
}

interface PlayerSearchProps {
  onPlayerSelect?: (player: Player) => void;
  showSpectateButton?: boolean;
  placeholder?: string;
}

export const PlayerSearch = ({ 
  onPlayerSelect, 
  showSpectateButton = true,
  placeholder = "Search players..."
}: PlayerSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGames, setActiveGames] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch active games to check who's in match
  useEffect(() => {
    const fetchActiveGames = async () => {
      const { data } = await supabase
        .from("games")
        .select("id, white_player_id, black_player_id")
        .eq("status", "active");

      if (data) {
        const gamesMap: Record<string, string> = {};
        data.forEach((game) => {
          gamesMap[game.white_player_id] = game.id;
          gamesMap[game.black_player_id] = game.id;
        });
        setActiveGames(gamesMap);
      }
    };

    fetchActiveGames();

    // Subscribe to game updates
    const channel = supabase
      .channel("active_games_search")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: "status=eq.active",
        },
        () => {
          fetchActiveGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Debounced search with current user filtering
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${query}%`)
        .neq("id", user?.id || "") // Filter out current user
        .limit(10);

      if (!error && data) {
        const playersWithMatchStatus = data.map((player) => ({
          ...player,
          in_match: !!activeGames[player.id],
          match_id: activeGames[player.id],
        }));
        setResults(playersWithMatchStatus);
      }
      setLoading(false);
    }, 150); // Reduced debounce for instant feel

    return () => clearTimeout(timeoutId);
  }, [query, activeGames, user?.id]);

  const handlePlayerClick = (player: Player) => {
    if (onPlayerSelect) {
      onPlayerSelect(player);
      setQuery("");
      setResults([]);
      setIsOpen(false);
    } else {
      // Navigate to player profile
      navigate(`/profile/${player.id}`);
      setQuery("");
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSpectate = (matchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/spectate/${matchId}`);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleChallenge = async (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (player.in_match) {
      toast.error(`${player.username} is currently in a match`);
      return;
    }

    // Use default time control for quick challenge
    const timeControl = "10+0";
    
    const { error } = await supabase
      .from("challenges")
      .insert({
        challenger_id: user?.id,
        challenged_id: player.id,
        time_control: timeControl,
      });

    if (error) {
      toast.error("Failed to send challenge");
    } else {
      toast.success(`Challenge sent to ${player.username}!`);
      setQuery("");
      setResults([]);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {loading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching players...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No players found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {results.map((player, index) => (
                <div
                  key={player.id}
                  onClick={() => handlePlayerClick(player)}
                  className="p-4 hover:bg-accent/50 cursor-pointer transition-all duration-150 flex items-center justify-between group animate-in fade-in-0 slide-in-from-top-1"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {player.username}
                        </p>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          CLASS {player.class}
                        </span>
                        {player.in_match && (
                          <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            In Match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Rating: {player.rating} • {player.points} points
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {player.in_match && showSpectateButton && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => handleSpectate(player.match_id!, e)}
                        className="gap-2 bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all shadow-md"
                      >
                        <Eye className="h-4 w-4" />
                        Spectate
                      </Button>
                    )}
                    {!player.in_match && user && player.id !== user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleChallenge(player, e)}
                        className="gap-2 hover:scale-105 active:scale-95 transition-all shadow-md border-primary/50 hover:bg-primary/10"
                      >
                        <Swords className="h-4 w-4" />
                        Challenge
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
