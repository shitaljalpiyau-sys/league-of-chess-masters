import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CLASS_LIMITS, CLASS_INCOME, PROMOTION_SLOTS } from "@/config/pointsEconomy";

export const useWeeklyRankings = () => {
  // Initialize weekly ranking for user
  const initializeWeeklyRanking = async (userId: string) => {
    const today = new Date();
    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);

    const { data: profile } = await supabase
      .from("profiles")
      .select("class, rating")
      .eq("id", userId)
      .single();

    if (!profile) return;

    // Check if ranking already exists
    const { data: existing } = await supabase
      .from("weekly_rankings")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart.toISOString().split("T")[0])
      .single();

    if (!existing) {
      await supabase.from("weekly_rankings").insert({
        user_id: userId,
        week_start: weekStart.toISOString().split("T")[0],
        week_end: weekEnd.toISOString().split("T")[0],
        starting_class: profile.class,
        starting_rating: profile.rating,
      });
    }
  };

  // Update ranking after game
  const updateRankingAfterGame = async (userId: string, won: boolean) => {
    const today = new Date();
    const weekStart = getWeekStart(today);

    const { data: ranking } = await supabase
      .from("weekly_rankings")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart.toISOString().split("T")[0])
      .single();

    if (ranking) {
      await supabase
        .from("weekly_rankings")
        .update({
          games_played: ranking.games_played + 1,
          games_won: won ? ranking.games_won + 1 : ranking.games_won,
        })
        .eq("id", ranking.id);
    }
  };

  // Weekly promotion/demotion cycle
  const runWeeklyPromotionCycle = async () => {
    const today = new Date();
    const lastWeekStart = getWeekStart(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));

    // Get all rankings from last week
    const { data: rankings } = await supabase
      .from("weekly_rankings")
      .select(`
        *,
        profile:profiles!weekly_rankings_user_id_fkey(*)
      `)
      .eq("week_start", lastWeekStart.toISOString().split("T")[0])
      .order("ending_rating", { ascending: false });

    if (!rankings) return;

    // Group by class
    const byClass: Record<string, any[]> = {
      ELITE: [],
      A: [],
      B: [],
      C: [],
      D: [],
    };

    rankings.forEach((r) => {
      const currentClass = r.ending_class || r.starting_class;
      if (byClass[currentClass]) {
        byClass[currentClass].push(r);
      }
    });

    // ELITE vs A
    const topA = byClass.A.slice(0, PROMOTION_SLOTS.A_TO_ELITE);
    const bottomElite = byClass.ELITE.slice(PROMOTION_SLOTS.A_TO_ELITE);
    
    for (const player of topA) {
      await promotePlayer(player.user_id, "ELITE");
    }
    for (const player of bottomElite) {
      await demotePlayer(player.user_id, "A");
    }

    // A vs B
    const topB = byClass.B.slice(0, PROMOTION_SLOTS.B_TO_A);
    const bottomA = byClass.A.slice(-PROMOTION_SLOTS.B_TO_A);
    
    for (const player of topB) {
      await promotePlayer(player.user_id, "A");
    }
    for (const player of bottomA) {
      await demotePlayer(player.user_id, "B");
    }

    // B vs C
    const topC = byClass.C.slice(0, PROMOTION_SLOTS.C_TO_B);
    const bottomB = byClass.B.slice(-PROMOTION_SLOTS.C_TO_B);
    
    for (const player of topC) {
      await promotePlayer(player.user_id, "B");
    }
    for (const player of bottomB) {
      await demotePlayer(player.user_id, "C");
    }

    // C vs D
    const topD = byClass.D.slice(0, PROMOTION_SLOTS.D_TO_C);
    const bottomC = byClass.C.slice(-PROMOTION_SLOTS.D_TO_C);
    
    for (const player of topD) {
      await promotePlayer(player.user_id, "C");
    }
    for (const player of bottomC) {
      await demotePlayer(player.user_id, "D");
    }

    toast.success("Weekly rankings updated!");
  };

  // Helper: Promote player
  const promotePlayer = async (userId: string, newClass: string) => {
    const newIncome = CLASS_INCOME[newClass as keyof typeof CLASS_INCOME];
    
    await supabase
      .from("profiles")
      .update({ 
        class: newClass,
        hourly_income: newIncome,
      })
      .eq("id", userId);

    const today = new Date();
    const lastWeekStart = getWeekStart(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));

    await supabase
      .from("weekly_rankings")
      .update({
        ending_class: newClass,
        promoted: true,
      })
      .eq("user_id", userId)
      .eq("week_start", lastWeekStart.toISOString().split("T")[0]);
  };

  // Helper: Demote player
  const demotePlayer = async (userId: string, newClass: string) => {
    const newIncome = CLASS_INCOME[newClass as keyof typeof CLASS_INCOME];
    
    await supabase
      .from("profiles")
      .update({ 
        class: newClass,
        hourly_income: newIncome,
      })
      .eq("id", userId);

    const today = new Date();
    const lastWeekStart = getWeekStart(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));

    await supabase
      .from("weekly_rankings")
      .update({
        ending_class: newClass,
        demoted: true,
      })
      .eq("user_id", userId)
      .eq("week_start", lastWeekStart.toISOString().split("T")[0]);
  };

  return {
    initializeWeeklyRanking,
    updateRankingAfterGame,
    runWeeklyPromotionCycle,
  };
};

// Helper functions
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const getWeekEnd = (date: Date): Date => {
  const start = getWeekStart(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
};