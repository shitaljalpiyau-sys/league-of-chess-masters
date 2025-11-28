import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Square, Move } from 'chess.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useXPSystem } from '@/hooks/useXPSystem';

type Difficulty = 'easy' | 'moderate' | 'hard';

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

// Difficulty configurations with optimized parameters
const DIFFICULTY_CONFIG = {
  easy: { depth: 2, randomness: 0.4, timeLimit: 150 },
  moderate: { depth: 3, randomness: 0.15, timeLimit: 400 },
  hard: { depth: 4, randomness: 0.05, timeLimit: 800 }
};

export const useBotGame = (difficulty: Difficulty = 'moderate') => {
  const [chess, setChess] = useState(new Chess());
  const [playerColor] = useState<'white' | 'black'>('white');
  const [isThinking, setIsThinking] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { awardMatchXP } = useXPSystem();

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

  // Get best move with optimized search
  const getBotMove = useCallback(async (game: Chess): Promise<Move | null> => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    // Apply randomness for lower difficulties
    if (Math.random() < config.randomness) {
      return moves[Math.floor(Math.random() * Math.min(moves.length, 5))];
    }

    const startTime = Date.now();
    let bestMove = moves[0];
    let bestValue = -Infinity;

    // Move ordering: evaluate captures first
    moves.sort((a, b) => {
      const aScore = a.captured ? PIECE_VALUES[a.captured] : 0;
      const bScore = b.captured ? PIECE_VALUES[b.captured] : 0;
      return bScore - aScore;
    });

    for (const move of moves) {
      // Time limit check
      if (Date.now() - startTime > config.timeLimit) break;

      const testGame = new Chess(game.fen());
      testGame.move(move);
      const value = minimax(testGame, config.depth - 1, -Infinity, Infinity, false, startTime, config.timeLimit);

      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }

    return bestMove;
  }, [difficulty, minimax]);

  // Bot move execution
  const makeBotMove = useCallback(async (currentGame: Chess) => {
    if (currentGame.isGameOver()) return currentGame;

    setIsThinking(true);

    // Get bot move
    const move = await getBotMove(currentGame);
    
    if (move) {
      // Apply move
      currentGame.move(move);
      
      // Highlight bot move
      requestAnimationFrame(() => {
        document.querySelectorAll('.highlight-from, .highlight-to').forEach(el => {
          el.classList.remove('highlight-from', 'highlight-to');
        });
        
        const fromSquare = document.querySelector(`[data-square="${move.from}"]`);
        const toSquare = document.querySelector(`[data-square="${move.to}"]`);
        
        if (fromSquare) fromSquare.classList.add('highlight-from');
        if (toSquare) toSquare.classList.add('highlight-to');
      });
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
      // Remove highlights
      document.querySelectorAll('.highlight-from, .highlight-to').forEach(el => {
        el.classList.remove('highlight-from', 'highlight-to');
      });
      
      const newGame = new Chess(chess.fen());
      const move = newGame.move({ from, to, promotion: promotion || 'q' });

      if (!move) return false;

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
      if (!chess.isGameOver() || !user) return;
      
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
      
      setTimeout(() => {
        if (playerWon) {
          awardMatchXP('win', { fastCheckmate: isFastCheckmate });
        } else if (isDraw) {
          awardMatchXP('draw');
        } else {
          awardMatchXP('loss');
        }
      }, 500);
      
      const fenHistory: string[] = [new Chess().fen()];
      const tempChess = new Chess();
      const history = chess.history();
      history.forEach(move => {
        tempChess.move(move);
        fenHistory.push(tempChess.fen());
      });
      
      await supabase.from('match_history').insert({
        match_id: crypto.randomUUID(),
        player1_id: user.id,
        player2_id: user.id,
        player1_username: profile.username,
        player2_username: `Bot (${difficulty})`,
        player1_rating_before: profile.rating,
        player1_rating_after: profile.rating,
        player2_rating_before: 1200,
        player2_rating_after: 1200,
        player1_class: profile.class,
        player2_class: difficulty === 'hard' ? 'A' : difficulty === 'moderate' ? 'B' : 'C',
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
  }, [chess.isGameOver(), difficulty, user, playerColor, awardMatchXP, refreshProfile]);

  return {
    chess,
    playerColor,
    isPlayerTurn: chess.turn() === playerColor[0] && !isThinking,
    makeMove: makePlayerMove,
    resetGame,
    isThinking,
    gameStatus: getGameStatus(),
    gameOver: chess.isGameOver(),
    engineReady: true
  };
};
