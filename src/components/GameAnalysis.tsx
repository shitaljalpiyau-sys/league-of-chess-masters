import { Card } from '@/components/ui/card';
import { Trophy, Target, Clock, Zap } from 'lucide-react';

interface GameAnalysisProps {
  result: string;
  playerColor: 'white' | 'black' | null;
  totalMoves: number;
  timeControl: string;
}

export const GameAnalysis = ({ result, playerColor, totalMoves, timeControl }: GameAnalysisProps) => {
  const getResultDisplay = () => {
    if (result === 'draw') {
      return { text: 'Game Drawn', color: 'text-muted-foreground', icon: Target };
    }
    
    const playerWon = 
      (result === 'white_wins' && playerColor === 'white') ||
      (result === 'black_wins' && playerColor === 'black');
    
    return {
      text: playerWon ? 'Victory!' : 'Defeat',
      color: playerWon ? 'text-primary' : 'text-destructive',
      icon: Trophy
    };
  };

  const { text, color, icon: ResultIcon } = getResultDisplay();

  return (
    <Card className="p-6 bg-card border-2 border-primary/20">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <ResultIcon className={`h-8 w-8 ${color}`} />
          <h2 className={`text-3xl font-bold font-rajdhani ${color}`}>
            {text}
          </h2>
          <ResultIcon className={`h-8 w-8 ${color}`} />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Result</p>
            </div>
            <p className="text-sm font-semibold capitalize">
              {result.replace('_', ' ')}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Moves</p>
            </div>
            <p className="text-sm font-semibold">{totalMoves}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Time Control</p>
            </div>
            <p className="text-sm font-semibold">{timeControl}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {playerColor === 'white' ? 'You played as White' : 'You played as Black'}
          </p>
        </div>
      </div>
    </Card>
  );
};
