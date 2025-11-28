import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ChatMessage {
  id: string;
  user_id: string;
  class: string;
  message: string;
  created_at: string;
  username?: string;
  avatar_url?: string | null;
}

const GlobalChat = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("global_chat_messages")
        .select("*")
        .eq("class", profile.class)
        .order("created_at", { ascending: true })
        .limit(1000);

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      // Fetch usernames and avatars for all messages
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, { username: p.username, avatar_url: p.avatar_url }]) || []);
      const messagesWithUsernames = data.map(msg => ({
        ...msg,
        username: profileMap.get(msg.user_id)?.username || "Unknown",
        avatar_url: profileMap.get(msg.user_id)?.avatar_url || null
      }));

      setMessages(messagesWithUsernames);
    };

    fetchMessages();

    // Set up realtime subscription
    const channel = supabase
      .channel("global-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "global_chat_messages",
          filter: `class=eq.${profile.class}`
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          // Fetch username and avatar for new message
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", newMsg.user_id)
            .single();

          setMessages(prev => {
            const updated = [...prev, {
              ...newMsg,
              username: userProfile?.username || "Unknown",
              avatar_url: userProfile?.avatar_url || null
            }];
            
            // Keep only latest 1000 messages in state
            if (updated.length > 1000) {
              return updated.slice(-1000);
            }
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile) return;

    const { error } = await supabase
      .from("global_chat_messages")
      .insert({
        user_id: profile.id,
        class: profile.class,
        message: newMessage.trim(),
        avatar_url: profile.avatar_url
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return;
    }

    setNewMessage("");
  };

  if (!profile) {
    return (
      <motion.div 
        className="container max-w-4xl mx-auto py-8"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center">Please log in to access global chat</div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="container max-w-4xl mx-auto py-8 px-4"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-card rounded-lg border shadow-sm h-[calc(100vh-12rem)] flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">Class {profile.class} Global Chat</h1>
          <p className="text-sm text-muted-foreground">
            Chat with other players in Class {profile.class}
          </p>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No messages yet. Be the first to say something!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.user_id === profile.id ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar 
                    className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => navigate(`/profile/${msg.user_id}`)}
                  >
                    <AvatarImage src={msg.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {msg.username?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col ${
                      msg.user_id === profile.id ? "items-end" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/profile/${msg.user_id}`)}
                      >
                        {msg.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div
                      className={`mt-1 px-3 py-2 rounded-lg max-w-md ${
                        msg.user_id === profile.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              maxLength={500}
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default GlobalChat;