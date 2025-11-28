import { Trophy, Swords, HandshakeIcon } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface GameResultBannerProps {
  result: string;
  playerColor: 'white' | 'black';
  onRematch?: () => void;
}

export const GameResultBanner = ({ result, playerColor, onRematch }: GameResultBannerProps) => {
  const navigate = useNavigate();
  
  const getResultInfo = () => {
    if (result === '1-0') {
      return {
        text: playerColor === 'white' ? 'Victory!' : 'Defeat',
        subtext: 'White wins by checkmate',
        icon: playerColor === 'white' ? Trophy : Swords,
        color: playerColor === 'white' ? 'text-primary' : 'text-destructive',
        bg: playerColor === 'white' ? 'bg-primary/10' : 'bg-destructive/10'
      };
    } else if (result === '0-1') {
      return {
        text: playerColor === 'black' ? 'Victory!' : 'Defeat',
        subtext: 'Black wins by checkmate',
        icon: playerColor === 'black' ? Trophy : Swords,
        color: playerColor === 'black' ? 'text-primary' : 'text-destructive',
        bg: playerColor === 'black' ? 'bg-primary/10' : 'bg-destructive/10'
      };
    } else {
      return {
        text: 'Draw',
        subtext: 'Game ended in a draw',
        icon: HandshakeIcon,
        color: 'text-muted-foreground',
        bg: 'bg-muted/10'
      };
    }
  };
  
  const info = getResultInfo();
  const Icon = info.icon;
  
  return (
    <Card className={`p-6 ${info.bg} border-2 animate-scale-in`}>
      <div className="flex items-center gap-4">
        <Icon className={`h-12 w-12 ${info.color}`} />
        <div className="flex-1">
          <h2 className={`text-3xl font-bold font-rajdhani ${info.color}`}>
            {info.text}
          </h2>
          <p className="text-muted-foreground">{info.subtext}</p>
        </div>
      </div>
      
      <div className="flex gap-3 mt-4">
        <Button 
          onClick={() => navigate('/challenge-arena')}
          variant="outline"
          className="flex-1"
        >
          View Games
        </Button>
        {onRematch && (
          <Button 
            onClick={onRematch}
            className="flex-1"
          >
            Request Rematch
          </Button>
        )}
      </div>
    </Card>
  );
};
