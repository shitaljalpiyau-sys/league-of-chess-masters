import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useChallengeSystem = () => {
  const { profile } = useAuth();

  // Check if challenge is valid by rating gap
  const isValidRatingGap = (playerRating: number, opponentRating: number): boolean => {
    const gap = Math.abs(playerRating - opponentRating);
    return gap <= 150;
  };

  // Get matchmaking eligibility
  const getMatchmakingEligibility = (playerClass: string, playerRating: number) => {
    const eligibility = {
      canMatchWithClasses: [playerClass],
      ratingRange: { min: playerRating - 150, max: playerRating + 150 },
    };

    // Class C can match with Class C and lowest-rated Class B
    if (playerClass === "C") {
      eligibility.canMatchWithClasses.push("B");
    }

    return eligibility;
  };

  return {
    isValidRatingGap,
    getMatchmakingEligibility,
  };
};