import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square, Move } from 'chess.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useBotAdaptiveDifficulty } from '@/hooks/useBotAdaptiveDifficulty';

type Power = number; // 0-100 continuous power level

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
const getPowerConfig = (power: Power): DifficultyConfig => {
  // Non-linear power scaling for more dramatic differences
  const normalizedPower = power / 100;
  const scaledPower = Math.pow(normalizedPower, 1.5); // Non-linear curve
  
  // Depth: improved formula - depth = floor(power / 5) + baseDepth
  // Power 0 → depth 2, Power 100 → depth 22
  const baseDepth = 2;
  const depth = Math.floor(power / 5) + baseDepth;
  
  // MultiPV: 4 at low power, 1 at high power
  const multipv = power <= 33 ? 4 : power <= 66 ? 3 : 1;
  
  // Randomness: high at low power, zero at high power
  const randomness = Math.max(0, 0.6 - (scaledPower * 0.6));
  
  // Blunder chance: high at low power, zero above 50
  const blunderChance = power <= 50 ? Math.max(0, 0.45 - (power / 50) * 0.45) : 0;
  
  // Think time: scales from 100-250ms to 1500-3000ms
  const minThink = Math.round(100 + scaledPower * 1400);
  const maxThink = Math.round(250 + scaledPower * 2750);
  
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
  const hasAwardedXP = useRef(false);
  const { user, refreshProfile } = useAuth();
  const { awardMatchXP } = useXPSystem();
  const { recordGame, getAdaptiveAdjustment, detectTrick, winStreak, lossStreak } = useBotAdaptiveDifficulty();

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

  // Professional move selection with blunder injection and multipv + ADAPTIVE DIFFICULTY
  const getBotMove = useCallback(async (game: Chess): Promise<Move | null> => {
    const baseConfig = getPowerConfig(power);
    const adaptive = getAdaptiveAdjustment();
    
    // Apply adaptive adjustments
    const config = {
      depth: Math.max(1, Math.min(28, baseConfig.depth + adaptive.depthAdjust)),
      multipv: baseConfig.multipv,
      randomness: Math.max(0, Math.min(1, baseConfig.randomness + adaptive.randomnessAdjust)),
      blunderChance: Math.max(0, Math.min(1, baseConfig.blunderChance + adaptive.blunderAdjust)),
      thinkTime: [
        Math.max(50, baseConfig.thinkTime[0] + adaptive.thinkTimeAdjust),
        Math.max(100, baseConfig.thinkTime[1] + adaptive.thinkTimeAdjust)
      ] as [number, number],
      eloRange: baseConfig.eloRange
    };

    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    // ANTI-TRICK: Detect player patterns
    const history = game.history();
    const trick = detectTrick(game.fen(), history);
    
    if (trick) {
      console.log('🛡️ Trick detected:', trick, '- Bot adapting strategy');
      // Increase depth for trick prevention
      config.depth = Math.min(config.depth + 4, 28);
      config.blunderChance = 0;
    }

    // Simulate human-like thinking time with more variability
    const baseThinkTime = config.thinkTime[0] + Math.random() * (config.thinkTime[1] - config.thinkTime[0]);
    // Add occasional "deep thinking" pauses (10% chance for 2x longer)
    const thinkTime = Math.random() < 0.1 ? baseThinkTime * 2 : baseThinkTime;
    await new Promise(resolve => setTimeout(resolve, thinkTime));

    const startTime = Date.now();
    const timeLimit = config.thinkTime[1];

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
        return blunderMove.move;
      }
    }

    // MULTIPV SELECTION (top-moves pool)
    const topMoves = scoredMoves.slice(0, config.multipv);
    
    // Apply randomness to selection from top moves
    if (config.randomness > 0 && Math.random() < config.randomness && topMoves.length > 1) {
      const randomIndex = Math.floor(Math.random() * topMoves.length);
      return topMoves[randomIndex].move;
    }

    // Default: return best move
    return scoredMoves[0]?.move || moves[0];
  }, [power, minimax, getAdaptiveAdjustment, detectTrick, winStreak, lossStreak]);

  // Bot move execution (non-blocking UI)
  const makeBotMove = useCallback(async (currentGame: Chess) => {
    if (currentGame.isGameOver()) return currentGame;

    setIsThinking(true);

    try {
      // Get bot move (async, won't block UI)
      const move = await getBotMove(currentGame);
      
      if (move) {
        // Apply move
        currentGame.move(move);
        
        // Update last move state for highlighting (RED for bot moves)
        setLastMove({ 
          from: move.from as Square, 
          to: move.to as Square,
          isOpponent: true // Bot moves are opponent moves (RED)
        });
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
        }
        // No XP for draw or loss in new system
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
  }, [chess.isGameOver(), power, user, playerColor, awardMatchXP, refreshProfile, recordGame]);

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
    gameId
  };
};
