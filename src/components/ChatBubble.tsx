import { useState } from "react";
import { format } from "date-fns";
import { Smile, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Reaction {
  id: string;
  emoji: string;
  reactor_id: string;
  count?: number;
}

interface ChatBubbleProps {
  message: string;
  timestamp: string;
  isOwn: boolean;
  reactions?: Reaction[];
  onReact?: (emoji: string) => void;
  onDelete?: () => void;
  deleted?: boolean;
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const ChatBubble = ({
  message,
  timestamp,
  isOwn,
  reactions = [],
  onReact,
  onDelete,
  deleted = false,
}: ChatBubbleProps) => {
  const [showEmoji, setShowEmoji] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const existing = acc.find((r) => r.emoji === reaction.emoji);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
    } else {
      acc.push({ ...reaction, count: 1 });
    }
    return acc;
  }, [] as Reaction[]);

  if (deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
        <div
          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-muted/50 text-muted-foreground"
              : "bg-muted/30 text-muted-foreground"
          }`}
        >
          <p className="text-sm italic">This message was deleted</p>
          <p className="text-xs opacity-50 mt-1">
            {format(new Date(timestamp), "HH:mm")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4 group animate-in fade-in-0 slide-in-from-bottom-2 duration-200`}
    >
      <div className="relative max-w-[70%]">
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-card border border-border rounded-bl-none"
          } transition-all duration-200`}
        >
          <p className="text-sm break-words">{message}</p>
          <p
            className={`text-xs mt-1 ${
              isOwn ? "opacity-70" : "text-muted-foreground"
            }`}
          >
            {format(new Date(timestamp), "HH:mm")}
          </p>
        </div>

        {/* Reactions */}
        {groupedReactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {groupedReactions.map((reaction) => (
              <div
                key={reaction.id}
                className="bg-background border border-border rounded-full px-2 py-0.5 text-xs flex items-center gap-1 shadow-sm"
              >
                <span>{reaction.emoji}</span>
                {reaction.count && reaction.count > 1 && (
                  <span className="text-muted-foreground">{reaction.count}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick actions (visible on hover) */}
        <div
          className={`absolute top-0 ${
            isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"
          } opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2`}
        >
          <Popover open={showEmoji} onOpenChange={setShowEmoji}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full hover:bg-accent"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="center">
              <div className="flex gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact?.(emoji);
                      setShowEmoji(false);
                    }}
                    className="text-xl hover:scale-125 transition-transform duration-150 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {isOwn && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full hover:bg-accent"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};
