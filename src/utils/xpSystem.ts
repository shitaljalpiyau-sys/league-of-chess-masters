/**
 * XP & Level System
 * Formula: TotalXP = 60 * level * 1.35 (rounded)
 */

export interface LevelTier {
  name: string;
  levelRange: [number, number];
  material: string;
  color: string;
  badgeGradient: string;
}

export const LEVEL_TIERS: LevelTier[] = [
  {
    name: "Beginner",
    levelRange: [1, 10],
    material: "Bronze",
    color: "hsl(30, 70%, 50%)",
    badgeGradient: "from-amber-700 to-amber-500",
  },
  {
    name: "Intermediate",
    levelRange: [11, 20],
    material: "Silver",
    color: "hsl(0, 0%, 70%)",
    badgeGradient: "from-gray-400 to-gray-200",
  },
  {
    name: "Advanced",
    levelRange: [21, 30],
    material: "Gold",
    color: "hsl(45, 90%, 55%)",
    badgeGradient: "from-yellow-600 to-yellow-400",
  },
  {
    name: "Expert",
    levelRange: [31, 40],
    material: "Platinum",
    color: "hsl(200, 30%, 80%)",
    badgeGradient: "from-cyan-400 to-blue-300",
  },
  {
    name: "Grandmaster",
    levelRange: [41, 50],
    material: "Diamond",
    color: "hsl(280, 70%, 70%)",
    badgeGradient: "from-purple-500 to-pink-400",
  },
];

/**
 * Calculate total XP required for a given level
 * Formula: TotalXP = 60 * level * 1.35
 */
export const calculateXPForLevel = (level: number): number => {
  return Math.round(60 * level * 1.35);
};

/**
 * Calculate XP required to reach next level from current level
 */
export const calculateXPToNextLevel = (currentLevel: number): number => {
  return calculateXPForLevel(currentLevel + 1);
};

/**
 * Get tier information for a given level
 */
export const getTierForLevel = (level: number): LevelTier => {
  const tier = LEVEL_TIERS.find(
    (t) => level >= t.levelRange[0] && level <= t.levelRange[1]
  );
  return tier || LEVEL_TIERS[LEVEL_TIERS.length - 1]; // Return Grandmaster if > 50
};

/**
 * Calculate level and remaining XP from total XP
 */
export const calculateLevelFromXP = (totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number } => {
  let level = 1;
  let accumulatedXP = 0;
  
  // Find the level by accumulating XP requirements
  while (accumulatedXP + calculateXPForLevel(level) <= totalXP && level < 50) {
    accumulatedXP += calculateXPForLevel(level);
    level++;
  }
  
  const currentLevelXP = totalXP - accumulatedXP;
  const nextLevelXP = calculateXPForLevel(level);
  
  return { level, currentLevelXP, nextLevelXP };
};

/**
 * XP rewards for match results
 */
export const XP_REWARDS = {
  WIN: 18,
  DRAW: 6,
  LOSS: 0,
};

/**
 * Optional bonus XP events
 */
export const XP_BONUS = {
  FAST_CHECKMATE: 2, // < 25 moves
  MINOR_PIECE_CHECKMATE: 2, // Checkmate with knight or bishop
  DRAW_FROM_LOSING: 1, // Draw when in losing position
  WIN_STREAK_5: 4, // 5 wins in a row
};

/**
 * Calculate XP to award based on match result
 */
export const calculateMatchXP = (
  result: "win" | "draw" | "loss",
  bonuses: {
    fastCheckmate?: boolean;
    minorPieceCheckmate?: boolean;
    drawFromLosing?: boolean;
    fiveWinStreak?: boolean;
  } = {}
): number => {
  let xp = XP_REWARDS[result.toUpperCase() as keyof typeof XP_REWARDS];
  
  if (bonuses.fastCheckmate) xp += XP_BONUS.FAST_CHECKMATE;
  if (bonuses.minorPieceCheckmate) xp += XP_BONUS.MINOR_PIECE_CHECKMATE;
  if (bonuses.drawFromLosing) xp += XP_BONUS.DRAW_FROM_LOSING;
  if (bonuses.fiveWinStreak) xp += XP_BONUS.WIN_STREAK_5;
  
  return xp;
};

/**
 * Calculate win rate percentage
 */
export const calculateWinRate = (gamesWon: number, gamesPlayed: number): number => {
  if (gamesPlayed === 0) return 0;
  return Math.round((gamesWon / gamesPlayed) * 100);
};
