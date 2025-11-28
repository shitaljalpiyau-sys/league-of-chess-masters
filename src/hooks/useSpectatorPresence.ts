import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

interface SpectatorPresence {
  user_id: string;
  username: string;
  online_at: string;
}

export const useSpectatorPresence = (gameId: string) => {
  const { user, profile } = useAuth();
  const [spectators, setSpectators] = useState<SpectatorPresence[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const spectatorChannel = supabase.channel(`game_spectators_${gameId}`, {
      config: {
        presence: {
          key: user?.id || `guest_${Math.random()}`,
        },
      },
    });

    spectatorChannel
      .on("presence", { event: "sync" }, () => {
        const state = spectatorChannel.presenceState();
        const allSpectators: SpectatorPresence[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: SpectatorPresence) => {
            allSpectators.push(presence);
          });
        });
        
        setSpectators(allSpectators);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("Spectator joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("Spectator left:", leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && user && profile) {
          await spectatorChannel.track({
            user_id: user.id,
            username: profile.username,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(spectatorChannel);

    return () => {
      spectatorChannel.unsubscribe();
    };
  }, [gameId, user, profile]);

  return {
    spectators,
    viewerCount: spectators.length,
    channel,
  };
};
