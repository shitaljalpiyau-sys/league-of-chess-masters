import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Chess } from 'chess.js';

interface LearningData {
  id: string;
  user_id: string;
  openings_used: string[];
  blunder_squares: string[];
  weak_squares: string[];
  preferred_moves: string[];
  losing_patterns: string[];
  win_patterns: string[];
  average_attack_direction: 'kingside' | 'center' | 'queenside';
  learning_enabled: boolean;
}

export const useMasterLearning = () => {
  const [learningData, setLearningData] = useState<LearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch learning data
  const fetchLearningData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('master_learning')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching learning data:', error);
      setLoading(false);
      return;
    }

    if (!data) {
      // Create initial learning data
      const { data: newData, error: createError } = await supabase
        .from('master_learning')
        .insert({
          user_id: user.id,
          openings_used: [],
          blunder_squares: [],
          weak_squares: [],
          preferred_moves: [],
          losing_patterns: [],
          win_patterns: [],
          average_attack_direction: 'center',
          learning_enabled: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating learning data:', createError);
      } else {
        setLearningData(newData as LearningData);
      }
    } else {
      setLearningData(data as LearningData);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLearningData();
  }, [fetchLearningData]);

  // Detect opening from first 6 moves
  const detectOpening = useCallback((moves: string[]): string => {
    if (moves.length < 6) return 'unknown';
    
    const opening = moves.slice(0, 6).join(' ');
    
    // Common opening patterns
    if (opening.includes('e4 e5')) return 'open_game';
    if (opening.includes('d4 d5')) return 'closed_game';
    if (opening.includes('e4 c5')) return 'sicilian';
    if (opening.includes('e4 e6')) return 'french';
    if (opening.includes('e4 c6')) return 'caro_kann';
    if (opening.includes('d4 Nf6')) return 'indian_defense';
    if (opening.includes('Nf3 Nf6')) return 'reti';
    
    return 'other';
  }, []);

  // Analyze attack direction
  const analyzeAttackDirection = useCallback((moves: string[]): 'kingside' | 'center' | 'queenside' => {
    let kingsideCount = 0;
    let queensideCount = 0;
    let centerCount = 0;

    const kingsideSquares = ['f', 'g', 'h'];
    const queensideSquares = ['a', 'b', 'c'];
    const centerSquares = ['d', 'e'];

    moves.forEach(move => {
      const file = move.charAt(0);
      if (kingsideSquares.includes(file)) kingsideCount++;
      else if (queensideSquares.includes(file)) queensideCount++;
      else if (centerSquares.includes(file)) centerCount++;
    });

    if (kingsideCount > queensideCount && kingsideCount > centerCount) return 'kingside';
    if (queensideCount > kingsideCount && queensideCount > centerCount) return 'queenside';
    return 'center';
  }, []);

  // Record game data
  const recordGameData = useCallback(async (
    moves: string[],
    blunderSquares: string[],
    weakPieces: string[],
    result: 'win' | 'loss' | 'draw'
  ) => {
    if (!user || !learningData || !learningData.learning_enabled) return;

    const opening = detectOpening(moves);
    const attackDirection = analyzeAttackDirection(moves);
    
    const pattern = moves.slice(-5).join(' '); // Last 5 moves as pattern

    const updates: Partial<LearningData> = {
      openings_used: [...new Set([...learningData.openings_used, opening])].slice(-20),
      blunder_squares: [...new Set([...learningData.blunder_squares, ...blunderSquares])].slice(-30),
      weak_squares: [...new Set([...learningData.weak_squares, ...weakPieces])].slice(-30),
      preferred_moves: [...learningData.preferred_moves, ...moves].slice(-50),
      average_attack_direction: attackDirection
    };

    if (result === 'loss') {
      updates.losing_patterns = [...new Set([...learningData.losing_patterns, pattern])].slice(-15);
    } else if (result === 'win') {
      updates.win_patterns = [...new Set([...learningData.win_patterns, pattern])].slice(-15);
    }

    const { error } = await supabase
      .from('master_learning')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating learning data:', error);
    } else {
      await fetchLearningData();
    }
  }, [user, learningData, detectOpening, analyzeAttackDirection, fetchLearningData]);

  // Toggle learning
  const toggleLearning = useCallback(async (enabled: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('master_learning')
      .update({ learning_enabled: enabled })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error toggling learning:', error);
    } else {
      await fetchLearningData();
    }
  }, [user, fetchLearningData]);

  // Get AI strategy hints
  const getAIHints = useCallback(() => {
    if (!learningData || !learningData.learning_enabled) return null;

    return {
      targetSquares: learningData.weak_squares,
      avoidOpenings: learningData.openings_used,
      exploitPatterns: learningData.losing_patterns,
      attackDirection: learningData.average_attack_direction === 'kingside' ? 'queenside' : 
                       learningData.average_attack_direction === 'queenside' ? 'kingside' : 'center'
    };
  }, [learningData]);

  return {
    learningData,
    loading,
    recordGameData,
    toggleLearning,
    getAIHints,
    refreshLearning: fetchLearningData
  };
};
