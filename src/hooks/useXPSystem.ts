import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  calculateLevelFromXP,
  calculateMatchXP,
  getTierForLevel,
  LevelTier,
} from "@/utils/xpSystem";

export const useXPSystem = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [isTierUpgrade, setIsTierUpgrade] = useState(false);

  /**
   * Award XP to the current user and update level/tier
   */
  const awardXP = async (
    xpAmount: number,
    reason: string = "Match completed"
  ) => {
    if (!user || !profile) {
      console.error("No user or profile found");
      return;
    }

    try {
      const newTotalXP = (profile.xp || 0) + xpAmount;
      const { level: newLevel, currentLevelXP, nextLevelXP } = calculateLevelFromXP(newTotalXP);
      const oldLevel = profile.level || 1;
      const oldTier = getTierForLevel(oldLevel);
      const newTier = getTierForLevel(newLevel);

      // Update profile with new XP and level
      const { error } = await supabase
        .from("profiles")
        .update({
          xp: newTotalXP,
          level: newLevel,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Refresh profile to get updated data
      await refreshProfile();

      // Show XP gain notification
      toast({
        title: `+${xpAmount} XP`,
        description: reason,
        duration: 3000,
      });

      // Check for level up
      if (newLevel > oldLevel) {
        setIsLevelingUp(true);
        toast({
          title: "🎉 Level Up!",
          description: `You've reached Level ${newLevel}!`,
          duration: 5000,
        });

        // Check for tier upgrade
        if (newTier.name !== oldTier.name) {
          setIsTierUpgrade(true);
          toast({
            title: `🌟 Tier Upgrade: ${newTier.name}!`,
            description: `You've achieved ${newTier.material} tier!`,
            duration: 6000,
          });

          setTimeout(() => setIsTierUpgrade(false), 3000);
        }

        setTimeout(() => setIsLevelingUp(false), 3000);
      }

      return { newLevel, newTotalXP, currentLevelXP, nextLevelXP };
    } catch (error) {
      console.error("Error awarding XP:", error);
      toast({
        title: "Error",
        description: "Failed to award XP. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Award XP based on match result
   */
  const awardMatchXP = async (
    result: "win" | "draw" | "loss",
    bonuses?: {
      fastCheckmate?: boolean;
      minorPieceCheckmate?: boolean;
      drawFromLosing?: boolean;
      fiveWinStreak?: boolean;
    }
  ) => {
    const xp = calculateMatchXP(result, bonuses);
    let reason = "";

    switch (result) {
      case "win":
        reason = "Victory! 🏆";
        break;
      case "draw":
        reason = "Draw";
        break;
      case "loss":
        reason = "Match completed";
        break;
    }

    // Add bonus descriptions
    if (bonuses?.fastCheckmate) reason += " + Fast Checkmate Bonus";
    if (bonuses?.minorPieceCheckmate) reason += " + Minor Piece Checkmate";
    if (bonuses?.drawFromLosing) reason += " + Comeback Draw";
    if (bonuses?.fiveWinStreak) reason += " + 5-Win Streak!";

    return await awardXP(xp, reason);
  };

  return {
    awardXP,
    awardMatchXP,
    isLevelingUp,
    isTierUpgrade,
  };
};
