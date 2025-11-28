import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Gift, Zap, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    icon: <Megaphone className="w-5 h-5 text-primary" />,
    title: "New Update Deployed",
    message: "Check out the latest features and improvements in the platform",
    timestamp: "2 hours ago",
    isRead: false,
  },
  {
    id: "2",
    icon: <Zap className="w-5 h-5 text-accent" />,
    title: "Weekly Tournament Starting Soon",
    message: "Don't miss the chance to compete and win amazing prizes",
    timestamp: "5 hours ago",
    isRead: false,
  },
  {
    id: "3",
    icon: <Gift className="w-5 h-5 text-primary" />,
    title: "You Earned 10 Bonus Points",
    message: "Great job completing your daily challenge streak!",
    timestamp: "1 day ago",
    isRead: true,
  },
];

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationPanel = ({ open, onOpenChange }: NotificationPanelProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] bg-card border-border p-0">
        <SheetHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-rajdhani text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Notifications
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="p-4 space-y-3">
            {MOCK_NOTIFICATIONS.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all duration-300 hover:bg-card-dark cursor-pointer hover:scale-[1.01] animate-slide-up ${
                  notification.isRead
                    ? "bg-card-darker border-border/50"
                    : "bg-card border-border shadow-sm"
                }`}
              >
                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {notification.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-foreground text-sm leading-tight">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {notification.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
