import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PresenceState {
  [key: string]: {
    user_id: string;
    online_at: string;
  }[];
}

export const usePresence = (friendIds: string[]) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!user || friendIds.length === 0) return;

    const presenceChannel = supabase.channel("online_users", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState() as PresenceState;
        const online = new Set<string>();
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            if (friendIds.includes(presence.user_id)) {
              online.add(presence.user_id);
            }
          });
        });
        
        setOnlineUsers(online);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        const userId = newPresences[0]?.user_id;
        if (userId && friendIds.includes(userId)) {
          setOnlineUsers((prev) => new Set([...prev, userId]));
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        const userId = leftPresences[0]?.user_id;
        if (userId) {
          setOnlineUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      if (presenceChannel) {
        presenceChannel.untrack();
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [user, friendIds.join(",")]);

  return { onlineUsers, channel };
};
