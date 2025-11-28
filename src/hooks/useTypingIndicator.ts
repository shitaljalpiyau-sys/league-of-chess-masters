import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useTypingIndicator = (roomId: string, userId: string) => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!roomId || !userId) return;

    const typingChannel = supabase.channel(`typing_${roomId}`);

    typingChannel
      .on("broadcast", { event: "typing_start" }, ({ payload }) => {
        if (payload.user_id !== userId) {
          setTypingUsers((prev) => new Set([...prev, payload.user_id]));
        }
      })
      .on("broadcast", { event: "typing_stop" }, ({ payload }) => {
        if (payload.user_id !== userId) {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(payload.user_id);
            return newSet;
          });
        }
      })
      .subscribe();

    setChannel(typingChannel);

    return () => {
      if (typingChannel) {
        supabase.removeChannel(typingChannel);
      }
    };
  }, [roomId, userId]);

  const startTyping = useCallback(() => {
    if (!channel) return;

    channel.send({
      type: "broadcast",
      event: "typing_start",
      payload: { user_id: userId },
    });

    // Auto-stop typing after 3 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [channel, userId]);

  const stopTyping = useCallback(() => {
    if (!channel) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    channel.send({
      type: "broadcast",
      event: "typing_stop",
      payload: { user_id: userId },
    });
  }, [channel, userId]);

  return { typingUsers, startTyping, stopTyping };
};
