import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square, Move } from 'chess.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useBotAdaptiveDifficulty } from '@/hooks/useBotAdaptiveDifficulty';
import { useMasterProgress } from '@/hooks/useMasterProgress';

type Power = number; // 0-100 continuous power level

// Move evaluation cache (FEN → {move, score, timestamp})
interface CachedEvaluation {
  bestMove: Move;
  score: number;
  timestamp: number;
}

const moveCache = new Map<string, CachedEvaluation>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 20;

// Performance logging
interface PerformanceLog {
  moveTime: number;
  depth: number;
  power: number;
  cacheHit: boolean;
  lightweight: boolean;
}

const performanceLog: PerformanceLog[] = [];
const powerHistory: { power: number; level: number; timestamp: number }[] = [];

// Export performance metrics getter
export const getPerformanceMetrics = () => {
  const recentLogs = performanceLog.slice(-20);
  
  // Average think time
  const avgThinkTime = recentLogs.length > 0
    ? recentLogs.reduce((sum, log) => sum + log.moveTime, 0) / recentLogs.length
    : 0;
  
  // Cache hit rate
  const cacheHits = recentLogs.filter(log => log.cacheHit).length;
  const cacheHitRate = recentLogs.length > 0 ? (cacheHits / recentLogs.length) * 100 : 0;
  
  // Lightweight rate
  const lightweightMoves = recentLogs.filter(log => log.lightweight).length;
  const lightweightRate = recentLogs.length > 0 ? (lightweightMoves / recentLogs.length) * 100 : 0;
  
  // Depth distribution
  const depthMap = new Map<number, number>();
  recentLogs.forEach(log => {
    depthMap.set(log.depth, (depthMap.get(log.depth) || 0) + 1);
  });
  const depthDistribution = Array.from(depthMap.entries())
    .map(([depth, count]) => ({ depth, count }))
    .sort((a, b) => a.depth - b.depth);
  
  return {
    avgThinkTime,
    cacheHitRate,
    lightweightRate,
    depthDistribution,
    powerHistory: [...powerHistory]
  };
};

// Piece values for evaluation
const PIECE_VALUES: { [key: string]: number } = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000
};

// Positional tables
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 27, 27, 10,  5,  5,
  0,  0,  0, 25, 25,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-25,-25, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -50,-40,-20,-30,-30,-20,-40,-50
];

// Professional 5-parameter difficulty system (Chess.com / Lichess style)
interface DifficultyConfig {
  depth: number;
  multipv: number;
  randomness: number;
  blunderChance: number;
  thinkTime: [number, number]; // min, max milliseconds
  eloRange: string;
}

// Convert power level (0-100) to difficulty configuration
const getPowerConfig = (power: Power, masterLevel: number = 1): DifficultyConfig => {
  // Non-linear power scaling for more dramatic differences
  const normalizedPower = power / 100;
  const scaledPower = Math.pow(normalizedPower, 1.5); // Non-linear curve
  
  // Dynamic depth scaling: combines POWER + MASTER LEVEL
  // depth = floor(power / 5) + floor(master_level / 4) + baseDepth
  const baseDepth = 2;
  const powerDepth = Math.floor(power / 5);
  const masterDepth = Math.floor(masterLevel / 4);
  const depth = Math.max(2, Math.min(24, baseDepth + powerDepth + masterDepth));
  
  // MultiPV: 4 at low power, 1 at high power
  const multipv = power <= 33 ? 4 : power <= 66 ? 3 : 1;
  
  // Randomness: high at low power, zero at high power
  const randomness = Math.max(0, 0.6 - (scaledPower * 0.6));
  
  // Blunder chance: high at low power, zero above 50
  const blunderChance = power <= 50 ? Math.max(0, 0.45 - (power / 50) * 0.45) : 0;
  
  // Think time: scales from 100-250ms to 1500-3000ms
  // Reduce randomness for high-level Masters (more calm and controlled)
  const varianceReduction = Math.min(0.7, masterLevel * 0.02);
  const baseMinThink = 100 + scaledPower * 1400;
  const baseMaxThink = 250 + scaledPower * 2750;
  const minThink = Math.round(baseMinThink);
  const maxThink = Math.round(baseMinThink + (baseMaxThink - baseMinThink) * (1 - varianceReduction));
  
  return {
    depth,
    multipv,
    randomness,
    blunderChance,
    thinkTime: [minThink, maxThink],
    eloRange: `Power ${power}`
  };
};

