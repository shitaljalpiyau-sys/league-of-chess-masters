import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ThinMoveHistoryProps {
  pgn: string;
  playerColor: 'white' | 'black';
}

interface ParsedMove {
  moveNumber: number;
  notation: string;
  isPlayerMove: boolean;
}

export const ThinMoveHistory = ({ pgn, playerColor }: ThinMoveHistoryProps) => {
  const [moves, setMoves] = useState<ParsedMove[]>([]);

  useEffect(() => {
    if (!pgn) {
      setMoves([]);
      return;
    }

    // Parse PGN to extract moves
    const movePattern = /\d+\.\s*(\S+)(?:\s+(\S+))?/g;
    const parsedMoves: ParsedMove[] = [];
    let match;

    while ((match = movePattern.exec(pgn)) !== null) {
      // White's move
      if (match[1]) {
        parsedMoves.push({
          moveNumber: parsedMoves.length + 1,
          notation: match[1],
          isPlayerMove: playerColor === 'white'
        });
      }
      // Black's move
      if (match[2]) {
        parsedMoves.push({
          moveNumber: parsedMoves.length + 1,
          notation: match[2],
          isPlayerMove: playerColor === 'black'
        });
      }
    }

    setMoves(parsedMoves);
  }, [pgn, playerColor]);

  if (moves.length === 0) {
    return (
      <div className="h-full flex flex-col border-l border-border bg-card/30">
        <div className="p-3 border-b border-border">
          <h3 className="text-xs font-bold font-rajdhani text-muted-foreground uppercase tracking-wide">Moves</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No moves yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-l border-border bg-card/30">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-bold font-rajdhani text-muted-foreground uppercase tracking-wide">Moves</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {moves.map((move, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/30 transition-colors"
            >
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ 
                  backgroundColor: move.isPlayerMove ? '#3b8bff' : '#ff3b3b'
                }}
              />
              <span className="font-mono text-sm text-foreground">
                {move.notation}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
