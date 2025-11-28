import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useQuickMatch = (timeControl: string) => {
  const [searching, setSearching] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!searching) return;

    const channel = supabase
      .channel('matchmaking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'games'
        },
        async (payload) => {
          const game = payload.new;
          if (game.white_player_id === user?.id || game.black_player_id === user?.id) {
            setSearching(false);
            await leaveQueue();
            toast.success('Match found!');
            navigate(`/game/${game.id}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searching, user?.id, navigate]);

  const joinQueue = async () => {
    if (!user || !profile) {
      toast.error('Please log in to play');
      return;
    }

    setSearching(true);

    // Insert into queue
    const { error: insertError } = await supabase
      .from('matchmaking_queue')
      .insert({
        user_id: user.id,
        time_control: timeControl,
        rating: profile.rating,
        status: 'waiting'
      });

    if (insertError) {
      console.error('Error joining queue:', insertError);
      toast.error('Failed to join matchmaking');
      setSearching(false);
      return;
    }

    toast.success('Searching for opponent...');

    // Try to find a match
    await findMatch();
  };

  const findMatch = async () => {
    if (!user || !profile) return;

    // Find available opponents (within 150 rating points for fair matchmaking)
    const { data: opponents, error } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('time_control', timeControl)
      .eq('status', 'waiting')
      .neq('user_id', user.id)
      .gte('rating', profile.rating - 150)
      .lte('rating', profile.rating + 150)
      .limit(1);

    if (error) {
      console.error('Error finding match:', error);
      return;
    }

    if (opponents && opponents.length > 0) {
      const opponent = opponents[0];
      
      // Create game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          white_player_id: Math.random() > 0.5 ? user.id : opponent.user_id,
          black_player_id: Math.random() > 0.5 ? opponent.user_id : user.id,
          time_control: timeControl,
        })
        .select()
        .single();

      if (gameError) {
        console.error('Error creating game:', gameError);
        return;
      }

      // Update queue entries
      await supabase
        .from('matchmaking_queue')
        .update({ status: 'matched' })
        .in('user_id', [user.id, opponent.user_id]);

      // Delete queue entries
      await supabase
        .from('matchmaking_queue')
        .delete()
        .in('user_id', [user.id, opponent.user_id]);

      setSearching(false);
      toast.success('Match found!');
      navigate(`/game/${game.id}`);
    }
  };

  const leaveQueue = async () => {
    if (!user) return;

    await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('user_id', user.id);

    setSearching(false);
    toast.info('Left matchmaking queue');
  };

  return {
    searching,
    joinQueue,
    leaveQueue
  };
};
