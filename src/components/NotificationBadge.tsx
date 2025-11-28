import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface NotificationBadgeProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export const NotificationBadge = ({ children, onClick }: NotificationBadgeProps) => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      // Count unread messages
      const { count: messageCount } = await supabase
        .from("direct_messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);

      // Count pending friend requests
      const { count: requestCount } = await supabase
        .from("friend_requests")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      // Count pending challenges
      const { count: challengeCount } = await supabase
        .from("challenges")
        .select("*", { count: "exact", head: true })
        .eq("challenged_id", user.id)
        .eq("status", "pending");

      setCount((messageCount || 0) + (requestCount || 0) + (challengeCount || 0));
    };

    fetchCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "direct_messages",
        filter: `receiver_id=eq.${user.id}`,
      }, fetchCount)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "friend_requests",
        filter: `receiver_id=eq.${user.id}`,
      }, fetchCount)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "challenges",
        filter: `challenged_id=eq.${user.id}`,
      }, fetchCount)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="relative cursor-pointer" onClick={onClick}>
      {children}
      {count > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold rounded-full animate-pulse"
        >
          {count > 9 ? "9+" : count}
        </Badge>
      )}
    </div>
  );
};
