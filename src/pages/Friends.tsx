import { Users, UserPlus, Check, X, Crown, MessageCircle, Swords, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFriends } from "@/hooks/useFriends";
import { useNavigate } from "react-router-dom";
import { usePresence } from "@/hooks/usePresence";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Friends = () => {
  const { friends, friendRequests, acceptFriendRequest, rejectFriendRequest, removeFriend } = useFriends();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const friendIds = friends.map(f => f.id);
  const { onlineUsers } = usePresence(friendIds);

  const handleChallenge = async (friendId: string) => {
    if (!profile) return;

    const { error } = await supabase.from("challenges").insert({
      challenger_id: profile.id,
      challenged_id: friendId,
      time_control: "10+5",
    });

    if (error) {
      toast.error("Failed to send challenge");
    } else {
      toast.success("Challenge sent!");
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold font-rajdhani text-primary mb-3 flex items-center gap-3">
            <Users className="h-10 w-10" />
            FRIENDS
          </h1>
          <p className="text-muted-foreground">Manage your friends and friend requests</p>
        </div>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Friend Requests ({friendRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-card-dark rounded-lg border border-border"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80"
                      onClick={() => navigate(`/profile/${request.sender_id}`)}
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Crown className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{request.sender.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Class {request.sender.class} • Rating: {request.sender.rating}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptFriendRequest(request.id, request.sender_id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectFriendRequest(request.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Friends List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Friends ({friends.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-bold mb-2">No friends yet</p>
                <p className="text-muted-foreground">
                  Search for players and send them friend requests!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => {
                  const isOnline = onlineUsers.has(friend.id);
                  return (
                    <Card key={friend.id} className="bg-card-dark">
                      <CardContent className="p-4">
                        <div 
                          className="flex items-center gap-3 mb-3 cursor-pointer hover:opacity-80"
                          onClick={() => navigate(`/profile/${friend.id}`)}
                        >
                          <div className="relative">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Crown className="h-6 w-6 text-primary" />
                            </div>
                            <Circle
                              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
                                isOnline ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold flex items-center gap-2">
                              {friend.username}
                              <span className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}>
                                {isOnline ? "Online" : "Offline"}
                              </span>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Class {friend.class}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {friend.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/social`)}>
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleChallenge(friend.id)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Swords className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFriend(friend.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Friends;
