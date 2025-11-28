import { Trophy, Target, TrendingUp, Award, Crown, Star, Eye, Edit2, Share2, Calendar, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { MatchHistory } from "@/components/MatchHistory";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const usernameSchema = z.string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(16, "Username must be at most 16 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

const Profile = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [editUsernameOpen, setEditUsernameOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || "");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const stats = [
    { label: "Games Played", value: profile?.games_played || 0, icon: Target },
    { label: "Win Rate", value: profile?.games_played ? Math.round((profile.games_won / profile.games_played) * 100) + "%" : "0%", icon: Trophy },
    { label: "Current Rating", value: profile?.rating || 1200, icon: TrendingUp },
    { label: "Total Points", value: profile?.points || 0, icon: Star },
  ];

  // Check if user is in an active match
  useEffect(() => {
    if (!profile) return;

    const checkActiveMatch = async () => {
      const { data } = await supabase
        .from("games")
        .select("id")
        .eq("status", "active")
        .or(`white_player_id.eq.${profile.id},black_player_id.eq.${profile.id}`)
        .single();

      if (data) {
        setActiveMatchId(data.id);
      } else {
        setActiveMatchId(null);
      }
    };

    checkActiveMatch();

    const channel = supabase
      .channel(`profile_games_${profile.id}`)
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
  }, [profile]);

  const handleUsernameUpdate = async () => {
    if (!profile) return;

    try {
      // Validate username
      usernameSchema.parse(newUsername);

      setIsUpdating(true);

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", newUsername)
        .neq("id", profile.id)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: "Username taken",
          description: "This username is already in use. Please choose another.",
          variant: "destructive",
        });
        setIsUpdating(false);
        return;
      }

      // Update username
      const { error } = await supabase
        .from("profiles")
        .update({ username: newUsername })
        .eq("id", profile.id);

      if (error) throw error;

      // Refresh profile data to show new username
      await refreshProfile();

      toast({
        title: "Username updated!",
        description: "Your username has been successfully changed.",
      });

      setEditUsernameOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid username",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Update failed",
          description: "Could not update username. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${profile?.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${profile?.username}'s Chess Profile`,
        text: `Check out ${profile?.username}'s Elite League chess profile!`,
        url: profileUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard.",
      });
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const achievements = [
    { title: "Speed Demon", description: "Won 100 blitz games", rarity: "gold" },
    { title: "Strategist", description: "Completed 50 classical games", rarity: "silver" },
    { title: "Warrior", description: "Won 10 tournaments", rarity: "gold" },
    { title: "Rising Star", description: "Reached rating 2000", rarity: "bronze" },
  ];

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen pb-20 pt-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Profile Header */}
        <div className="bg-gradient-to-br from-card via-card to-card-darker border-2 border-primary/20 rounded-xl p-6 sm:p-8 mb-8 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-0" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center border-2 border-primary/30 shadow-lg flex-shrink-0">
                <Crown className="h-10 w-10 sm:h-14 sm:w-14 text-primary" />
              </div>
              
              <div className="flex-1 w-full">
                {/* Username and Class */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary sm:hidden" />
                    <h1 className="text-3xl sm:text-4xl font-bold font-rajdhani text-foreground bg-gradient-to-r from-primary via-primary to-amber-500 bg-clip-text text-transparent">
                      {profile.username}
                    </h1>
                  </div>
                  <span className="bg-gradient-to-r from-primary/20 to-amber-500/20 text-primary border border-primary/30 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-2 w-fit">
                    <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                    CLASS {profile.class}
                  </span>
                </div>
                
                {/* Member info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>Elite League Member since {memberSince}</span>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {activeMatchId && (
                    <Button
                      onClick={() => navigate(`/spectate/${activeMatchId}`)}
                      className="gap-2 min-h-[44px] w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    >
                      <Eye className="h-4 w-4" />
                      {isMobile ? "Watch Match" : "Watch My Match"}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setNewUsername(profile.username);
                      setEditUsernameOpen(true);
                    }}
                    variant="default"
                    className="gap-2 min-h-[44px] w-full sm:w-auto hover:scale-105 active:scale-95 transition-transform"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Username
                  </Button>
                  <Button
                    onClick={handleShareProfile}
                    variant="outline"
                    className="gap-2 min-h-[44px] w-full sm:w-auto border-primary/20 hover:border-primary hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Share2 className="h-4 w-4" />
                    Share Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.map((stat) => (
                <div 
                  key={stat.label} 
                  className="bg-gradient-to-br from-secondary/80 to-secondary border border-border hover:border-primary/50 rounded-xl p-4 transition-all hover:scale-105 hover:shadow-lg group"
                >
                  <stat.icon className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xl sm:text-2xl font-bold font-rajdhani text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold font-rajdhani text-primary mb-4 sm:mb-6">ACHIEVEMENTS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.title}
                className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:border-primary/50 hover:scale-105 transition-all cursor-pointer group"
              >
                <Award className={`h-8 w-8 sm:h-10 sm:w-10 mb-3 group-hover:scale-110 transition-transform ${
                  achievement.rarity === 'gold' ? 'text-yellow-500' :
                  achievement.rarity === 'silver' ? 'text-gray-400' :
                  'text-orange-600'
                }`} />
                <h3 className="font-bold font-rajdhani mb-1 text-sm sm:text-base group-hover:text-primary transition-colors">
                  {achievement.title}
                </h3>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Match History */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-rajdhani text-primary mb-4 sm:mb-6">MATCH HISTORY</h2>
          <MatchHistory userId={profile.id} />
        </div>
      </div>

      {/* Edit Username Dialog */}
      <Dialog open={editUsernameOpen} onOpenChange={setEditUsernameOpen}>
        <DialogContent className={isMobile ? "w-full h-auto max-w-full m-4 rounded-xl" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-rajdhani flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Edit Username
            </DialogTitle>
            <DialogDescription className="text-sm">
              Choose a new username. Must be 3-16 characters and contain only letters, numbers, and underscores.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Username</label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
                className="h-12"
                maxLength={16}
              />
              <p className="text-xs text-muted-foreground">
                Current: <span className="text-primary font-semibold">{profile.username}</span>
              </p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleUsernameUpdate}
                disabled={isUpdating || newUsername === profile.username || !newUsername}
                className="flex-1 min-h-[44px] hover:scale-105 active:scale-95 transition-transform"
              >
                {isUpdating ? "Updating..." : "Save Changes"}
              </Button>
              <Button
                onClick={() => setEditUsernameOpen(false)}
                variant="outline"
                className="flex-1 min-h-[44px] hover:scale-105 active:scale-95 transition-transform"
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
