import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Eye, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

interface SpectatorChatProps {
  gameId: string;
  viewerCount: number;
}

export const SpectatorChat = ({ gameId, viewerCount }: SpectatorChatProps) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`game_chat_${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_messages",
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          // Fetch username for new message
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg: Message = {
            id: payload.new.id,
            user_id: payload.new.user_id,
            username: userProfile?.username || "Unknown",
            message: payload.new.message,
            created_at: payload.new.created_at,
          };

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("game_messages")
      .select(`
        id,
        user_id,
        message,
        created_at
      `)
      .eq("game_id", gameId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!error && data) {
      // Fetch usernames for all messages
      const userIds = [...new Set(data.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.id, p.username]) || []
      );

      const messagesWithUsernames: Message[] = data.map((msg) => ({
        ...msg,
        username: profileMap.get(msg.user_id) || "Unknown",
      }));

      setMessages(messagesWithUsernames);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);

    const { error } = await supabase.from("game_messages").insert({
      game_id: gameId,
      user_id: user.id,
      message: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
    }

    setSending(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-rajdhani flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Spectator Chat
          </CardTitle>
          <Badge variant="secondary" className="gap-1 animate-pulse">
            <Eye className="h-3 w-3" />
            {viewerCount} {viewerCount === 1 ? "viewer" : "viewers"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                No messages yet. Be the first to comment!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 animate-slide-up ${
                    msg.user_id === user?.id ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {msg.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex-1 ${
                      msg.user_id === user?.id ? "text-right" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.user_id === user?.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.created_at)}
                          </span>
                          <span className="font-bold text-sm">
                            {msg.username}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-sm">
                            {msg.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.created_at)}
                          </span>
                        </>
                      )}
                    </div>
                    <p
                      className={`text-sm px-3 py-2 rounded-lg inline-block max-w-[85%] ${
                        msg.user_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {user ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              maxLength={500}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || sending}
              className="hover:scale-105 active:scale-95 transition-transform"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="text-center py-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Login to join the chat
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
