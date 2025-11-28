import { useState, useEffect, useRef } from "react";
import { Users, UserPlus, Check, X, MessageCircle, Crown, Send, Circle, Loader2, MoreVertical, Ban, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriends } from "@/hooks/useFriends";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePresence } from "@/hooks/usePresence";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInterface } from "@/components/ChatInterface";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
  deleted_for_sender: boolean;
  deleted_for_receiver: boolean;
  sender: {
    username: string;
    avatar_url: string | null;
  };
  reactions?: Reaction[];
}

interface Reaction {
  id: string;
  message_id: string;
  reactor_id: string;
  emoji: string;
}

interface Friend {
  id: string;
  username: string;
  class: string;
  rating: number;
}

interface FriendGroup {
  groupName: string;
  friends: Friend[];
  isOpen: boolean;
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
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState("messages");
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [friendGroups, setFriendGroups] = useState<Map<string, string>>(new Map());
  const [groupStates, setGroupStates] = useState<Record<string, boolean>>({
    "Close Friends": true,
    "Rivals": true,
    "Training Partners": true,
    "Others": true,
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Handle navigation state for opening messaging
  useEffect(() => {
    if (location.state?.openMessaging && location.state?.friendId) {
      const friendId = location.state.friendId;
      setSelectedFriend(friendId);
      setShowChatInterface(true);
      setActiveTab("messages");
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Get friend IDs for presence tracking
  const friendIds = friends.map(f => f.id);
  const { onlineUsers } = usePresence(friendIds);

  // Get chat room ID for typing indicator
  const getChatRoomId = (friendId: string) => {
    if (!user) return "";
    return [user.id, friendId].sort().join("_");
  };

  const roomId = selectedFriend ? getChatRoomId(selectedFriend) : "";
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(roomId, user?.id || "");

  // Load blocked users
  useEffect(() => {
    if (!user) return;
    loadBlockedUsers();
  }, [user]);

  // Load friend groups
  useEffect(() => {
    if (!user) return;
    loadFriendGroups();
  }, [user, friends]);

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedFriend]);

  const loadBlockedUsers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("blocks")
      .select("blocked_user_id")
      .eq("user_id", user.id);
    
    if (data) {
      setBlockedUsers(new Set(data.map(b => b.blocked_user_id)));
    }
  };

  const loadFriendGroups = async () => {
    if (!user || friends.length === 0) return;
    
    const { data } = await supabase
      .from("friend_groups")
      .select("friend_id, group_name")
      .eq("user_id", user.id)
      .in("friend_id", friends.map(f => f.id));
    
    if (data) {
      const groupMap = new Map(data.map(g => [g.friend_id, g.group_name]));
      setFriendGroups(groupMap);
    }
  };

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
        deleted_for_sender,
        deleted_for_receiver,
        sender:profiles!direct_messages_sender_id_fkey(username, avatar_url)
      `)
      .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Load reactions for messages
      const messageIds = data.map(m => m.id);
      const { data: reactionsData } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      const messagesWithReactions = data.map(msg => ({
        ...msg,
        reactions: reactionsData?.filter(r => r.message_id === msg.id) || []
      }));

      setMessages(messagesWithReactions as any);
      organizeChatRooms(messagesWithReactions as any);
    }
  };

  const organizeChatRooms = (allMessages: Message[]) => {
    if (!user) return;

    const roomsMap = new Map<string, ChatRoom>();
    
    allMessages.forEach(msg => {
      const friendId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      
      // Skip if user is blocked
      if (blockedUsers.has(friendId)) return;
      
      const friend = friends.find(f => f.id === friendId);
      if (!friend) return;

      // Check if message is deleted for current user
      const isDeletedForMe = msg.sender_id === user.id 
        ? msg.deleted_for_sender 
        : msg.deleted_for_receiver;
      
      if (isDeletedForMe) return;

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
    
    // Check if friend is blocked
    if (blockedUsers.has(selectedFriend)) {
      toast.error("Cannot send message to blocked user");
      return;
    }

    stopTyping();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (e.target.value.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        reactor_id: user.id,
        emoji,
      });

    if (!error) {
      loadMessages();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const isOwnMessage = message.sender_id === user.id;

    await supabase
      .from('direct_messages')
      .update({
        deleted_for_sender: isOwnMessage ? true : message.deleted_for_sender,
        deleted_for_receiver: !isOwnMessage ? true : message.deleted_for_receiver,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    loadMessages();
    toast.success("Message deleted");
  };

  const handleBlockUser = async (friendId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('blocks')
      .insert({
        user_id: user.id,
        blocked_user_id: friendId,
      });

    if (!error) {
      setBlockedUsers(prev => new Set([...prev, friendId]));
      setSelectedFriend(null);
      toast.success("User blocked");
      loadMessages();
    }
  };

  const handleUnblockUser = async (friendId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('user_id', user.id)
      .eq('blocked_user_id', friendId);

    if (!error) {
      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
      toast.success("User unblocked");
      loadMessages();
    }
  };

  const handleChangeFriendGroup = async (friendId: string, groupName: string) => {
    if (!user) return;

    await supabase
      .from('friend_groups')
      .upsert({
        user_id: user.id,
        friend_id: friendId,
        group_name: groupName,
      }, {
        onConflict: 'user_id,friend_id'
      });

    loadFriendGroups();
    toast.success(`Moved to ${groupName}`);
  };

  const markAsRead = async (friendId: string) => {
    if (!user) return;

    await supabase
      .from('direct_messages')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', friendId);
  };

  const selectedFriendMessages = messages.filter(msg => {
    if (!user || !selectedFriend) return false;
    
    const isInConversation = 
      (msg.sender_id === user.id && msg.receiver_id === selectedFriend) ||
      (msg.sender_id === selectedFriend && msg.receiver_id === user.id);
    
    if (!isInConversation) return false;

    // Filter out deleted messages
    const isDeletedForMe = msg.sender_id === user.id 
      ? msg.deleted_for_sender 
      : msg.deleted_for_receiver;
    
    return !isDeletedForMe;
  });

  const selectedFriendData = friends.find(f => f.id === selectedFriend);
  const isSelectedFriendOnline = selectedFriend ? onlineUsers.has(selectedFriend) : false;
  const isSelectedFriendTyping = typingUsers.has(selectedFriend || "");

  // Organize friends into groups
  const organizedFriends = ["Close Friends", "Rivals", "Training Partners", "Others"].map(groupName => ({
    groupName,
    friends: friends.filter(f => {
      const group = friendGroups.get(f.id) || "Others";
      return group === groupName && !blockedUsers.has(f.id);
    }),
    isOpen: groupStates[groupName] ?? true,
  }));

  // Show chat interface if friend is selected
  if (showChatInterface && selectedFriend) {
    const friendData = friends.find(f => f.id === selectedFriend);
    if (friendData) {
      return (
        <ChatInterface
          friendId={selectedFriend}
          friendUsername={friendData.username}
          friendAvatar={null}
          onClose={() => {
            setShowChatInterface(false);
            setSelectedFriend(null);
          }}
        />
      );
    }
  }

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                              selectedFriend === room.friendId
                                ? 'bg-primary/10 border border-primary/30'
                                : 'hover:bg-card-dark border border-transparent'
                            }`}
                          >
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-10 w-10 border-2 border-primary/30">
                                <AvatarImage src={room.friendAvatar || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {room.friendUsername[0]}
                                </AvatarFallback>
                              </Avatar>
                              <Circle
                                className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
                                  onlineUsers.has(room.friendId) ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold truncate">{room.friendUsername}</p>
                                {room.unreadCount > 0 && (
                                  <Badge className="bg-primary text-xs flex-shrink-0">{room.unreadCount}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFriend(room.friendId);
                                setShowChatInterface(true);
                                markAsRead(room.friendId);
                              }}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-primary/30">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {selectedFriendData.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <Circle
                              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
                                isSelectedFriendOnline ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                              }`}
                            />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {selectedFriendData.username}
                              {isSelectedFriendOnline && (
                                <span className="text-xs text-green-500 font-normal">Online</span>
                              )}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Class {selectedFriendData.class} • {selectedFriendData.rating} rating
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/profile/${selectedFriend}`)}>
                              View Profile
                            </DropdownMenuItem>
                            {blockedUsers.has(selectedFriend!) ? (
                              <DropdownMenuItem onClick={() => handleUnblockUser(selectedFriend!)}>
                                Unblock User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleBlockUser(selectedFriend!)}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Block User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col" style={{ height: '540px' }}>
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-2">
                          {selectedFriendMessages.map((msg) => (
                            <ChatBubble
                              key={msg.id}
                              message={msg.message}
                              timestamp={msg.created_at}
                              isOwn={msg.sender_id === user?.id}
                              reactions={msg.reactions}
                              onReact={(emoji) => handleReaction(msg.id, emoji)}
                              onDelete={msg.sender_id === user?.id ? () => handleDeleteMessage(msg.id) : undefined}
                              deleted={msg.sender_id === user?.id ? msg.deleted_for_sender : msg.deleted_for_receiver}
                            />
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                        {isSelectedFriendTyping && (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>{selectedFriendData.username} is typing...</span>
                          </div>
                        )}
                      </ScrollArea>
                      <div className="border-t border-border p-4 bg-background">
                        <div className="flex gap-2">
                          <Input
                            ref={messageInputRef}
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={handleInputChange}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            onBlur={stopTyping}
                            className="flex-1 rounded-full"
                          />
                          <Button 
                            onClick={sendMessage} 
                            size="icon"
                            className="rounded-full"
                            disabled={!messageInput.trim()}
                          >
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
                  My Friends ({friends.filter(f => !blockedUsers.has(f.id)).length})
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
                  <div className="space-y-4">
                    {organizedFriends.map((group) => (
                      group.friends.length > 0 && (
                        <Collapsible
                          key={group.groupName}
                          open={group.isOpen}
                          onOpenChange={(open) => setGroupStates(prev => ({ ...prev, [group.groupName]: open }))}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-3 bg-card-dark rounded-lg hover:bg-accent/50 transition-colors">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">{group.groupName}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {group.friends.length}
                                </Badge>
                              </div>
                              <span className="text-muted-foreground text-xs">
                                {group.isOpen ? "▼" : "▶"}
                              </span>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                              {group.friends.map((friend) => (
                                <Card key={friend.id} className="bg-card-dark hover:bg-accent/30 transition-all">
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
                                            onlineUsers.has(friend.id) ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                                          }`}
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-bold flex items-center gap-2">
                                          {friend.username}
                                          {onlineUsers.has(friend.id) && (
                                            <span className="text-xs text-green-500 font-normal">Online</span>
                                          )}
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
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedFriend(friend.id);
                                          setShowChatInterface(true);
                                          setActiveTab("messages");
                                        }}
                                        title="Send Message"
                                      >
                                        <MessageCircle className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (!profile) return;
                                          
                                          const { data: existingChallenge } = await supabase
                                            .from("challenges")
                                            .select("id")
                                            .eq("challenger_id", profile.id)
                                            .eq("challenged_id", friend.id)
                                            .eq("status", "pending")
                                            .single();

                                          if (existingChallenge) {
                                            toast.error("You already have a pending challenge with this player");
                                            return;
                                          }

                                          const { error } = await supabase.from("challenges").insert({
                                            challenger_id: profile.id,
                                            challenged_id: friend.id,
                                            time_control: "10+5",
                                          });

                                          if (error) {
                                            toast.error("Failed to send challenge");
                                          } else {
                                            toast.success("Challenge sent!");
                                          }
                                        }}
                                        className="hover:bg-primary/10 hover:text-primary"
                                        title="Challenge to Game"
                                      >
                                        <Swords className="h-4 w-4" />
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button size="sm" variant="ghost">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeFriendGroup(friend.id, "Close Friends");
                                          }}>
                                            Move to Close Friends
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeFriendGroup(friend.id, "Rivals");
                                          }}>
                                            Move to Rivals
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeFriendGroup(friend.id, "Training Partners");
                                          }}>
                                            Move to Training Partners
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeFriendGroup(friend.id, "Others");
                                          }}>
                                            Move to Others
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeFriend(friend.id);
                                            }}
                                            className="text-destructive"
                                          >
                                            <X className="h-4 w-4 mr-2" />
                                            Remove Friend
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )
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
