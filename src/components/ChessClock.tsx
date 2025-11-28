import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface ChessClockProps {
  whiteTime: number;
  blackTime: number;
  currentTurn: 'white' | 'black';
  status: string;
  playerColor: 'white' | 'black' | null;
}

export const ChessClock = ({ whiteTime, blackTime, currentTurn, status, playerColor }: ChessClockProps) => {
  const [displayWhiteTime, setDisplayWhiteTime] = useState(whiteTime);
  const [displayBlackTime, setDisplayBlackTime] = useState(blackTime);

  useEffect(() => {
    setDisplayWhiteTime(whiteTime);
    setDisplayBlackTime(blackTime);
  }, [whiteTime, blackTime]);

  useEffect(() => {
    if (status !== 'active') return;

    const interval = setInterval(() => {
      if (currentTurn === 'white') {
        setDisplayWhiteTime(prev => Math.max(0, prev - 1000));
      } else {
        setDisplayBlackTime(prev => Math.max(0, prev - 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTurn, status]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLowTime = (ms: number) => ms < 60000; // Less than 1 minute

  return (
    <Card className="p-4 bg-card">
      <div className="space-y-3">
        {/* Black's Clock */}
        <div className={`p-3 rounded-lg transition-all ${
          currentTurn === 'black' && status === 'active' 
            ? 'bg-primary/20 ring-2 ring-primary' 
            : 'bg-secondary'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">
                Black {playerColor === 'black' && '(You)'}
              </span>
            </div>
            <span className={`text-xl font-bold font-mono ${
              isLowTime(displayBlackTime) ? 'text-destructive animate-pulse' : ''
            }`}>
              {formatTime(displayBlackTime)}
            </span>
          </div>
        </div>

        {/* White's Clock */}
        <div className={`p-3 rounded-lg transition-all ${
          currentTurn === 'white' && status === 'active' 
            ? 'bg-primary/20 ring-2 ring-primary' 
            : 'bg-secondary'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">
                White {playerColor === 'white' && '(You)'}
              </span>
            </div>
            <span className={`text-xl font-bold font-mono ${
              isLowTime(displayWhiteTime) ? 'text-destructive animate-pulse' : ''
            }`}>
              {formatTime(displayWhiteTime)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
