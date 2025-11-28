import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

interface ChallengeCountdownProps {
  expiresAt: string;
  onExpire?: () => void;
}

export const ChallengeCountdown = ({ expiresAt, onExpire }: ChallengeCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      return diff;
    };

    setTimeRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);
      
      if (remaining <= 0 && onExpire) {
        onExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const urgencyLevel = timeRemaining < 30 ? 'critical' : timeRemaining < 60 ? 'warning' : 'normal';

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
      ${urgencyLevel === 'critical' ? 'bg-red-500/20 text-red-500 animate-pulse' : 
        urgencyLevel === 'warning' ? 'bg-yellow-500/20 text-yellow-500' : 
        'bg-primary/20 text-primary'}
    `}>
      <Timer className={`h-4 w-4 ${urgencyLevel === 'critical' ? 'animate-pulse' : ''}`} />
      <span className="font-mono">{formatTime(timeRemaining)}</span>
    </div>
  );
};
