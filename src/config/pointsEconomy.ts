/**
 * Points Economy Configuration
 * 
 * Game Classes (5 Total):
 * - ELITE: Top 5 players, 10,000 points/hour
 * - CLASS A: Top 1,000 players, ~400 points/hour (10,000 daily)
 * - CLASS B: Top 20,000 players, ~140 points/hour (10,000 every 3 days)
 * - CLASS C: Top 30,000 players, ~60 points/hour (10,000 weekly)
 * - CLASS D: Unlimited players, ~30 points/hour (10,000 every 2 weeks)
 */

export interface GameClass {
  id: string;
  name: string;
  tier: string;
  limit: number | null; // null = unlimited
  limitDisplay: string;
  earnings: string;
  hourlyRate: number;
  description: string;
  color: string;
  badgeColor: string;
  rarity: 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';
}

// Class capacity limits
export const CLASS_LIMITS = {
  ELITE: 5,
  A: 1000,
  B: 20000,
  C: 30000,
  D: Infinity,
} as const;

// Hourly income per class (points per hour)
export const CLASS_INCOME = {
  ELITE: 10000, // 10,000 per hour
  A: 417,       // ~10,000 per day (10000 / 24)
  B: 139,       // ~10,000 per 3 days (10000 / 72)
  C: 60,        // ~10,000 per week (10000 / 168)
  D: 30,        // ~10,000 per 2 weeks (10000 / 336)
} as const;

// Full class configuration
export const GAME_CLASSES: GameClass[] = [
  {
    id: 'ELITE',
    name: 'ELITE CLASS',
    tier: 'TOP TIER',
    limit: 5,
    limitDisplay: '5 PLAYERS ONLY',
    earnings: '10,000 POINTS PER HOUR',
    hourlyRate: 10000,
    description: 'Highest rank in the entire game.',
    color: 'from-yellow-500 to-amber-600',
    badgeColor: 'bg-gradient-to-r from-yellow-500 to-amber-600',
    rarity: 'legendary',
  },
  {
    id: 'A',
    name: 'CLASS A',
    tier: 'SECOND TIER',
    limit: 1000,
    limitDisplay: '1,000 PLAYERS',
    earnings: '10,000 POINTS DAILY',
    hourlyRate: 417,
    description: 'High-level competitive class.',
    color: 'from-blue-500 to-cyan-600',
    badgeColor: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    rarity: 'epic',
  },
  {
    id: 'B',
    name: 'CLASS B',
    tier: 'THIRD TIER',
    limit: 20000,
    limitDisplay: '20,000 PLAYERS',
    earnings: '10,000 POINTS EVERY 3 DAYS',
    hourlyRate: 139,
    description: 'Mid-tier class for consistent players.',
    color: 'from-purple-500 to-pink-600',
    badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-600',
    rarity: 'rare',
  },
  {
    id: 'C',
    name: 'CLASS C',
    tier: 'FOURTH TIER',
    limit: 30000,
    limitDisplay: '30,000 PLAYERS',
    earnings: '10,000 POINTS WEEKLY',
    hourlyRate: 60,
    description: 'Beginner-friendly competitive class.',
    color: 'from-green-500 to-emerald-600',
    badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
    rarity: 'uncommon',
  },
  {
    id: 'D',
    name: 'CLASS D',
    tier: 'BASE TIER',
    limit: null,
    limitDisplay: 'UNLIMITED PLAYERS',
    earnings: '10,000 POINTS EVERY 2 WEEKS',
    hourlyRate: 30,
    description: 'Starting class for all new players.',
    color: 'from-gray-500 to-slate-600',
    badgeColor: 'bg-gradient-to-r from-gray-500 to-slate-600',
    rarity: 'common',
  },
];

// Weekly promotion/demotion slots
export const PROMOTION_SLOTS = {
  D_TO_C: 1000,   // Top 1000 D players promote to C
  C_TO_B: 500,    // Top 500 C players promote to B
  B_TO_A: 200,    // Top 200 B players promote to A
  A_TO_ELITE: 5,  // Top 5 A players promote to ELITE
} as const;

// Helper functions
export const getClassById = (id: string): GameClass | undefined => {
  return GAME_CLASSES.find(c => c.id === id);
};

export const getClassIncome = (classId: string): number => {
  return CLASS_INCOME[classId as keyof typeof CLASS_INCOME] ?? CLASS_INCOME.D;
};

export const getClassLimit = (classId: string): number => {
  return CLASS_LIMITS[classId as keyof typeof CLASS_LIMITS] ?? CLASS_LIMITS.D;
};

export const formatPoints = (points: number): string => {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toLocaleString();
};

export const calculateDailyEarnings = (hourlyRate: number): number => {
  return hourlyRate * 24;
};

export const calculateWeeklyEarnings = (hourlyRate: number): number => {
  return hourlyRate * 24 * 7;
};
