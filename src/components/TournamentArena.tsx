import { useState, useEffect } from "react";
import { Trophy, Users, Award } from "lucide-react";

export const TournamentArena = () => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      
      const nextReset = new Date(startOfWeek);
      nextReset.setDate(nextReset.getDate() + 7);
      
      const distance = nextReset.getTime() - now;
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="w-full bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 shadow-xl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold font-rajdhani text-foreground tracking-wider">
              CHESS ARENA TOURNAMENT
            </h2>
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <p className="text-lg text-muted-foreground">
            Weekly Championship • Elite Competition • Grand Prizes
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="bg-background/50 backdrop-blur-sm border border-primary/30 rounded-xl p-6 md:p-8 mb-8">
          <p className="text-center text-sm uppercase tracking-wider text-muted-foreground mb-4 font-semibold">
            Tournament Resets In
          </p>
          <div className="flex items-center justify-center gap-3 md:gap-4">
            <div className="flex flex-col items-center">
              <div className="bg-primary/20 border border-primary/40 rounded-lg px-4 py-3 md:px-6 md:py-4 min-w-[70px] md:min-w-[90px]">
                <span className="text-3xl md:text-5xl font-bold font-mono text-primary">
                  {formatNumber(timeRemaining.days)}
                </span>
              </div>
              <span className="text-xs md:text-sm text-muted-foreground mt-2 uppercase tracking-wide">
                Days
              </span>
            </div>
            <span className="text-2xl md:text-4xl font-bold text-primary">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-primary/20 border border-primary/40 rounded-lg px-4 py-3 md:px-6 md:py-4 min-w-[70px] md:min-w-[90px]">
                <span className="text-3xl md:text-5xl font-bold font-mono text-primary">
                  {formatNumber(timeRemaining.hours)}
                </span>
              </div>
              <span className="text-xs md:text-sm text-muted-foreground mt-2 uppercase tracking-wide">
                Hours
              </span>
            </div>
            <span className="text-2xl md:text-4xl font-bold text-primary">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-primary/20 border border-primary/40 rounded-lg px-4 py-3 md:px-6 md:py-4 min-w-[70px] md:min-w-[90px]">
                <span className="text-3xl md:text-5xl font-bold font-mono text-primary">
                  {formatNumber(timeRemaining.minutes)}
                </span>
              </div>
              <span className="text-xs md:text-sm text-muted-foreground mt-2 uppercase tracking-wide">
                Minutes
              </span>
            </div>
            <span className="text-2xl md:text-4xl font-bold text-primary">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-primary/20 border border-primary/40 rounded-lg px-4 py-3 md:px-6 md:py-4 min-w-[70px] md:min-w-[90px]">
                <span className="text-3xl md:text-5xl font-bold font-mono text-primary">
                  {formatNumber(timeRemaining.seconds)}
                </span>
              </div>
              <span className="text-xs md:text-sm text-muted-foreground mt-2 uppercase tracking-wide">
                Seconds
              </span>
            </div>
          </div>
        </div>

        {/* Tournament Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background/60 backdrop-blur-sm border border-border rounded-lg p-5 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">2,456</p>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Active Players</p>
          </div>
          <div className="bg-background/60 backdrop-blur-sm border border-border rounded-lg p-5 text-center">
            <Award className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">$50,000</p>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Prize Pool</p>
          </div>
          <div className="bg-background/60 backdrop-blur-sm border border-border rounded-lg p-5 text-center">
            <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">156</p>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Matches Today</p>
          </div>
        </div>
      </div>
    </div>
  );
};
