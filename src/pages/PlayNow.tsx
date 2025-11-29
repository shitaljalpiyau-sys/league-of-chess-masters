import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Trophy, Zap, Users, Loader2, Bot, Swords, Brain, Info } from "lucide-react";
import { useQuickMatch } from "@/hooks/useQuickMatch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RecentBotGames } from "@/components/RecentBotGames";

const PlayNow = () => {
  const [selectedTimeControl, setSelectedTimeControl] = useState("10+0");
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [challengeUsername, setChallengeUsername] = useState("");
  const [masterPower, setMasterPower] = useState([50]); // 0-100 power slider
  const { searching, joinQueue, leaveQueue } = useQuickMatch(selectedTimeControl);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Calculate XP reward with smooth scaling (15 to 100)
  const getXPReward = () => {
    const power = masterPower[0];
    // Smooth exponential curve: XP = 15 + (85 * (power/100)^1.8)
    const baseXP = 15;
    const maxXP = 100;
    const normalizedPower = power / 100;
    const scaledXP = baseXP + (maxXP - baseXP) * Math.pow(normalizedPower, 1.8);
    return Math.round(scaledXP);
  };

  // Get difficulty label based on power
  const getDifficultyLabel = () => {
    const power = masterPower[0];
    if (power <= 33) return 'LOW';
    if (power <= 66) return 'MID';
    return 'HIGH';
  };

  const handleSendChallenge = async () => {
    if (!challengeUsername.trim()) {
      toast.error("Please enter a username");
      return;
    }
    toast.success(`Challenge sent to ${challengeUsername}`);
    setChallengeUsername("");
  };

  useEffect(() => {
    if (!user) return;
    fetchActiveGames();

    const channel = supabase
      .channel('user-games')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games'
        },
        () => {
          fetchActiveGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchActiveGames = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setActiveGames(data);
    }
  };

  const gameModes = [
    {
      title: "Blitz Chess",
      description: "Fast-paced 3-5 minute games",
      icon: Zap,
      timeControl: "3+2",
      gradient: "bg-gradient-to-br from-yellow-500/10 to-orange-500/10"
    },
    {
      title: "Rapid Chess",
      description: "Standard 10-15 minute games",
      icon: Clock,
      timeControl: "10+5",
      gradient: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
    },
    {
      title: "Classical Chess",
      description: "Long format 30+ minute games",
      icon: Trophy,
      timeControl: "30+0",
      gradient: "bg-gradient-to-br from-purple-500/10 to-pink-500/10"
    },
    {
      title: "Team Battle",
      description: "Join forces with other players",
      icon: Users,
      timeControl: "5+3",
      gradient: "bg-gradient-to-br from-green-500/10 to-emerald-500/10"
    }
  ];

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-5xl font-bold font-rajdhani bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Play Now
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose your game mode and start playing
          </p>
        </div>

        {/* Active Games */}
        {activeGames.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-rajdhani">Your Active Games</h2>
            <div className="grid gap-4">
              {activeGames.map((game) => (
                <Card key={game.id} className="p-4 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/game/${game.id}`)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        Playing as {game.white_player_id === user?.id ? 'White' : 'Black'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {game.time_control} • {game.current_turn === (game.white_player_id === user?.id ? 'white' : 'black') ? 'Your turn' : "Opponent's turn"}
                      </p>
                    </div>
                    <Button>Continue Game</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* YOUR MASTER Section */}
        <Card className="relative p-8 bg-gradient-to-br from-primary/8 via-background/95 to-accent/8 border border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          
          {/* Info Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-primary/10 z-10"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Your Master adapts based on power level</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="relative space-y-6">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Brain className="h-7 w-7 text-primary animate-pulse" />
                <h2 className="text-3xl font-bold font-rajdhani bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  YOUR MASTER
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Control your opponent's intelligence level
              </p>
            </div>
            
            {/* Master Profile - 40/60 Split Layout */}
            <div className="flex items-center gap-8">
              {/* Avatar Section - 40% */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="relative group">
                  {/* Rotating glow ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 blur-md animate-[spin_8s_linear_infinite]" />
                  
                  {/* Circular frame */}
                  <div className="relative w-28 h-28 rounded-full border-2 border-primary/40 shadow-[0_0_16px_rgba(var(--primary-rgb),0.3)] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center backdrop-blur-sm">
                    {/* Premium AI mentor silhouette */}
                    <div className="relative">
                      <Brain className="h-14 w-14 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" strokeWidth={1.5} />
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background/80 flex items-center justify-center shadow-lg">
                        <Bot className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                
              {/* Power Section + Stats - 60% */}
              <div className="flex-1 space-y-4">
                {/* Power Display */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Power:</span>
                    <span className="text-4xl font-bold font-rajdhani bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(var(--primary-rgb),0.3)]">
                      {masterPower[0]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Higher power = stronger Master
                  </p>
                </div>

                {/* XP Reward Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30">
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  <span className="text-sm font-bold text-accent">
                    Win: +{getXPReward()} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Power Slider Section */}
            <div className="space-y-3 pt-2">
              <div className="text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Increase Master Power to raise intelligence
                </p>
              </div>

              {/* Slider with gradient track */}
              <div className="relative px-2">
                <Slider
                  value={masterPower}
                  onValueChange={setMasterPower}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full [&>span]:h-2.5 [&>span]:bg-gradient-to-r [&>span]:from-green-500/30 [&>span]:to-primary/30 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-primary [&_[role=slider]]:shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)] [&_[role=slider]]:bg-background hover:[&_[role=slider]]:scale-110 transition-transform"
                />
              </div>

              {/* Difficulty Indicator Bar */}
              <div className="relative pt-2">
                <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1">
                  <span className={masterPower[0] <= 33 ? 'text-green-400' : ''}>Low</span>
                  <span className={masterPower[0] > 33 && masterPower[0] <= 66 ? 'text-yellow-400' : ''}>Mid</span>
                  <span className={masterPower[0] > 66 ? 'text-red-400' : ''}>High</span>
                </div>
                {/* Active indicator dot */}
                <div className="flex items-center justify-between mt-1 px-1">
                  <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${masterPower[0] <= 33 ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-muted-foreground/20'}`} />
                  <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${masterPower[0] > 33 && masterPower[0] <= 66 ? 'bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.6)]' : 'bg-muted-foreground/20'}`} />
                  <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${masterPower[0] > 66 ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-muted-foreground/20'}`} />
                </div>
              </div>
            </div>

            {/* Start Game Button */}
            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-bold font-rajdhani bg-gradient-to-r from-primary via-primary to-accent hover:opacity-90 hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.4)] transition-all duration-300 hover:scale-[1.02]"
              onClick={() => navigate(`/bot-game?power=${masterPower[0]}`)}
            >
              CHALLENGE YOUR MASTER
            </Button>
          </div>
        </Card>

        {/* Challenge a Player Section */}
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20 shadow-lg">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Swords className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold font-rajdhani">Challenge a Player</h2>
              </div>
              <p className="text-muted-foreground">
                Challenge any player to a game
              </p>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <Input
                type="text"
                placeholder="Enter username to challenge"
                value={challengeUsername}
                onChange={(e) => setChallengeUsername(e.target.value)}
                className="h-12 text-center text-lg border-2"
                onKeyDown={(e) => e.key === 'Enter' && handleSendChallenge()}
              />
              <Button 
                size="lg" 
                className="h-14 w-full text-lg font-semibold"
                onClick={handleSendChallenge}
              >
                SEND CHALLENGE
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Match Section */}
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-8 w-8 text-primary animate-pulse" />
              <h2 className="text-3xl font-bold font-rajdhani">Quick Match</h2>
            </div>
            <p className="text-muted-foreground">
              Find an opponent instantly and start playing right away
            </p>
            
            <div className="flex flex-col items-center gap-4">
              <select 
                className="px-4 py-2 rounded-md border bg-background"
                value={selectedTimeControl}
                onChange={(e) => setSelectedTimeControl(e.target.value)}
                disabled={searching}
              >
                <option value="3+0">Blitz (3 min)</option>
                <option value="5+0">Blitz (5 min)</option>
                <option value="10+0">Rapid (10 min)</option>
                <option value="15+10">Rapid (15+10)</option>
                <option value="30+0">Classical (30 min)</option>
              </select>

              {searching ? (
                <Button 
                  size="lg" 
                  variant="destructive" 
                  className="text-lg px-8"
                  onClick={leaveQueue}
                >
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Cancel Search
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={joinQueue}
                >
                  Find Opponent
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* More Options */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-rajdhani text-center">More Game Modes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {gameModes.map((mode, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`p-6 ${mode.gradient} rounded-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <mode.icon className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-bold font-rajdhani">{mode.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{mode.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{mode.timeControl}</span>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="group-hover:scale-110 transition-transform"
                      onClick={() => {
                        if (mode.title === "Team Battle") {
                          navigate('/challenges');
                        } else {
                          setSelectedTimeControl(mode.timeControl);
                          joinQueue();
                        }
                      }}
                    >
                      Play
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Bot Games Panel - Bottom Right */}
        <div className="flex justify-end">
          <RecentBotGames />
        </div>
      </div>
    </div>
  );
};

export default PlayNow;
