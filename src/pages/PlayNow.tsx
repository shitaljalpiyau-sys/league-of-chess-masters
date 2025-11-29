import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Trophy, Zap, Users, Loader2, Bot, Swords, Info, Star } from "lucide-react";
import { CoachSilhouette } from "@/components/CoachSilhouette";
import { GreenParticles } from "@/components/GreenParticles";
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

  // Get AI behavior stars (1-5 based on power)
  const getAIStars = () => {
    const power = masterPower[0];
    return Math.ceil((power / 100) * 5);
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

        {/* YOUR MASTER Section - Glassmorphism Premium Panel */}
        <Card className="relative p-10 bg-[rgba(20,20,25,0.85)] border-[1.5px] border-green-500/40 shadow-[0_8px_32px_rgba(34,197,94,0.15),0_0_1px_rgba(34,197,94,0.3)] rounded-2xl overflow-hidden backdrop-blur-md">
          {/* Green Particles Background */}
          <GreenParticles />
          
          {/* Glassmorphism inner glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5 pointer-events-none" />
          
          {/* Info Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-green-500/10 z-10"
                >
                  <Info className="h-4 w-4 text-green-400/60 hover:text-green-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-background/95 border-green-500/30">
                <p className="text-xs">Your Master adapts based on power level</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="relative space-y-8 z-10">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold font-rajdhani text-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)] tracking-wide">
                YOUR MASTER
              </h2>
              <p className="text-xs text-muted-foreground/80">
                Elite AI opponent with adaptive intelligence
              </p>
            </div>
            
            {/* Master Profile - 40/60 Split Layout */}
            <div className="flex items-start gap-10">
              {/* Avatar Section - 40% */}
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <div className="relative group">
                  {/* Subtle rotating glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/20 via-green-400/20 to-green-500/20 blur-lg animate-[spin_10s_linear_infinite]" />
                  
                  {/* Circular frame */}
                  <div className="relative w-32 h-32 rounded-full border-2 border-green-500/50 shadow-[0_0_24px_rgba(34,197,94,0.3)] bg-gradient-to-br from-green-500/10 via-background/50 to-green-500/10 flex items-center justify-center backdrop-blur-sm">
                    {/* Anime Coach Silhouette */}
                    <CoachSilhouette className="text-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]" size={64} />
                    
                    {/* Bot Badge */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 border-2 border-background/90 flex items-center justify-center shadow-lg">
                      <Bot className="h-4 w-4 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

                {/* Micro-description */}
                <div className="text-center space-y-0.5">
                  <p className="text-[10px] font-bold text-green-400/90 uppercase tracking-wider">
                    Elite Strategy Model v1.2
                  </p>
                  <p className="text-[9px] text-muted-foreground/70 max-w-[140px] leading-tight">
                    Adaptive intelligence based on your power setting
                  </p>
                </div>
              </div>
                
              {/* Power Section + Stats - 60% */}
              <div className="flex-1 space-y-5">
                {/* Power Display */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider">Power:</span>
                    <span className="text-5xl font-bold font-rajdhani text-green-400 drop-shadow-[0_2px_12px_rgba(34,197,94,0.4)]">
                      {masterPower[0]}
                    </span>
                  </div>
                  
                  {/* AI Behavior Stars */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide">
                      AI Behavior:
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= getAIStars()
                              ? 'fill-green-400 text-green-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    Higher power increases strategic depth and precision
                  </p>
                </div>

                {/* XP Reward Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-green-500/15 to-green-600/15 border border-green-500/30 shadow-sm">
                  <Zap className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-bold text-green-400">
                    +{getXPReward()} XP
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">(scales with power)</span>
                </div>
              </div>
            </div>

            {/* Power Slider Section */}
            <div className="space-y-4 pt-3">
              <div className="text-center">
                <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
                  Adjust Master Intelligence Level
                </p>
              </div>

              {/* Enhanced Slider with ticks and moving gradient */}
              <div className="relative px-3">
                {/* Tick marks */}
                <div className="absolute top-0 left-3 right-3 flex justify-between pointer-events-none" style={{ top: '-8px' }}>
                  {[0, 20, 40, 60, 80, 100].map((tick) => (
                    <div key={tick} className="flex flex-col items-center">
                      <div className="w-0.5 h-2 bg-green-500/30" />
                      <span className="text-[8px] text-muted-foreground/50 mt-0.5">{tick}</span>
                    </div>
                  ))}
                </div>

                <div className="relative mt-6">
                  {/* Animated gradient background in track */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden bg-gradient-to-r from-green-500/10 via-green-400/20 to-green-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/30 to-transparent animate-[slide-in-right_3s_ease-in-out_infinite]" />
                  </div>

                  <Slider
                    value={masterPower}
                    onValueChange={setMasterPower}
                    min={0}
                    max={100}
                    step={1}
                    className="relative w-full [&>span:first-child]:h-3 [&>span:first-child]:bg-transparent [&>span:last-child]:bg-gradient-to-r [&>span:last-child]:from-green-500/60 [&>span:last-child]:to-green-400/60 [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-2 [&_[role=slider]]:border-green-400 [&_[role=slider]]:shadow-[0_0_16px_rgba(34,197,94,0.6),inset_0_0_8px_rgba(34,197,94,0.3)] [&_[role=slider]]:bg-gradient-to-br [&_[role=slider]]:from-green-400/20 [&_[role=slider]]:to-background hover:[&_[role=slider]]:scale-125 transition-transform [&_[role=slider]]:ring-2 [&_[role=slider]]:ring-green-400/30"
                  />
                </div>
              </div>

              {/* Difficulty Labels - LOW MID HIGH */}
              <div className="relative pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest px-3">
                  <span className={`transition-colors ${masterPower[0] <= 33 ? 'text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : ''}`}>LOW</span>
                  <span className={`transition-colors ${masterPower[0] > 33 && masterPower[0] <= 66 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : ''}`}>MID</span>
                  <span className={`transition-colors ${masterPower[0] > 66 ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}>HIGH</span>
                </div>
              </div>
            </div>

            {/* Start Game Button */}
            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-bold font-rajdhani bg-gradient-to-r from-green-500 via-green-400 to-green-500 hover:from-green-400 hover:via-green-300 hover:to-green-400 text-background hover:shadow-[0_0_32px_rgba(34,197,94,0.5)] transition-all duration-300 hover:scale-[1.02]"
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
