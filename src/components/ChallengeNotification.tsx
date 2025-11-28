import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Swords, Clock, X, Check, Timer } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Challenge {
  id: string;
  challenger_id: string;
  time_control: string;
  created_at: string;
  expires_at: string;
  challenger: {
    username: string;
    class: string;
    rating: number;
  };
}

export const ChallengeNotification = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [audio] = useState(() => new Audio("/notification.mp3"));
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes in seconds

  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel("challenge-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenges",
          filter: `challenged_id=eq.${profile.id}`,
        },
        async (payload) => {
          // Fetch full challenge with player details
          const { data } = await supabase
            .from("challenges")
            .select(`
              *,
              challenger:profiles!challenges_challenger_id_fkey(username, class, rating)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setChallenge(data as any);
            setTimeRemaining(180); // Reset countdown
            
            // Play notification sound
            try {
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch (e) {}

            // Show toast
            toast.info(`⚔️ ${data.challenger.username} challenges you!`, {
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, audio]);

  // Countdown timer
  useEffect(() => {
    if (!challenge || timeRemaining <= 0) {
      if (challenge && timeRemaining <= 0) {
        handleDecline(); // Auto-decline expired challenge
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge, timeRemaining]);

  const handleAccept = async () => {
    if (!challenge) return;

    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({
        white_player_id: Math.random() > 0.5 ? challenge.challenger_id : profile!.id,
        black_player_id: Math.random() > 0.5 ? profile!.id : challenge.challenger_id,
        time_control: challenge.time_control,
        challenge_id: challenge.id,
      })
      .select()
      .single();

    if (gameError) {
      toast.error("Failed to create game");
      return;
    }

    await supabase
      .from("challenges")
      .update({ status: "accepted" })
      .eq("id", challenge.id);

    toast.success("Challenge accepted! Starting game...");
    setChallenge(null);
    
    // Navigate with smooth animation
    setTimeout(() => {
      navigate(`/game/${game.id}`);
    }, 500);
  };

  const handleDecline = async () => {
    if (!challenge) return;

    await supabase
      .from("challenges")
      .update({ status: "declined" })
      .eq("id", challenge.id);

    toast.info("Challenge declined");
    setChallenge(null);
  };

  if (!challenge) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const urgencyLevel = timeRemaining < 30 ? 'critical' : timeRemaining < 60 ? 'warning' : 'normal';

  return (
    <div className="fixed top-24 right-6 z-50 animate-slide-down">
      <div className={`
        bg-card border-2 rounded-lg shadow-2xl p-4 w-80 transition-all duration-300
        ${urgencyLevel === 'critical' ? 'border-red-500 animate-pulse-glow' : 
          urgencyLevel === 'warning' ? 'border-yellow-500' : 'border-primary'}
      `}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Swords className={`h-5 w-5 ${urgencyLevel === 'critical' ? 'text-red-500' : 'text-primary'} animate-pulse`} />
            <h3 className="font-bold text-lg">New Challenge!</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDecline}
            className="h-6 w-6 hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Countdown Timer */}
        <div className={`
          mb-4 p-3 rounded-lg text-center transition-all duration-200
          ${urgencyLevel === 'critical' ? 'bg-red-500/20 border-red-500/50' : 
            urgencyLevel === 'warning' ? 'bg-yellow-500/20 border-yellow-500/50' : 
            'bg-primary/20 border-primary/50'}
          border
        `}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Timer className={`h-4 w-4 ${urgencyLevel === 'critical' ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-medium text-muted-foreground">
              Expires in
            </span>
          </div>
          <p className={`text-2xl font-bold font-mono ${
            urgencyLevel === 'critical' ? 'text-red-500' : 
            urgencyLevel === 'warning' ? 'text-yellow-500' : 
            'text-primary'
          }`}>
            {formatTime(timeRemaining)}
          </p>
        </div>
        
        <div className="mb-4">
          <p className="font-bold text-primary text-xl mb-1">
            {challenge.challenger.username}
          </p>
          <p className="text-sm text-muted-foreground">
            Class {challenge.challenger.class} • Rating: {challenge.challenger.rating}
          </p>
          <p className="text-sm flex items-center gap-1 mt-2">
            <Clock className="h-3 w-3" />
            Time Control: <span className="font-bold">{challenge.time_control}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all"
          >
            <Check className="mr-2 h-4 w-4" />
            Accept
          </Button>
          <Button
            onClick={handleDecline}
            variant="destructive"
            className="flex-1 hover:scale-105 active:scale-95 transition-all"
          >
            <X className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
};
