import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Chess } from 'chess.js';

interface LearningPattern {
  id: string;
  user_id: string;
  opening_code: string;
  move_sequence: string;
  frequency: number;
  losses_with_sequence: number;
  wins_with_sequence: number;
  blunders_detected: number;
  last_used_at: string;
}

interface AdaptiveHints {
  baseDepth: number;
  punishFactor: number;
  denyList: string[];
  weakSquares: string[];
  targetOpening: string | null;
}

export const useMasterLearning = () => {
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [learningEnabled, setLearningEnabled] = useState(true);
  const { user } = useAuth();

  // Fetch all learning patterns
  const fetchPatterns = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('master_learning')
      .select('*')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Error fetching learning patterns:', error);
    } else {
      setPatterns(data || []);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  // Detect ECO opening code from moves
  const detectOpening = useCallback((moves: string[]): string => {
    if (moves.length < 4) return 'UNKNOWN';
    
    const sequence = moves.slice(0, 4).join(' ');
    
    // Common ECO patterns
    if (sequence.includes('e4 e5 Nf3 Nc6')) return 'C50'; // Italian Game
    if (sequence.includes('e4 c5')) return 'B20'; // Sicilian Defense
    if (sequence.includes('d4 d5')) return 'D00'; // Queen's Pawn Game
    if (sequence.includes('e4 e6')) return 'C00'; // French Defense
    if (sequence.includes('e4 c6')) return 'B10'; // Caro-Kann Defense
    if (sequence.includes('d4 Nf6 c4')) return 'E00'; // Indian Defense
    if (sequence.includes('Nf3 Nf6')) return 'A04'; // Reti Opening
    
    return 'OTHER';
  }, []);

  // Record game pattern
  const recordPattern = useCallback(async (
    moves: string[],
    blunderSquares: string[],
    result: 'win' | 'loss' | 'draw'
  ) => {
    if (!user || !learningEnabled || moves.length < 4) return;

    const opening = detectOpening(moves);
    const moveSequence = moves.slice(0, 4).join(' ');

    // Check if pattern exists
    const { data: existing } = await supabase
      .from('master_learning')
      .select('*')
      .eq('user_id', user.id)
      .eq('move_sequence', moveSequence)
      .maybeSingle();

    if (existing) {
      // Update existing pattern
      const { error } = await supabase
        .from('master_learning')
        .update({
          frequency: existing.frequency + 1,
          losses_with_sequence: result === 'loss' ? existing.losses_with_sequence + 1 : existing.losses_with_sequence,
          wins_with_sequence: result === 'win' ? existing.wins_with_sequence + 1 : existing.wins_with_sequence,
          blunders_detected: existing.blunders_detected + blunderSquares.length,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) console.error('Error updating pattern:', error);
    } else {
      // Create new pattern
      const { error } = await supabase
        .from('master_learning')
        .insert({
          user_id: user.id,
          opening_code: opening,
          move_sequence: moveSequence,
          frequency: 1,
          losses_with_sequence: result === 'loss' ? 1 : 0,
          wins_with_sequence: result === 'win' ? 1 : 0,
          blunders_detected: blunderSquares.length
        });

      if (error) console.error('Error creating pattern:', error);
    }

    await fetchPatterns();
  }, [user, learningEnabled, detectOpening, fetchPatterns]);

  // Get adaptive hints for Master AI
  const getAdaptiveHints = useCallback((currentMoves: string[]): AdaptiveHints => {
    if (!learningEnabled || patterns.length === 0) {
      return {
        baseDepth: 0,
        punishFactor: 0,
        denyList: [],
        weakSquares: [],
        targetOpening: null
      };
    }

    const currentSequence = currentMoves.slice(0, 4).join(' ');
    const currentOpening = detectOpening(currentMoves);

    // Find repeated tricks (patterns that beat Master 2+ times)
    const denyList = patterns
      .filter(p => p.losses_with_sequence >= 2)
      .map(p => p.move_sequence);

    // Calculate punish factor
    let punishFactor = 0;
    
    // Check if current sequence is a repeated trick
    const repeatedTrick = patterns.find(p => p.move_sequence === currentSequence && p.losses_with_sequence >= 2);
    if (repeatedTrick) {
      punishFactor += 4; // Significantly increase depth for known tricks
    }

    // Check if player frequently uses this opening and wins
    const openingPattern = patterns.find(p => p.opening_code === currentOpening);
    if (openingPattern && openingPattern.wins_with_sequence > openingPattern.losses_with_sequence) {
      punishFactor += 2; // Increase depth against successful openings
    }

    // Add punish factor for detected blunders
    const blunderProne = patterns.filter(p => p.blunders_detected >= 3).length;
    if (blunderProne > 0) {
      punishFactor += 1;
    }

    // Identify weak squares (squares where player blunders most)
    const weakSquares: string[] = [];
    // This would be enhanced with actual square tracking in a full implementation

    return {
      baseDepth: 0,
      punishFactor,
      denyList,
      weakSquares,
      targetOpening: openingPattern ? openingPattern.opening_code : null
    };
  }, [learningEnabled, patterns, detectOpening]);

  // Toggle learning
  const toggleLearning = useCallback((enabled: boolean) => {
    setLearningEnabled(enabled);
  }, []);

  // Clear all learning data
  const clearLearning = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from('master_learning')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing learning data:', error);
    } else {
      await fetchPatterns();
    }
  }, [user, fetchPatterns]);

  return {
    patterns,
    loading,
    learningEnabled,
    recordPattern,
    getAdaptiveHints,
    toggleLearning,
    clearLearning,
    refreshPatterns: fetchPatterns
  };
};
