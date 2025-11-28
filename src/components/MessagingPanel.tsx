import { X, Check, XIcon, MessageCircle, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChatInterface } from "./ChatInterface";

interface MessagingPanelProps {
  open: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadUpdate: (count: number) => void;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

interface DirectMessage {
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

export const MessagingPanel = ({ open, onClose, unreadCount, onUnreadUpdate }: MessagingPanelProps) => {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ id: string; username: string; avatar: string | null } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !open) return;

    loadFriendRequests();
    loadMessages();

    // Real-time subscriptions
    const requestsChannel = supabase
      .channel('friend-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        loadFriendRequests();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('direct-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, open]);

  const loadFriendRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        sender:profiles!friend_requests_sender_id_fkey(username, avatar_url)
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (!error && data) {
      setFriendRequests(data as any);
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
        sender:profiles!direct_messages_sender_id_fkey(username, avatar_url)
      `)
      .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setMessages(data as any);
      const unread = data.filter(m => m.receiver_id === user.id && !m.read).length;
      onUnreadUpdate(unread);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    if (!user) return;

    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) {
      toast.error("Failed to accept request");
      return;
    }

    const { error: insertError } = await supabase
      .from('friendships')
      .insert({
        user1_id: user.id,
        user2_id: senderId,
      });

    if (!insertError) {
      toast.success("Friend request accepted!");
      loadFriendRequests();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);

    if (!error) {
      toast.success("Friend request rejected");
      loadFriendRequests();
    }
  };

  const groupMessagesByUser = () => {
    if (!user) return [];
    
    const grouped = new Map();
    messages.forEach(msg => {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const otherUsername = msg.sender_id === user.id ? "You" : msg.sender.username;
      const otherAvatar = msg.sender.avatar_url;
      
      if (!grouped.has(otherUserId)) {
        grouped.set(otherUserId, {
          userId: otherUserId,
          username: otherUsername,
          avatar: otherAvatar,
          lastMessage: msg.message,
          time: new Date(msg.created_at),
          unread: msg.receiver_id === user.id && !msg.read ? 1 : 0,
        });
      } else {
        const existing = grouped.get(otherUserId);
        if (new Date(msg.created_at) > existing.time) {
          existing.lastMessage = msg.message;
          existing.time = new Date(msg.created_at);
        }
        if (msg.receiver_id === user.id && !msg.read) {
          existing.unread += 1;
        }
      }
    });
    
    return Array.from(grouped.values()).sort((a, b) => b.time.getTime() - a.time.getTime());
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("receiver_id", user.id)
      .eq("read", false);

    loadMessages();
    toast.success("All messages marked as read");
  };

  if (!open) return null;

  if (selectedChat) {
    return (
      <ChatInterface
        friendId={selectedChat.id}
        friendUsername={selectedChat.username}
        friendAvatar={selectedChat.avatar}
        onClose={() => setSelectedChat(null)}
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-card/95 backdrop-blur-xl border-l border-border z-50 animate-slide-in-right shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card-dark/50">
          <h2 className="text-lg font-bold text-foreground">Messages</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-card-dark"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chats" className="flex flex-col h-[calc(100%-4rem)]">
          <TabsList className="w-full grid grid-cols-2 bg-card-dark/50 border-b border-border rounded-none h-12">
            <TabsTrigger value="chats" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Chats
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Requests ({friendRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Chats Tab */}
          <TabsContent value="chats" className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {groupMessagesByUser().map((chat) => (
                  <div
                    key={chat.userId}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card-dark/50 hover:bg-card-dark border border-transparent hover:border-border transition-all group"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/30 flex-shrink-0">
                      <AvatarImage src={chat.avatar || undefined} alt={chat.username} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {chat.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {chat.username}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {chat.unread > 0 && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">
                            {chat.unread}
                          </span>
                        </div>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedChat({ id: chat.userId, username: chat.username, avatar: chat.avatar })}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {groupMessagesByUser().length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No messages yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Friend Requests Tab */}
          <TabsContent value="requests" className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card-dark/50 border border-border"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/30">
                      <AvatarImage src={request.sender.avatar_url || undefined} alt={request.sender.username} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {request.sender.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {request.sender.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Wants to be friends
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-primary hover:bg-primary/90"
                        onClick={() => handleAcceptRequest(request.id, request.sender_id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-border hover:border-destructive hover:text-destructive"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {friendRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No pending requests</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};
