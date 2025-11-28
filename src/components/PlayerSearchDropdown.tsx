import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Player {
  id: string;
  username: string;
  avatar_url: string | null;
  rating: number;
  class: string;
}

export const PlayerSearchDropdown = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchPlayers = async () => {
      if (searchQuery.trim().length < 2) {
        setPlayers([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, rating, class")
        .ilike("username", `%${searchQuery}%`)
        .limit(8);

      if (!error && data) {
        setPlayers(data);
        setIsOpen(data.length > 0);
      }
      setIsLoading(false);
    };

    const debounce = setTimeout(searchPlayers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handlePlayerClick = (playerId: string) => {
    navigate(`/profile/${playerId}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={dropdownRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && players.length > 0 && setIsOpen(true)}
          className="w-full h-10 pl-10 pr-10 bg-card-dark/50 border border-border focus:border-primary/50 focus:bg-card-dark text-foreground placeholder:text-muted-foreground rounded-lg transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && players.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto animate-fade-in">
          {players.map((player) => (
            <div
              key={player.id}
              onClick={() => handlePlayerClick(player.id)}
              className="flex items-center gap-3 p-3 hover:bg-card-dark cursor-pointer transition-colors border-b border-border last:border-0"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/30">
                <AvatarImage src={player.avatar_url || undefined} alt={player.username} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {player.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{player.username}</p>
                <p className="text-xs text-muted-foreground">
                  Class {player.class} • {player.rating} rating
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
