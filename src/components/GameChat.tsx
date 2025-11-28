import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, Smile, Heart, ThumbsUp, Flag, Volume2, VolumeX, 
  MoreVertical, Reply, Copy, Lock
} from "lucide-react";
import { toast } from "sonner";
import EmojiPicker from 'emoji-picker-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { encryptMessage, decryptMessage } from "@/utils/chatEncryption";

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
  };
  reactions?: string[];
}

interface GameChatProps {
  gameId: string;
  fullscreen?: boolean;
  opponentName?: string;
  spectatorCount?: number;
  onResign?: () => void;
  whitePlayerId?: string;
  blackPlayerId?: string;
}

export const GameChat = ({ 
  gameId, 
  fullscreen = false,
  opponentName = 'Opponent',
  spectatorCount = 0,
  onResign,
  whitePlayerId,
  blackPlayerId
}: GameChatProps) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages with real-time updates
    const messagesChannel = supabase
      .channel(`game-chat:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_messages',
          filter: `game_id=eq.${gameId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Fetch username for the new message
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newMsg.user_id)
            .single();
          
          // Decrypt message before adding to state
          const decryptedMsg = await decryptMessage(newMsg.message, gameId);
          
          // Add message immediately to state
          setMessages(prev => [...prev, {
            id: newMsg.id,
            user_id: newMsg.user_id,
            message: decryptedMsg,
            created_at: newMsg.created_at,
            profiles: { username: userProfile?.username || 'Player' },
            reactions: []
          }]);
          
          // Play sound if not muted
          if (!isMuted && newMsg.user_id !== user?.id) {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [gameId, user?.id, isMuted]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('game_messages')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Fetch usernames separately
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

      // Decrypt messages
      const decryptedMessages = await Promise.all(
        data.map(async (msg) => ({
          ...msg,
          message: await decryptMessage(msg.message, gameId),
          profiles: { username: profileMap.get(msg.user_id) || 'Player' },
          reactions: []
        }))
      );

      setMessages(decryptedMessages as any);
    }
  };

  const handleTyping = () => {
    // Broadcast typing indicator (simplified - would use presence in production)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      // Clear typing indicator
    }, 1000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    
    // Encrypt message before sending
    const encryptedMessage = await encryptMessage(newMessage.trim(), gameId);
    
    const { error } = await supabase
      .from('game_messages')
      .insert({
        game_id: gameId,
        user_id: user.id,
        message: encryptedMessage
      });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
    }
    setLoading(false);
  };

  const addEmoji = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Message copied!');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className={`${fullscreen ? 'h-full rounded-none' : 'h-full'} flex flex-col border-border bg-card/95 backdrop-blur-sm`}>
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-secondary/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold font-rajdhani">Game Chat</h3>
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              vs {opponentName} • {spectatorCount} watching • Messages auto-delete after game
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            {onResign && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onResign}
                className="h-8 px-3"
              >
                <Flag className="h-3 w-3 mr-1" />
                Resign
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            // Determine color based on player ID (white = blue, black = green)
            const isWhitePlayer = msg.user_id === whitePlayerId;
            const playerColor = isWhitePlayer ? 'blue' : 'green';
            
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-[85%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isOwn && (
                      <p className={`text-xs font-medium ${playerColor === 'blue' ? 'text-blue-400' : 'text-green-400'}`}>
                        {msg.profiles?.username || 'Player'}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                  
                  <div className="group relative">
                    <div
                      className={`
                        p-3 rounded-2xl shadow-sm transition-all hover:shadow-md border
                        ${isOwn 
                          ? playerColor === 'blue' 
                            ? 'bg-blue-600/20 text-foreground border-blue-500/50 rounded-br-sm' 
                            : 'bg-green-600/20 text-foreground border-green-500/50 rounded-br-sm'
                          : playerColor === 'blue'
                            ? 'bg-blue-600/10 border-blue-500/30 rounded-bl-sm'
                            : 'bg-green-600/10 border-green-500/30 rounded-bl-sm'
                        }
                      `}
                    >
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>

                    {/* Quick actions on hover */}
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 rounded-full shadow-lg"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyMessage(msg.message)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Heart className="h-4 w-4 mr-2" />
                            React
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground text-sm">
                No messages yet. Start the conversation!
              </p>
            </div>
          )}
          
          {/* Typing indicator */}
          {typingUsers.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{opponentName} is typing...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-secondary/10">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="start" 
              className="w-full p-0 border-0"
            >
              <EmojiPicker 
                onEmojiClick={addEmoji}
                width="100%"
                height="400px"
              />
            </PopoverContent>
          </Popover>

          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            disabled={loading}
            maxLength={500}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e as any);
              }
            }}
          />
          
          <Button 
            type="submit" 
            disabled={loading || !newMessage.trim()}
            size="icon"
            className="flex-shrink-0 hover:scale-110 active:scale-95 transition-transform"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
};
