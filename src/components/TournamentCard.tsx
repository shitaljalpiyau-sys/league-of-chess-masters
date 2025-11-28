import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Clock } from "lucide-react";

interface TournamentCardProps {
  id: string;
  title: string;
  participants: number;
  prizePool: string;
  startTime: string;
  status: "upcoming" | "live" | "ended";
}

export const TournamentCard = ({ id, title, participants, prizePool, startTime, status }: TournamentCardProps) => {
  return (
    <Link to={`/tournament/${id}`}>
      <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold font-rajdhani mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{participants} players</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-primary font-semibold">{prizePool}</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === "live" ? "bg-primary/20 text-primary" :
            status === "upcoming" ? "bg-muted/20 text-muted-foreground" :
            "bg-destructive/20 text-destructive"
          }`}>
            {status.toUpperCase()}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{startTime}</span>
          </div>
          <Button 
            size="sm" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-rajdhani font-semibold"
          >
            {status === "live" ? "JOIN NOW" : "REGISTER"}
          </Button>
        </div>
      </div>
    </Link>
  );
};
