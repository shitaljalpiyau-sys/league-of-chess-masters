import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MoveHistoryProps {
  pgn: string;
  currentMoveIndex?: number;
}

interface ParsedMove {
  moveNumber: number;
  white: string;
  black?: string;
}

export const MoveHistory = ({ pgn }: MoveHistoryProps) => {
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
      parsedMoves.push({
        moveNumber: parsedMoves.length + 1,
        white: match[1],
        black: match[2]
      });
    }

    setMoves(parsedMoves);
  }, [pgn]);

  if (moves.length === 0) {
    return (
      <Card className="p-4 bg-card">
        <h3 className="text-lg font-bold font-rajdhani mb-3 text-primary">Move History</h3>
        <p className="text-sm text-muted-foreground">No moves yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card">
      <h3 className="text-lg font-bold font-rajdhani mb-3 text-primary">Move History</h3>
      <ScrollArea className="h-64">
        <div className="space-y-1">
          {moves.map((move) => (
            <div
              key={move.moveNumber}
              className="grid grid-cols-[40px_1fr_1fr] gap-2 p-2 rounded hover:bg-secondary/50 transition-colors text-sm"
            >
              <span className="text-muted-foreground font-semibold">
                {move.moveNumber}.
              </span>
              <span className="font-mono text-foreground font-medium">
                {move.white}
              </span>
              <span className="font-mono text-foreground font-medium">
                {move.black || ''}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