// Calculate XP reward with smooth exponential scaling (15 to 100)
export const getPowerXPReward = (power: Power): number => {
  const baseXP = 15;
  const maxXP = 100;
  const normalizedPower = power / 100;
  // Exponential curve: XP = 15 + (85 * (power/100)^1.8)
  const scaledXP = baseXP + (maxXP - baseXP) * Math.pow(normalizedPower, 1.8);
  return Math.round(scaledXP);
};

// Get power range label
export const getPowerRange = (power: Power): string => {
  if (power <= 33) return 'Easy';
  if (power <= 66) return 'Medium';
  return 'Hard';
};

export const useBotGame = (power: Power = 50) => {
  const [chess, setChess] = useState(new Chess());
  const [playerColor] = useState<'white' | 'black'>('white');
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square; isOpponent: boolean } | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const hasAwardedXP = useRef(false);
  const { user, refreshProfile } = useAuth();
  const { awardMatchXP } = useXPSystem();
  const { recordGame, getAdaptiveAdjustment, detectTrick, winStreak, lossStreak } = useBotAdaptiveDifficulty();
  const { awardMasterXP, getMasterLevelBoost } = useMasterProgress();

  // Enhanced board evaluation with positional awareness
  const evaluateBoard = useCallback((game: Chess): number => {
    let totalEval = 0;
    const board = game.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = board[i][j];
        if (square) {
          const piece = square.type;
          const color = square.color;
          let value = PIECE_VALUES[piece];

          // Apply positional bonuses
          if (piece === 'p') {
            value += color === 'w' ? PAWN_TABLE[i * 8 + j] : PAWN_TABLE[(7 - i) * 8 + j];
          } else if (piece === 'n') {
            value += color === 'w' ? KNIGHT_TABLE[i * 8 + j] : KNIGHT_TABLE[(7 - i) * 8 + j];
          }

          totalEval += color === 'b' ? value : -value;
        }
      }
    }

    // Bonus for mobility (number of legal moves)
    const mobility = game.moves().length;
    totalEval += game.turn() === 'b' ? mobility * 10 : -mobility * 10;

    return totalEval;
  }, []);

  // Minimax with alpha-beta pruning and move ordering
  const minimax = useCallback((
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    startTime: number,
    timeLimit: number
  ): number => {
    // Time limit check
    if (Date.now() - startTime > timeLimit) {
      return evaluateBoard(game);
    }

    if (depth === 0 || game.isGameOver()) {
      return evaluateBoard(game);
    }

    const moves = game.moves({ verbose: true });

    // Move ordering: prioritize captures
    moves.sort((a, b) => {
      const aCapture = a.captured ? 1 : 0;
      const bCapture = b.captured ? 1 : 0;
      return bCapture - aCapture;
    });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const testGame = new Chess(game.fen());
        testGame.move(move);
        const evaluation = minimax(testGame, depth - 1, alpha, beta, false, startTime, timeLimit);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const testGame = new Chess(game.fen());
        testGame.move(move);
        const evaluation = minimax(testGame, depth - 1, alpha, beta, true, startTime, timeLimit);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }, [evaluateBoard]);

  // Cleanup expired cache entries
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    for (const [fen, cached] of moveCache.entries()) {
      if (now - cached.timestamp > CACHE_TTL) {
        moveCache.delete(fen);
      }
    }
    // Limit cache size
    if (moveCache.size > MAX_CACHE_SIZE) {
      const oldestKey = Array.from(moveCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      moveCache.delete(oldestKey);
    }
  }, []);

  // Lightweight evaluation for low power (quick mode)
  const quickEvaluate = useCallback((game: Chess): Move | null => {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    // Simple heuristic: prioritize captures and center control
    const scoredMoves = moves.map(move => {
      let score = Math.random() * 10; // Add randomness
      if (move.captured) score += PIECE_VALUES[move.captured];
      if (['e4', 'e5', 'd4', 'd5'].includes(move.to)) score += 20; // Center control
      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }, []);

  // Professional move selection with caching, lightweight mode, and performance optimizations
  const getBotMove = useCallback(async (game: Chess): Promise<{ move: Move | null; cacheHit: boolean }> => {
    const startCalcTime = Date.now();
    const currentFen = game.fen();
    const masterLevel = getMasterLevelBoost().depthBoost * 4 + 1; // Approximate master level

    // Check cache first
    const cached = moveCache.get(currentFen);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('🎯 Cache hit for position - cacheHit=true');
      
      // Log cache hit
      performanceLog.push({
        moveTime: 0,
        depth: 0,
        power,
        cacheHit: true,
        lightweight: false
      });
      if (performanceLog.length > 50) performanceLog.shift();
      
      return { move: cached.bestMove, cacheHit: true };
    }

    // Cleanup old cache entries
    cleanupCache();

    const baseConfig = getPowerConfig(power, masterLevel);
    const adaptive = getAdaptiveAdjustment();
    const masterBoost = getMasterLevelBoost();
    
    // Apply adaptive adjustments + Master level boost
    const config = {
      depth: Math.max(1, Math.min(24, baseConfig.depth + adaptive.depthAdjust + masterBoost.depthBoost)),
      multipv: baseConfig.multipv,
      randomness: Math.max(0, Math.min(1, baseConfig.randomness + adaptive.randomnessAdjust)),
      blunderChance: Math.max(0.01, Math.min(1, baseConfig.blunderChance + adaptive.blunderAdjust - masterBoost.blunderReduction)),
      thinkTime: [
        Math.max(300, baseConfig.thinkTime[0] + adaptive.thinkTimeAdjust - (masterBoost.speedBoost * 1000)),
        Math.max(500, baseConfig.thinkTime[1] + adaptive.thinkTimeAdjust - (masterBoost.speedBoost * 1000))
      ] as [number, number],
      eloRange: baseConfig.eloRange
    };

    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    // LIGHTWEIGHT MODE: Quick evaluation for low power
    if (power < 40) {
      const quickMove = quickEvaluate(game);
      if (quickMove) {
        // Still apply think time for realism
        const thinkTime = config.thinkTime[0] + Math.random() * (config.thinkTime[1] - config.thinkTime[0]);
        await new Promise(resolve => setTimeout(resolve, thinkTime));
        
        // Log performance
        const calculationTime = Date.now() - startCalcTime;
        performanceLog.push({
          moveTime: calculationTime,
          depth: 0,
          power,
          cacheHit: false,
          lightweight: true
        });
        if (performanceLog.length > 50) performanceLog.shift();
        
        return { move: quickMove, cacheHit: false };
      }
    }

    // ANTI-TRICK: Detect player patterns
    const history = game.history();
    const trick = detectTrick(game.fen(), history);
    
    if (trick) {
      console.log('🛡️ Trick detected:', trick, '- Bot adapting strategy');
      // Increase depth for trick prevention
      config.depth = Math.min(config.depth + 4, 28);
      config.blunderChance = 0;
    }

    // Generate 2 candidate moves for anti-lag fallback
    const candidateMoves: Move[] = [];
    if (moves.length > 0) {
      candidateMoves.push(moves[0]);
      if (moves.length > 1) candidateMoves.push(moves[1]);
    }

    // Simulate human-like thinking time
    const baseThinkTime = config.thinkTime[0] + Math.random() * (config.thinkTime[1] - config.thinkTime[0]);
    const thinkTime = Math.random() < 0.1 ? baseThinkTime * 2 : baseThinkTime;
    await new Promise(resolve => setTimeout(resolve, thinkTime));

    const startTime = Date.now();
    const timeLimit = Math.min(3000, config.thinkTime[1]); // Max 3 seconds per move

    // Evaluate all moves and get top N (multipv)
    interface ScoredMove {
      move: Move;
      score: number;
    }
    
    const scoredMoves: ScoredMove[] = [];

    // Move ordering: evaluate captures first for better pruning
    moves.sort((a, b) => {
      const aScore = a.captured ? PIECE_VALUES[a.captured] : 0;
      const bScore = b.captured ? PIECE_VALUES[b.captured] : 0;
      return bScore - aScore;
    });

    for (const move of moves) {
      if (Date.now() - startTime > timeLimit) break;

      const testGame = new Chess(game.fen());
      testGame.move(move);
      const score = minimax(testGame, config.depth - 1, -Infinity, Infinity, false, startTime, timeLimit);

      scoredMoves.push({ move, score });
    }

    // Sort by score (best first)
    scoredMoves.sort((a, b) => b.score - a.score);

    // DEBUG LOGGING (adaptive difficulty feedback)
    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 Bot Analysis:', {
        basePower: power,
        adaptedDepth: config.depth,
        randomness: config.randomness,
        blunderChance: config.blunderChance,
        winStreak,
        lossStreak,
        topMoves: scoredMoves.slice(0, 3).map(sm => ({ 
          move: `${sm.move.from}-${sm.move.to}`, 
          score: sm.score 
        })),
        trickDetected: trick || 'none'
      });
    }

    // BLUNDER INJECTION (Easy/Medium modes)
    if (config.blunderChance > 0 && Math.random() < config.blunderChance) {
      // Intentionally pick a suboptimal move
      const weakMoves = scoredMoves.slice(Math.floor(scoredMoves.length * 0.4));
      if (weakMoves.length > 0) {
        const blunderMove = weakMoves[Math.floor(Math.random() * weakMoves.length)];
        console.log('💥 Blunder injected:', `${blunderMove.move.from}-${blunderMove.move.to}`);
        return { move: blunderMove.move, cacheHit: false };
      }
    }

    // MULTIPV SELECTION (top-moves pool)
    const topMoves = scoredMoves.slice(0, config.multipv);
    
    // Apply randomness to selection from top moves
    if (config.randomness > 0 && Math.random() < config.randomness && topMoves.length > 1) {
      const randomIndex = Math.floor(Math.random() * topMoves.length);
      return { move: topMoves[randomIndex].move, cacheHit: false };
    }

    // Anti-lag fallback: if calculation took too long, use best candidate
    const calculationTime = Date.now() - startCalcTime;
    if (calculationTime > 3000 && candidateMoves.length > 0) {
      console.log('⚠️ Calculation timeout, using fallback move');
      const fallbackMove = candidateMoves[0];
      // Cache the fallback
      moveCache.set(currentFen, {
        bestMove: fallbackMove,
        score: 0,
        timestamp: Date.now()
      });
      return { move: fallbackMove, cacheHit: false };
    }

    // Default: return best move
    const bestMove = scoredMoves[0]?.move || moves[0];
    
    // Cache the result
    if (bestMove) {
      moveCache.set(currentFen, {
        bestMove,
        score: scoredMoves[0]?.score || 0,
        timestamp: Date.now()
      });
    }

    // Performance logging
    performanceLog.push({
      moveTime: calculationTime,
      depth: config.depth,
      power,
      cacheHit: false,
      lightweight: false
    });
    if (performanceLog.length > 50) performanceLog.shift(); // Keep last 50 moves
    
    // Track power + level history
    if (powerHistory.length === 0 || powerHistory[powerHistory.length - 1].power !== power) {
      powerHistory.push({
        power,
        level: masterLevel,
        timestamp: Date.now()
      });
      if (powerHistory.length > 20) powerHistory.shift(); // Keep last 20 entries
    }

    // Log average think time
    const avgTime = performanceLog.reduce((sum, log) => sum + log.moveTime, 0) / performanceLog.length;
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance:', {
        lastMoveTime: calculationTime,
        avgMoveTime: Math.round(avgTime),
        cacheSize: moveCache.size
      });
    }

    return { move: bestMove, cacheHit: false };
  }, [power, minimax, getAdaptiveAdjustment, detectTrick, winStreak, lossStreak, getMasterLevelBoost, cleanupCache, quickEvaluate]);

  // Bot move execution (non-blocking UI)
  const makeBotMove = useCallback(async (currentGame: Chess) => {
    if (currentGame.isGameOver()) return currentGame;

    setIsThinking(true);
    setCacheHit(false); // Reset cache hit state

    try {
      // Get bot move (async, won't block UI)
      const result = await getBotMove(currentGame);
      
      if (result.move) {
        // Apply move
        currentGame.move(result.move);
        
        // Update last move state for highlighting (RED for bot moves)
        setLastMove({ 
          from: result.move.from as Square, 
          to: result.move.to as Square,
          isOpponent: true // Bot moves are opponent moves (RED)
        });

        // Set cache hit state for animation
        if (result.cacheHit) {
          setCacheHit(true);
          // Auto-hide after 1.5s
          setTimeout(() => setCacheHit(false), 1500);
        }
      }
    } catch (error) {
      console.error('Bot move error:', error);
    }

    setIsThinking(false);
    return currentGame;
  }, [getBotMove]);

  // Player move handler
  const makePlayerMove = useCallback(async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
    if (isThinking || chess.isGameOver() || chess.turn() !== playerColor[0]) {
      return false;
    }

    try {
      const newGame = new Chess(chess.fen());
      const move = newGame.move({ from, to, promotion: promotion || 'q' });

      if (!move) return false;

      // Update last move state for highlighting (BLUE for player moves)
      setLastMove({ 
        from: move.from as Square, 
        to: move.to as Square,
        isOpponent: false // Player moves are not opponent moves (BLUE)
      });

      setChess(newGame);

      if (newGame.isGameOver()) return true;

      // Bot's turn
      if (newGame.turn() === 'b') {
        const gameAfterBot = await makeBotMove(newGame);
        setChess(new Chess(gameAfterBot.fen()));
      }

      return true;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  }, [chess, playerColor, isThinking, makeBotMove]);

  const resetGame = useCallback(() => {
    setChess(new Chess());
    setIsThinking(false);
    setLastMove(null);
    setGameId(null);
    hasAwardedXP.current = false; // Reset XP flag for new game
    
    // Cleanup: clear cache and performance logs
    moveCache.clear();
    performanceLog.length = 0;
  }, []);

  const getGameStatus = useCallback(() => {
    if (chess.isCheckmate()) return 'checkmate';
    if (chess.isDraw()) return 'draw';
    if (chess.isStalemate()) return 'stalemate';
    if (chess.isCheck()) return 'check';
    return 'active';
  }, [chess]);

  // Save game to history
  useEffect(() => {
    const saveGameToHistory = async () => {
      if (!chess.isGameOver() || !user || hasAwardedXP.current) return;
      
      const result = chess.isCheckmate() 
        ? (chess.turn() === 'w' ? 'black_wins' : 'white_wins')
        : 'draw';
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, rating, class, games_played, games_won')
        .eq('id', user.id)
        .single();
      
      if (!profile) return;
      
      const playerWon = (playerColor === 'white' && result === 'white_wins') || 
                        (playerColor === 'black' && result === 'black_wins');
      const isDraw = result === 'draw';
      const moveCount = chess.history().length;
      const isFastCheckmate = playerWon && moveCount < 25;
      
      const updatedStats: any = {
        games_played: profile.games_played + 1,
      };
      
      if (playerWon) {
        updatedStats.games_won = profile.games_won + 1;
      }
      
      await supabase
        .from('profiles')
        .update(updatedStats)
        .eq('id', user.id);
      
      await refreshProfile();
      
      // Record game for adaptive difficulty
      recordGame(
        playerWon ? 'win' : isDraw ? 'draw' : 'loss',
        moveCount,
        chess.history().slice(0, 6)
      );
      
      // Mark XP as awarded BEFORE showing popup to prevent loops
      hasAwardedXP.current = true;
      
      // Award XP based on power level (only on win)
      setTimeout(() => {
        if (playerWon) {
          const xpReward = getPowerXPReward(power);
          awardMatchXP('win', { fastCheckmate: isFastCheckmate, customXP: xpReward });
          // Award Master XP
          awardMasterXP(power, true);
        } else {
          // Award Master XP even on loss (but 0 XP)
          awardMasterXP(power, false);
        }
      }, 500);
      
      const fenHistory: string[] = [new Chess().fen()];
      const tempChess = new Chess();
      const history = chess.history();
      history.forEach(move => {
        tempChess.move(move);
        fenHistory.push(tempChess.fen());
      });
      
      const matchId = crypto.randomUUID();
      setGameId(matchId);
      
      await supabase.from('match_history').insert({
        match_id: matchId,
        player1_id: user.id,
        player2_id: user.id,
        player1_username: profile.username,
        player2_username: `Bot (Power ${power})`,
        player1_rating_before: profile.rating,
        player1_rating_after: profile.rating,
        player2_rating_before: 1200,
        player2_rating_after: 1200,
        player1_class: profile.class,
        player2_class: power > 66 ? 'A' : power > 33 ? 'B' : 'C',
        winner_id: playerWon ? user.id : isDraw ? null : user.id,
        result,
        pgn: chess.pgn(),
        fen_history: fenHistory,
        move_timestamps: [],
        total_moves: history.length,
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      });
    };
    
    saveGameToHistory();
  }, [chess.isGameOver(), power, user, playerColor, awardMatchXP, refreshProfile, recordGame, awardMasterXP]);

  return {
    chess,
    playerColor,
    isPlayerTurn: chess.turn() === playerColor[0] && !isThinking,
    makeMove: makePlayerMove,
    resetGame,
    isThinking,
    gameStatus: getGameStatus(),
    gameOver: chess.isGameOver(),
    engineReady: true,
    lastMove,
    gameId,
    cacheHit
  };
};
