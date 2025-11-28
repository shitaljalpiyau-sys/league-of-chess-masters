import { useState, useEffect, useRef } from "react";
import { Tv, Eye } from "lucide-react";
import { Button } from "./ui/button";

interface StreamMessage {
  id: number;
  player1: string;
  player2: string;
  viewers: number;
  rating: string;
}

const playerNames = [
  "GrandMaster_Alex", "ChessKnight_89", "QueenSlayer", "KingHunter_Pro",
  "RookDestroyer", "BishopMaster", "PawnStorm_21", "CheckMate_King",
  "BlitzLegend", "RapidElite", "TacticalGenius", "StrategicMind",
  "EndgameMaster", "OpeningExpert", "MiddleGamePro", "ChessWarrior"
];

const generateRandomStream = (id: number): StreamMessage => {
  const player1 = playerNames[Math.floor(Math.random() * playerNames.length)];
  let player2 = playerNames[Math.floor(Math.random() * playerNames.length)];
  while (player2 === player1) {
    player2 = playerNames[Math.floor(Math.random() * playerNames.length)];
  }
  
  return {
    id,
    player1,
    player2,
    viewers: Math.floor(Math.random() * 5000) + 100,
    rating: `${Math.floor(Math.random() * 1000) + 1500}-${Math.floor(Math.random() * 1000) + 1500}`,
  };
};

export const ChallengeLiveStream = () => {
  const [streams, setStreams] = useState<StreamMessage[]>([
    generateRandomStream(1),
    generateRandomStream(2),
    generateRandomStream(3),
  ]);
  const [nextId, setNextId] = useState(4);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStreams((prev) => {
        const newStream = generateRandomStream(nextId);
        const updated = [newStream, ...prev].slice(0, 8); // Keep max 8 streams
        return updated;
      });
      setNextId((prev) => prev + 1);
      
      // Auto-scroll to top
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 3500); // Every 3.5 seconds

    return () => clearInterval(interval);
  }, [nextId]);

  return (
    <div className="w-full bg-background border border-border rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Tv className="w-7 h-7 text-primary" />
        <h2 className="text-3xl md:text-4xl font-bold font-rajdhani text-foreground tracking-wider">
          CHALLENGE LIVE STREAMS
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-red-500 uppercase tracking-wide">
            Live
          </span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
      >
        {streams.map((stream) => (
          <div
            key={stream.id}
            className="bg-muted/30 border border-border rounded-xl p-4 hover:bg-muted/50 transition-all duration-200 animate-in fade-in slide-in-from-top-4"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Now Playing
                  </span>
                </div>
                <p className="text-base md:text-lg font-semibold text-foreground">
                  <span className="text-primary">{stream.player1}</span>
                  <span className="text-muted-foreground mx-2">vs</span>
                  <span className="text-primary">{stream.player2}</span>
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{stream.viewers.toLocaleString()}</span>
                  </div>
                  <span className="text-xs">Rating: {stream.rating}</span>
                </div>
              </div>
              <Button 
                variant="default" 
                size="sm"
                className="font-semibold uppercase tracking-wide"
              >
                Watch Now
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
