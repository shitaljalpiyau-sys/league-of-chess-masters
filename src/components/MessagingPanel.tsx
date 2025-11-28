import { X, Send, UserPlus, Check, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface MessagingPanelProps {
  open: boolean;
  onClose: () => void;
}

export const MessagingPanel = ({ open, onClose }: MessagingPanelProps) => {
  const [message, setMessage] = useState("");

  // Mock data - replace with real data from backend
  const friendRequests = [
    { id: 1, username: "ChessMaster99", avatar: "/avatars/avatar-1.png" },
    { id: 2, username: "KnightRider", avatar: "/avatars/avatar-2.png" },
  ];

  const chats = [
    {
      id: 1,
      username: "QueenGambit",
      avatar: "/avatars/avatar-3.png",
      lastMessage: "Good game!",
      time: "2m ago",
      unread: 2,
    },
    {
      id: 2,
      username: "RookPlayer",
      avatar: "/avatars/avatar-4.png",
      lastMessage: "Want to play again?",
      time: "1h ago",
      unread: 0,
    },
  ];

  if (!open) return null;

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
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-card-dark"
          >
            <X className="h-5 w-5" />
          </Button>
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
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card-dark/50 hover:bg-card-dark border border-transparent hover:border-border transition-all cursor-pointer"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/30">
                      <AvatarImage src={chat.avatar} alt={chat.username} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {chat.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {chat.username}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {chat.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                    {chat.unread > 0 && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                          {chat.unread}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
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
                      <AvatarImage src={request.avatar} alt={request.username} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {request.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {request.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Wants to be friends
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-primary hover:bg-primary/90"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-border hover:border-destructive hover:text-destructive"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};
