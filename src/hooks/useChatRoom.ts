import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
  chat_room_id: string;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

export const useChatRoom = (friendId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get or create chat room
  useEffect(() => {
    if (!user || !friendId) {
      setLoading(false);
      return;
    }

    const initChatRoom = async () => {
      setLoading(true);
      
      // Ensure user1_id < user2_id for consistency
      const [user1, user2] = [user.id, friendId].sort();

      // Try to find existing chat room
      let { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("user1_id", user1)
        .eq("user2_id", user2)
        .single();

      if (!existingRoom) {
        // Create new chat room
        const { data: newRoom, error } = await supabase
          .from("chat_rooms")
          .insert({ user1_id: user1, user2_id: user2 })
          .select()
          .single();

        if (!error && newRoom) {
          existingRoom = newRoom;
        }
      }

      if (existingRoom) {
        setChatRoomId(existingRoom.id);
        loadMessages(existingRoom.id);
      }
      
      setLoading(false);
    };

    initChatRoom();
  }, [user, friendId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!chatRoomId) return;

    const channel = supabase
      .channel(`chat_room_${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        () => {
          loadMessages(chatRoomId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId]);

  const loadMessages = async (roomId: string) => {
    const { data, error } = await supabase
      .from("direct_messages")
      .select(`
        id,
        sender_id,
        receiver_id,
        message,
        created_at,
        read,
        chat_room_id,
        sender:profiles!direct_messages_sender_id_fkey(username, avatar_url)
      `)
      .eq("chat_room_id", roomId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as any);
    }
  };

  const sendMessage = async (message: string) => {
    if (!user || !friendId || !chatRoomId || !message.trim()) return;

    const { error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: user.id,
        receiver_id: friendId,
        message: message.trim(),
        chat_room_id: chatRoomId,
      });

    if (!error) {
      loadMessages(chatRoomId);
    }

    return { error };
  };

  const markAsRead = async () => {
    if (!user || !chatRoomId) return;

    await supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("chat_room_id", chatRoomId)
      .eq("receiver_id", user.id)
      .eq("read", false);
  };

  return {
    messages,
    chatRoomId,
    loading,
    sendMessage,
    markAsRead,
  };
};
