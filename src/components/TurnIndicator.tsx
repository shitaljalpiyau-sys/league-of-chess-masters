import { Circle } from 'lucide-react';

interface TurnIndicatorProps {
  currentTurn: 'white' | 'black';
  playerColor: 'white' | 'black';
  isPlayerTurn: boolean;
  status: string;
}

export const TurnIndicator = ({ currentTurn, playerColor, isPlayerTurn, status }: TurnIndicatorProps) => {
  if (status !== 'active') return null;
  
  return (
    <div className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-rajdhani
      transition-all duration-300 glass-button
      ${isPlayerTurn 
        ? 'border-primary/60 text-primary neon-glow' 
        : 'border-muted/40 text-muted-foreground'
      }
    `}>
      <Circle 
        className={`h-1.5 w-1.5 ${isPlayerTurn ? 'fill-primary animate-pulse' : 'fill-muted-foreground'}`} 
      />
      <span>
        {isPlayerTurn ? 'YOUR TURN' : "OPPONENT'S TURN"}
      </span>
    </div>
  );
};
