import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Swords, Clock, X, Check, AlertCircle, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlayerSearch } from "@/components/PlayerSearch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: string;
  time_control: string;
  created_at: string;
  expires_at?: string;
  challenger: {
    username: string;
    class: string;
    rating: number;
  };
  challenged: {
    username: string;
    class: string;
    rating: number;
  };
}

const Challenges = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showSearchDialog, setShowSearchDialog] = useState(false);

  useEffect(() => {
    if (!profile) return;
    
    fetchChallenges();

    // Subscribe to challenge updates
    const challengeChannel = supabase
      .channel("challenges")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenges",
        },
        () => {
          fetchChallenges();
        }
      )
      .subscribe();

    // Subscribe to game creation from challenges
    const gameChannel = supabase
      .channel("challenge-games")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "games",
        },
        async (payload) => {
          const newGame = payload.new as any;
          
          // Check if this game involves the current user and has a challenge_id
          if (newGame.challenge_id && 
              (newGame.white_player_id === profile.id || newGame.black_player_id === profile.id)) {
            
            // Show notification and navigate
            toast({
              title: "Challenge accepted!",
              description: "Game starting...",
            });
            
            // Small delay to ensure game is fully created
            setTimeout(() => {
              navigate(`/game/${newGame.id}`);
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(challengeChannel);
      supabase.removeChannel(gameChannel);
    };
  }, [profile]);

  const fetchChallenges = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("challenges")
      .select(`
        *,
        challenger:profiles!challenges_challenger_id_fkey(username, class, rating),
        challenged:profiles!challenges_challenged_id_fkey(username, class, rating)
      `)
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setChallenges(data as any);
    }
  };

  const handlePlayerSelect = async (player: any) => {
    setShowSearchDialog(false);
    
    if (player.in_match) {
      navigate(`/spectate/${player.match_id}`);
      return;
    }

    // Check for duplicate pending challenge
    const { data: duplicateCheck } = await supabase.rpc('check_duplicate_challenge', {
      p_challenger_id: profile!.id,
      p_challenged_id: player.id
    });

    if (duplicateCheck) {
      toast({
        title: "Challenge already sent",
        description: "You already have a pending challenge with this player",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("challenges").insert({
      challenger_id: profile!.id,
      challenged_id: player.id,
      time_control: "10+5",
    });

    if (error) {
      toast({
        title: "Failed to send challenge",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Challenge sent!",
        description: "Waiting for opponent to respond",
      });
      fetchChallenges();
    }
  };

  const respondToChallenge = async (challengeId: string, accept: boolean) => {
    if (accept) {
      // Fetch challenge details
      const { data: challenge, error: fetchError } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();

      if (fetchError || !challenge) {
        toast({
          title: "Failed to load challenge",
          description: "Challenge may have expired",
          variant: "destructive",
        });
        return;
      }

      // Check if challenge is still pending
      if (challenge.status !== "pending") {
        toast({
          title: "Challenge no longer available",
          description: "This challenge has already been responded to",
          variant: "destructive",
        });
        fetchChallenges();
        return;
      }

      // Check if game already exists for this challenge
      const { data: existingGame } = await supabase
        .from("games")
        .select("id")
        .eq("challenge_id", challengeId)
        .single();

      if (existingGame) {
        toast({
          title: "Game already started",
          description: "Joining game...",
        });
        setTimeout(() => {
          navigate(`/game/${existingGame.id}`);
        }, 300);
        return;
      }

      // Randomly assign colors (deterministic based on IDs to prevent conflicts)
      const useChallengerId = (challenge.challenger_id.charCodeAt(0) + challenge.challenged_id.charCodeAt(0)) % 2 === 0;
      
      // Create game with challenge_id first, then update challenge status
      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          white_player_id: useChallengerId ? challenge.challenger_id : challenge.challenged_id,
          black_player_id: useChallengerId ? challenge.challenged_id : challenge.challenger_id,
          time_control: challenge.time_control,
          challenge_id: challengeId,
          status: 'active'
        })
        .select()
        .single();

      if (gameError) {
        console.error("Game creation error:", gameError);
        toast({
          title: "Failed to create game",
          description: gameError.message,
          variant: "destructive",
        });
        return;
      }

      // Update challenge status
      const { error: updateError } = await supabase
        .from("challenges")
        .update({ status: "accepted" })
        .eq("id", challengeId);

      if (updateError) {
        console.error("Challenge update error:", updateError);
        // Game is created, so still navigate
      }

      toast({
        title: "Challenge accepted!",
        description: "Starting game...",
      });

      // Navigate with slight delay to ensure realtime propagation
      setTimeout(() => {
        navigate(`/game/${game.id}`);
      }, 500);
    } else {
      const { error } = await supabase
        .from("challenges")
        .update({ status: "declined" })
        .eq("id", challengeId);

      if (error) {
        toast({
          title: "Failed to decline challenge",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Challenge declined",
        });
      }
    }
  };

  const cancelChallenge = async (challengeId: string) => {
    const { error } = await supabase
      .from("challenges")
      .delete()
      .eq("id", challengeId);

    if (error) {
      toast({
        title: "Failed to cancel",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Challenge cancelled",
      });
    }
  };

  const pendingChallenges = challenges.filter((c) => c.status === "pending");
  const sentChallenges = pendingChallenges.filter((c) => c.challenger_id === profile?.id);
  const receivedChallenges = pendingChallenges.filter((c) => c.challenged_id === profile?.id);

  return (
    <div className="min-h-screen pb-20 pt-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold font-rajdhani text-primary mb-2 flex items-center gap-2 sm:gap-3">
                <Swords className="h-8 w-8 sm:h-10 sm:w-10" />
                CHALLENGES
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">Challenge other players and prove your skills</p>
            </div>
            <Button 
              onClick={() => setShowSearchDialog(true)} 
              className="gap-2 w-full sm:w-auto min-h-[44px] hover:scale-105 active:scale-95 transition-transform"
            >
              <Search className="h-4 w-4" />
              Search Players
            </Button>
          </div>
          
          <Alert className="border-primary/50 bg-primary/5">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <AlertDescription className="text-sm">
              <strong>Rules:</strong> {isMobile ? (
                <>Max 150 rating gap • Instant challenges</>
              ) : (
                <>Max 150 rating gap • Challenge anyone instantly • No time limits</>
              )}
            </AlertDescription>
          </Alert>
        </div>

        {/* Received Challenges */}
        {receivedChallenges.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold font-rajdhani mb-3 sm:mb-4 text-primary">
              Incoming Challenges ({receivedChallenges.length})
            </h2>
            <div className="space-y-3">
              {receivedChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-card-darker rounded-lg border-2 border-primary/50 animate-slide-up hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex-1">
                    <p className="font-bold text-base sm:text-lg">{challenge.challenger.username}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Class {challenge.challenger.class} • Rating: {challenge.challenger.rating}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-xs sm:text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {challenge.time_control}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => respondToChallenge(challenge.id, true)}
                      className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 min-h-[44px] hover:scale-105 sm:hover:scale-110 active:scale-95 transition-all"
                    >
                      <Check className="mr-1 sm:mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => respondToChallenge(challenge.id, false)}
                      variant="destructive"
                      className="flex-1 sm:flex-none min-h-[44px] hover:scale-105 sm:hover:scale-110 active:scale-95 transition-all"
                    >
                      <X className="mr-1 sm:mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent Challenges */}
        {sentChallenges.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold font-rajdhani mb-3 sm:mb-4">
              Sent Challenges ({sentChallenges.length})
            </h2>
            <div className="space-y-3">
              {sentChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-card-dark rounded-lg animate-slide-up hover:scale-[1.01] transition-all duration-300"
                >
                  <div className="flex-1">
                    <p className="font-bold text-base">{challenge.challenged.username}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Class {challenge.challenged.class} • Rating: {challenge.challenged.rating}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-xs sm:text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {challenge.time_control}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => cancelChallenge(challenge.id)} 
                    variant="outline"
                    className="w-full sm:w-auto min-h-[44px] hover:scale-105 sm:hover:scale-110 active:scale-95 transition-all"
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {challenges.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-lg animate-fade-in px-4">
            <Swords className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-lg sm:text-xl font-bold mb-2">No challenges yet</p>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Click "Search Players" {isMobile ? 'above' : 'to the right'} to find and challenge opponents!
            </p>
            <Button 
              onClick={() => setShowSearchDialog(true)} 
              className="gap-2 min-h-[44px] hover:scale-105 active:scale-95 transition-transform"
            >
              <Search className="h-4 w-4" />
              Search Players
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className={isMobile ? "w-full h-full max-w-full m-0 rounded-none" : "max-w-2xl"}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Search & Challenge Players</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <PlayerSearch 
              onPlayerSelect={handlePlayerSelect}
              placeholder="Search by username..."
            />
            <p className="text-xs sm:text-sm text-muted-foreground mt-4">
              Click on a player to challenge them, or spectate if they're currently in a match.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Challenges;
