import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MasterProgress {
  id: string;
  user_id: string;
  master_xp: number;
  master_level: number;
  last_power_used: number | null;
  total_matches: number;
  total_wins: number;
  total_losses: number;
  created_at: string;
  updated_at: string;
}

export const useMasterProgress = () => {
  const [masterProgress, setMasterProgress] = useState<MasterProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Calculate XP needed for next level
  const getNextLevelXP = useCallback((level: number) => {
    return Math.floor(50 * level * 1.5);
  }, []);

  // Calculate Master XP reward based on power
  const calculateMasterXP = useCallback((power: number) => {
    const xp = Math.round(power * 0.8);
    return Math.max(5, Math.min(100, xp)); // Clamp between 5 and 100
  }, []);

  // Fetch master progress
  const fetchMasterProgress = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('master_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching master progress:', error);
      setLoading(false);
      return;
    }

    if (!data) {
      // Create initial master progress
      const { data: newProgress, error: createError } = await supabase
        .from('master_progress')
        .insert({
          user_id: user.id,
          master_xp: 0,
          master_level: 1,
          total_matches: 0,
          total_wins: 0,
          total_losses: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating master progress:', createError);
      } else {
        setMasterProgress(newProgress);
      }
    } else {
      setMasterProgress(data);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMasterProgress();
  }, [fetchMasterProgress]);

  // Award Master XP after a match
  const awardMasterXP = useCallback(async (power: number, won: boolean) => {
    if (!user || !masterProgress) return;

    const xpEarned = won ? calculateMasterXP(power) : 0;
    let newXP = masterProgress.master_xp + xpEarned;
    let newLevel = masterProgress.master_level;
    let leveledUp = false;

    // Check for level-up
    let nextLevelXP = getNextLevelXP(newLevel);
    while (newXP >= nextLevelXP) {
      newXP -= nextLevelXP;
      newLevel += 1;
      leveledUp = true;
      nextLevelXP = getNextLevelXP(newLevel);
    }

    // Update database
    const { error } = await supabase
      .from('master_progress')
      .update({
        master_xp: newXP,
        master_level: newLevel,
        last_power_used: power,
        total_matches: masterProgress.total_matches + 1,
        total_wins: won ? masterProgress.total_wins + 1 : masterProgress.total_wins,
        total_losses: won ? masterProgress.total_losses : masterProgress.total_losses + 1
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating master progress:', error);
      toast.error('Failed to update Master progress');
      return;
    }

    // Refresh progress
    await fetchMasterProgress();

    // Show level-up notification
    if (leveledUp) {
      toast.success(`🎉 Your Master leveled up to ${newLevel}!`, {
        description: 'Master AI is now stronger and more challenging'
      });
    } else if (won && xpEarned > 0) {
      toast.success(`+${xpEarned} Master XP earned!`);
    }
  }, [user, masterProgress, calculateMasterXP, getNextLevelXP, fetchMasterProgress]);

  // Get Master level boost for AI difficulty
  const getMasterLevelBoost = useCallback(() => {
    if (!masterProgress) return { depthBoost: 0, blunderReduction: 0, speedBoost: 0 };

    const level = masterProgress.master_level;
    return {
      depthBoost: Math.floor(level / 4), // +1 depth every 4 levels
      blunderReduction: Math.min(0.003 * level, 0.44), // -0.3% per level, capped at 44%
      speedBoost: Math.min(0.02 * level, 2) // -0.02s per level, capped at 2s
    };
  }, [masterProgress]);

  return {
    masterProgress,
    loading,
    awardMasterXP,
    getNextLevelXP,
    calculateMasterXP,
    getMasterLevelBoost,
    refreshProgress: fetchMasterProgress
  };
};