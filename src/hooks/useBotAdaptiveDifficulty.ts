import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BotGameResult {
  result: 'win' | 'loss' | 'draw';
  moves: number;
  avgAccuracy: number;
  patterns: string[];
}

interface AdaptiveAdjustment {
  depthAdjust: number;
  randomnessAdjust: number;
  blunderAdjust: number;
  thinkTimeAdjust: number;
}

interface TrickPattern {
  pattern: string;
  count: number;
  lastSeen: string;
}

export const useBotAdaptiveDifficulty = () => {
  const { user } = useAuth();
  const [winStreak, setWinStreak] = useState(0);
  const [lossStreak, setLossStreak] = useState(0);
  const [recentGames, setRecentGames] = useState<BotGameResult[]>([]);
  const [knownTricks, setKnownTricks] = useState<TrickPattern[]>([]);

  // Load player history from localStorage
  useEffect(() => {
    if (!user) return;
    
    const stored = localStorage.getItem(`bot_history_${user.id}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setRecentGames(data.games || []);
        setWinStreak(data.winStreak || 0);
        setLossStreak(data.lossStreak || 0);
        setKnownTricks(data.tricks || []);
      } catch (e) {
        console.error('Failed to load bot history:', e);
      }
    }
  }, [user]);

  // Save history to localStorage
  const saveHistory = (games: BotGameResult[], wins: number, losses: number, tricks: TrickPattern[]) => {
    if (!user) return;
    localStorage.setItem(`bot_history_${user.id}`, JSON.stringify({
      games: games.slice(-10), // Keep last 10 games
      winStreak: wins,
      lossStreak: losses,
      tricks
    }));
  };

  // Record game result
  const recordGame = (result: 'win' | 'loss' | 'draw', moves: number, patterns: string[] = []) => {
    const newGame: BotGameResult = {
      result,
      moves,
      avgAccuracy: 0.8, // Simplified for now
      patterns
    };

    const newGames = [...recentGames, newGame].slice(-10);
    
    let newWinStreak = winStreak;
    let newLossStreak = lossStreak;

    if (result === 'win') {
      newWinStreak = winStreak + 1;
      newLossStreak = 0;
    } else if (result === 'loss') {
      newLossStreak = lossStreak + 1;
      newWinStreak = 0;
    } else {
      newWinStreak = 0;
      newLossStreak = 0;
    }

    // Update trick patterns
    const updatedTricks = [...knownTricks];
    patterns.forEach(pattern => {
      const existing = updatedTricks.find(t => t.pattern === pattern);
      if (existing) {
        existing.count++;
        existing.lastSeen = new Date().toISOString();
      } else {
        updatedTricks.push({
          pattern,
          count: 1,
          lastSeen: new Date().toISOString()
        });
      }
    });

    setRecentGames(newGames);
    setWinStreak(newWinStreak);
    setLossStreak(newLossStreak);
    setKnownTricks(updatedTricks);
    saveHistory(newGames, newWinStreak, newLossStreak, updatedTricks);
  };

  // Calculate adaptive difficulty adjustment
  const getAdaptiveAdjustment = (): AdaptiveAdjustment => {
    let depthAdjust = 0;
    let randomnessAdjust = 0;
    let blunderAdjust = 0;
    let thinkTimeAdjust = 0;

    // Win streak: make bot stronger
    if (winStreak >= 2) {
      depthAdjust = Math.min(winStreak * 2, 4);
      randomnessAdjust = -0.1;
      blunderAdjust = -0.1;
      thinkTimeAdjust = 200;
    }

    // Loss streak: make bot weaker
    if (lossStreak >= 2) {
      depthAdjust = -Math.min(lossStreak * 2, 4);
      randomnessAdjust = 0.1;
      blunderAdjust = 0.05;
      thinkTimeAdjust = -200;
    }

    // Quick wins: player dominating
    const quickWins = recentGames.filter(g => g.result === 'win' && g.moves < 25).length;
    if (quickWins >= 2) {
      depthAdjust += 2;
      randomnessAdjust -= 0.05;
    }

    // Too many draws: add bias
    const recentDraws = recentGames.slice(-5).filter(g => g.result === 'draw').length;
    if (recentDraws >= 3) {
      randomnessAdjust += 0.1;
    }

    return {
      depthAdjust: Math.max(-4, Math.min(4, depthAdjust)),
      randomnessAdjust: Math.max(-0.15, Math.min(0.15, randomnessAdjust)),
      blunderAdjust: Math.max(-0.1, Math.min(0.1, blunderAdjust)),
      thinkTimeAdjust: Math.max(-300, Math.min(300, thinkTimeAdjust))
    };
  };

  // Check if player is using known trick
  const detectTrick = (fen: string, lastMoves: string[]): string | null => {
    // Scholar's mate pattern
    if (lastMoves.join('').includes('e4e5Qh5Bc4Qxf7')) {
      return 'scholars_mate';
    }

    // Early queen attack
    if (lastMoves.length < 8 && lastMoves.some(m => m.startsWith('Q'))) {
      return 'early_queen_attack';
    }

    // Repeated opening pattern
    const openingSignature = lastMoves.slice(0, 6).join(',');
    const repeatedOpening = knownTricks.find(t => 
      t.pattern === openingSignature && t.count >= 2
    );
    if (repeatedOpening) {
      return 'repeated_opening';
    }

    return null;
  };

  return {
    recordGame,
    getAdaptiveAdjustment,
    detectTrick,
    winStreak,
    lossStreak,
    knownTricks: knownTricks.slice(0, 5) // Return top 5 known tricks
  };
};
