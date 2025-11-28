import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Friend {
  id: string;
  username: string;
  class: string;
  rating: number;
  online?: boolean;
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchFriends();
    fetchFriendRequests();

    // Subscribe to friend requests - real-time updates
    const channel = supabase
      .channel(`friends_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchFriendRequests();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `user1_id=eq.${user.id}`,
        },
        () => {
          fetchFriends();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `user2_id=eq.${user.id}`,
        },
        () => {
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;

    const { data: friendships } = await supabase
      .from("friendships")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (friendships) {
      const friendIds = friendships.map((f) =>
        f.user1_id === user.id ? f.user2_id : f.user1_id
      );

      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, class, rating")
          .in("id", friendIds);

        if (profiles) {
          setFriends(profiles);
        }
      } else {
        setFriends([]);
      }
    }

    setLoading(false);
  };

  const fetchFriendRequests = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("friend_requests")
      .select(`
        *,
        sender:profiles!friend_requests_sender_id_fkey(username, class, rating)
      `)
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (data) {
      setFriendRequests(data);
    }
  };

  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!user) return;

    // Create friendship
    const user1 = user.id < senderId ? user.id : senderId;
    const user2 = user.id < senderId ? senderId : user.id;

    await supabase.from("friendships").insert({
      user1_id: user1,
      user2_id: user2,
    });

    // Update request status
    await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    fetchFriends();
    fetchFriendRequests();
  };

  const rejectFriendRequest = async (requestId: string) => {
    await supabase
      .from("friend_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);

    fetchFriendRequests();
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;

    await supabase
      .from("friendships")
      .delete()
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user.id})`);

    fetchFriends();
  };

  return {
    friends,
    friendRequests,
    loading,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  };
};
