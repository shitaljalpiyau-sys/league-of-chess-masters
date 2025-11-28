import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, Crown, Eye, Swords, MessageCircle, UserPlus, 
  Trophy, Target, TrendingUp, Lock, Play, Check, X, Clock, Sparkles 
} from "lucide-react";
import { toast } from "sonner";
import { MatchHistory } from "@/components/MatchHistory";
import { getTierForLevel } from "@/utils/xpSystem";

interface ProfileData {
  id: string;
  username: string;
  class: string;
  rating: number;
  points: number;
  games_played: number;
  games_won: number;
  created_at: string;
  xp: number;
  level: number;
  avatar_url: string | null;
}

const PublicProfile = () => {
  const { userId } = useParams();
  const { user, profile: currentUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState<string>("");
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [sendingChallenge, setSendingChallenge] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchProfile();
    checkActiveMatch();
    checkFriendshipStatus();

    // Subscribe to game updates
    const channel = supabase
      .channel(`profile_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
        },
        () => {
          checkActiveMatch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      toast.error("Profile not found");
      navigate("/");
      return;
    }

    setProfile(data);
    setLoading(false);
  };

  const checkActiveMatch = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("games")
      .select(`
        id,
        white_player_id,
        black_player_id,
        white_player:profiles!games_white_player_id_fkey(username),
        black_player:profiles!games_black_player_id_fkey(username)
      `)
      .eq("status", "active")
      .or(`white_player_id.eq.${userId},black_player_id.eq.${userId}`)
      .single();

    if (data) {
      setActiveMatchId(data.id);
      const opponent = data.white_player_id === userId 
        ? data.black_player?.username 
        : data.white_player?.username;
      setOpponentName(opponent || "Unknown");
    } else {
      setActiveMatchId(null);
      setOpponentName("");
    }
  };

  const checkFriendshipStatus = async () => {
    if (!user || !userId || user.id === userId) return;

    // Check if friends
    const { data: friendship } = await supabase
      .from("friendships")
      .select("*")
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
      .single();

    if (friendship) {
      setFriendshipStatus('friends');
      return;
    }

    // Check friend requests
    const { data: sentRequest } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("sender_id", user.id)
      .eq("receiver_id", userId)
      .eq("status", "pending")
      .single();

    if (sentRequest) {
      setFriendshipStatus('pending_sent');
      return;
    }

    const { data: receivedRequest } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("sender_id", userId)
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .single();

    if (receivedRequest) {
      setFriendshipStatus('pending_received');
      return;
    }

    setFriendshipStatus('none');
  };

  const handleSendFriendRequest = async () => {
    if (!user || !userId) return;

    const { error } = await supabase
      .from("friend_requests")
      .insert({
        sender_id: user.id,
        receiver_id: userId,
      });

    if (error) {
      toast.error("Failed to send friend request");
    } else {
      toast.success("Friend request sent!");
      setFriendshipStatus('pending_sent');
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!user || !userId) return;

    // Create friendship
    const user1 = user.id < userId ? user.id : userId;
    const user2 = user.id < userId ? userId : user.id;

    const { error: friendshipError } = await supabase
      .from("friendships")
      .insert({
        user1_id: user1,
        user2_id: user2,
      });

    if (friendshipError) {
      toast.error("Failed to accept friend request");
      return;
    }

    // Update friend request status
    await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("sender_id", userId)
      .eq("receiver_id", user.id);

    toast.success("Friend request accepted!");
    setFriendshipStatus('friends');
  };

  const handleRemoveFriend = async () => {
    if (!user || !userId) return;

    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`);

    if (error) {
      toast.error("Failed to remove friend");
    } else {
      toast.success("Friend removed");
      setFriendshipStatus('none');
    }
  };

  const handleChallenge = () => {
    if (activeMatchId) {
      toast.error(`${profile?.username} is currently in a match`);
      return;
    }
    setShowChallengeDialog(true);
  };

  const sendChallenge = async (timeControl: string) => {
    if (!user || !userId || !profile) return;

    setSendingChallenge(true);

    try {
      const { error } = await supabase
        .from("challenges")
        .insert({
          challenger_id: user.id,
          challenged_id: userId,
          time_control: timeControl,
        });

      if (error) throw error;

      toast.success(`Challenge sent to ${profile.username}!`);
      setShowChallengeDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send challenge");
    } finally {
      setSendingChallenge(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const winRate = profile.games_played > 0 
    ? Math.round((profile.games_won / profile.games_played) * 100) 
    : 0;
  const tier = getTierForLevel(profile.level);

  const isOwnProfile = user?.id === userId;
  const canSpectate = activeMatchId;

  return (
    <div className="min-h-screen pb-20 pt-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 bg-primary/10 rounded-lg flex items-center justify-center">
                <Crown className="h-12 w-12 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold font-rajdhani">{profile.username}</h1>
                  <Badge className="bg-primary/10 text-primary">
                    CLASS {profile.class}
                  </Badge>
                  <Badge className={`bg-gradient-to-br ${tier.badgeGradient} text-white`}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    {tier.name} • Level {profile.level}
                  </Badge>
                  {activeMatchId && (
                    <Badge variant="destructive" className="animate-pulse">
                      IN MATCH
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">
                  XP: {profile.xp} • Rating: {profile.rating} • Points: {profile.points}
                </p>
                
                {!isOwnProfile && user && (
                  <div className="flex gap-3 flex-wrap">
                    {friendshipStatus === 'none' && (
                      <Button onClick={handleSendFriendRequest} className="gap-2 hover:scale-105 active:scale-95 transition-transform">
                        <UserPlus className="h-4 w-4" />
                        Add Friend
                      </Button>
                    )}
                    {friendshipStatus === 'pending_sent' && (
                      <Button disabled variant="outline" className="gap-2">
                        <Check className="h-4 w-4" />
                        Request Sent
                      </Button>
                    )}
                    {friendshipStatus === 'pending_received' && (
                      <Button onClick={handleAcceptFriendRequest} className="gap-2 hover:scale-105 active:scale-95 transition-transform">
                        <Check className="h-4 w-4" />
                        Accept Request
                      </Button>
                    )}
                    {friendshipStatus === 'friends' && (
                      <Button onClick={handleRemoveFriend} variant="outline" className="gap-2 hover:scale-105 active:scale-95 transition-transform">
                        <X className="h-4 w-4" />
                        Remove Friend
                      </Button>
                    )}
                    
                    {canSpectate && (
                      <Button 
                        onClick={() => navigate(`/spectate/${activeMatchId}`)}
                        variant="default"
                        className="gap-2 bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 transition-transform"
                      >
                        <Eye className="h-4 w-4" />
                        Spectate Live
                      </Button>
                    )}
                    
                    <Button variant="outline" className="gap-2 hover:scale-105 active:scale-95 transition-transform">
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                    <Button 
                      onClick={handleChallenge} 
                      variant="outline" 
                      className="gap-2 hover:scale-105 active:scale-95 transition-transform"
                      disabled={!!activeMatchId}
                    >
                      <Swords className="h-4 w-4" />
                      Challenge
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Match Status */}
            {activeMatchId && (
              <Card className="bg-card-dark border-primary/50 animate-pulse-glow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg mb-1">🎮 Currently Playing</p>
                      <p className="text-sm text-muted-foreground">
                        vs {opponentName || 'Opponent'}
                      </p>
                    </div>
                    {canSpectate ? (
                      <Button 
                        onClick={() => navigate(`/spectate/${activeMatchId}`)}
                        className="gap-2 bg-green-600 hover:bg-green-700 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Eye className="h-4 w-4" />
                        Spectate Live
                      </Button>
                    ) : (
                      <Button disabled variant="outline" className="gap-2">
                        <Lock className="h-4 w-4" />
                        Private Match
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Separator className="my-6" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Sparkles className="h-5 w-5 text-primary mb-2" />
                <div className="text-2xl font-bold font-rajdhani">{profile.xp}</div>
                <div className="text-xs text-muted-foreground">Total XP</div>
              </div>
              <div>
                <Target className="h-5 w-5 text-primary mb-2" />
                <div className="text-2xl font-bold font-rajdhani">{profile.games_played}</div>
                <div className="text-xs text-muted-foreground">Games Played</div>
              </div>
              <div>
                <Trophy className="h-5 w-5 text-primary mb-2" />
                <div className="text-2xl font-bold font-rajdhani">{profile.games_won}</div>
                <div className="text-xs text-muted-foreground">Games Won</div>
              </div>
              <div>
                <TrendingUp className="h-5 w-5 text-primary mb-2" />
                <div className="text-2xl font-bold font-rajdhani">{winRate}%</div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
              <div>
                <Crown className="h-5 w-5 text-primary mb-2" />
                <div className="text-2xl font-bold font-rajdhani">{profile.rating}</div>
                <div className="text-xs text-muted-foreground">Current Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match History */}
        <div>
          <h2 className="text-2xl font-bold font-rajdhani text-primary mb-6">MATCH HISTORY</h2>
          <MatchHistory userId={profile.id} />
        </div>
      </div>

      {/* Challenge Dialog */}
      <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
        <DialogContent className="animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              Challenge {profile?.username}
            </DialogTitle>
            <DialogDescription>
              Select a time control for your match
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {["1+0", "3+0", "5+0", "10+0", "15+10", "30+0"].map((timeControl) => (
              <Button
                key={timeControl}
                onClick={() => sendChallenge(timeControl)}
                disabled={sendingChallenge}
                className="justify-start gap-3 h-14 hover:scale-[1.02] active:scale-[0.98] transition-all"
                variant="outline"
              >
                <Clock className="h-5 w-5 text-primary" />
                <div className="flex-1 text-left">
                  <span className="font-bold text-lg">{timeControl}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {timeControl === "1+0" && "⚡ Bullet"}
                    {timeControl === "3+0" && "🔥 Blitz"}
                    {timeControl === "5+0" && "⚡ Blitz"}
                    {timeControl === "10+0" && "🎯 Rapid"}
                    {timeControl === "15+10" && "🎯 Rapid"}
                    {timeControl === "30+0" && "♛ Classical"}
                  </span>
                </div>
              </Button>
            ))}
          </div>
          {sendingChallenge && (
            <div className="flex items-center justify-center gap-2 py-2 animate-pulse">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-sm text-muted-foreground">Sending challenge...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicProfile;
