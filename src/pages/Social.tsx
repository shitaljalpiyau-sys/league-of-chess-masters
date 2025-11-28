import { useState, useEffect } from "react";
import { Users, UserPlus, Check, X, MessageCircle, Crown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriends } from "@/hooks/useFriends";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

interface ChatRoom {
  friendId: string;
  friendUsername: string;
  friendAvatar: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

const Social = () => {
  const { friends, friendRequests, acceptFriendRequest, rejectFriendRequest, removeFriend } = useFriends();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  // Load all messages and organize into chat rooms
  useEffect(() => {
    if (!user) return;
    loadMessages();

    const messagesChannel = supabase
      .channel('social-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        loadMessages();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages',
        filter: `sender_id=eq.${user.id}`,
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        message,
        created_at,
        read,
        sender:profiles!direct_messages_sender_id_fkey(username, avatar_url)
      `)
      .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as any);
      organizeChatRooms(data as any);
    }
  };

  const organizeChatRooms = (allMessages: Message[]) => {
    if (!user) return;

    const roomsMap = new Map<string, ChatRoom>();
    
    allMessages.forEach(msg => {
      const friendId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const friend = friends.find(f => f.id === friendId);
      
      if (!friend) return;

      if (!roomsMap.has(friendId)) {
        roomsMap.set(friendId, {
          friendId,
          friendUsername: friend.username,
          friendAvatar: null,
          lastMessage: msg.message,
          lastMessageTime: new Date(msg.created_at),
          unreadCount: msg.receiver_id === user.id && !msg.read ? 1 : 0,
        });
      } else {
        const room = roomsMap.get(friendId)!;
        room.lastMessage = msg.message;
        room.lastMessageTime = new Date(msg.created_at);
        if (msg.receiver_id === user.id && !msg.read) {
          room.unreadCount++;
        }
      }
    });

    setChatRooms(Array.from(roomsMap.values()).sort((a, b) => 
      b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    ));
  };

  const sendMessage = async () => {
    if (!user || !selectedFriend || !messageInput.trim()) return;

    const { error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedFriend,
        message: messageInput.trim(),
      });

    if (!error) {
      setMessageInput("");
      loadMessages();
    } else {
      toast.error("Failed to send message");
    }
  };

  const markAsRead = async (friendId: string) => {
    if (!user) return;

    await supabase
      .from('direct_messages')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', friendId);
  };

  const selectedFriendMessages = messages.filter(
    msg => 
      (msg.sender_id === user?.id && msg.receiver_id === selectedFriend) ||
      (msg.sender_id === selectedFriend && msg.receiver_id === user?.id)
  );

  const selectedFriendData = friends.find(f => f.id === selectedFriend);

  return (
    <div className="min-h-screen pb-20 pt-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold font-rajdhani text-primary mb-3 flex items-center gap-3">
            <Users className="h-10 w-10" />
            SOCIAL
          </h1>
          <p className="text-muted-foreground">Connect with friends and chat</p>
        </div>

        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card-dark">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
            <TabsTrigger value="requests">Requests ({friendRequests.length})</TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-5 w-5" />
                    Conversations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    {chatRooms.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No conversations yet</p>
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {chatRooms.map((room) => (
                          <div
                            key={room.friendId}
                            onClick={() => {
                              setSelectedFriend(room.friendId);
                              markAsRead(room.friendId);
                            }}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedFriend === room.friendId
                                ? 'bg-primary/10 border border-primary/30'
                                : 'hover:bg-card-dark'
                            }`}
                          >
                            <Avatar className="h-10 w-10 border-2 border-primary/30">
                              <AvatarImage src={room.friendAvatar || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {room.friendUsername[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold truncate">{room.friendUsername}</p>
                                {room.unreadCount > 0 && (
                                  <Badge className="bg-primary text-xs">{room.unreadCount}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Window */}
              <Card className="lg:col-span-2">
                {selectedFriend && selectedFriendData ? (
                  <>
                    <CardHeader className="border-b border-border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/30">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {selectedFriendData.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{selectedFriendData.username}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            Class {selectedFriendData.class} • {selectedFriendData.rating} rating
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[480px] p-4">
                        <div className="space-y-4">
                          {selectedFriendMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  msg.sender_id === user?.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card-dark text-foreground'
                                }`}
                              >
                                <p className="text-sm">{msg.message}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(msg.created_at).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="border-t border-border p-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            className="flex-1"
                          />
                          <Button onClick={sendMessage} size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-semibold mb-2">No conversation selected</p>
                      <p className="text-sm text-muted-foreground">Choose a friend to start chatting</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends">
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
                    {friends.map((friend) => (
                      <Card key={friend.id} className="bg-card-dark">
                        <CardContent className="p-4">
                          <div 
                            className="flex items-center gap-3 mb-3 cursor-pointer hover:opacity-80"
                            onClick={() => navigate(`/profile/${friend.id}`)}
                          >
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Crown className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold">{friend.username}</p>
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
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setSelectedFriend(friend.id)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Message
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friend Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Friend Requests ({friendRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-bold mb-2">No pending requests</p>
                    <p className="text-muted-foreground">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
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
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectFriendRequest(request.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Social;
