import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Clock, Trophy, Zap, Users, Loader2, Bot, Swords, Brain } from "lucide-react";
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

  // Calculate XP reward based on power range
  const getXPReward = () => {
    const power = masterPower[0];
    if (power <= 33) return 15;  // Easy range
    if (power <= 66) return 40;  // Medium range
    return 100;                  // Hard range
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
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20 shadow-lg">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Brain className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold font-rajdhani">YOUR MASTER</h2>
              </div>
              <p className="text-muted-foreground">
                Control your opponent's intelligence level
              </p>
            </div>
            
            {/* Master Profile Card */}
            <Card className="p-6 bg-card/50 border-primary/20">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Brain className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-card flex items-center justify-center">
                    <Bot className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                
                {/* Power Info */}
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm text-muted-foreground">Power:</span>
                    <span className="text-3xl font-bold font-rajdhani bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {masterPower[0]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your master becomes smarter at higher power levels.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-accent">
                      Win Reward: +{getXPReward()} XP
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Power Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Weakest</span>
                <span className="text-muted-foreground">Strongest</span>
              </div>
              <Slider
                value={masterPower}
                onValueChange={setMasterPower}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Easy (+15 XP)</span>
                <span>Medium (+40 XP)</span>
                <span>Hard (+100 XP)</span>
              </div>
            </div>

            {/* Start Game Button */}
            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
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
