import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Square, Move } from 'chess.js';
import { supabase } from '@/integrations/supabase/client';

type Difficulty = 'easy' | 'moderate' | 'hard';

// Piece values for evaluation
const PIECE_VALUES: { [key: string]: number } = {
  p: 100,   // pawn
  n: 320,   // knight
  b: 330,   // bishop
  r: 500,   // rook
  q: 900,   // queen
  k: 20000  // king
};

// Position bonus tables for piece placement
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

export const useBotGame = (difficulty: Difficulty = 'moderate') => {
  const [chess, setChess] = useState(new Chess());
  const [playerColor] = useState<'white' | 'black'>('white');
  const [isThinking, setIsThinking] = useState(false);

  // EASY MODE: Random moves with intentional mistakes
  const getEasyMove = useCallback((game: Chess): Move | null => {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    // 30% chance to make a completely random move (mistake)
    if (Math.random() < 0.3) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    // 70% chance to pick from first few moves (still basic)
    const randomSubset = moves.slice(0, Math.min(moves.length, 5));
    return randomSubset[Math.floor(Math.random() * randomSubset.length)];
  }, []);

  // MODERATE MODE: Basic evaluation with minimax depth 2
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

          // Add positional bonus
          if (piece === 'p') {
            value += color === 'w' ? PAWN_TABLE[i * 8 + j] : PAWN_TABLE[(7 - i) * 8 + j];
          } else if (piece === 'n') {
            value += color === 'w' ? KNIGHT_TABLE[i * 8 + j] : KNIGHT_TABLE[(7 - i) * 8 + j];
          }

          totalEval += color === 'b' ? value : -value;
        }
      }
    }

    return totalEval;
  }, []);

  const getModerateMove = useCallback((game: Chess): Move | null => {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    let bestMove = moves[0];
    let bestValue = -Infinity;

    // Depth 2 minimax
    for (const move of moves) {
      const testGame = new Chess(game.fen());
      testGame.move(move);

      let value = -evaluateBoard(testGame);

      // Look ahead one more move
      const opponentMoves = testGame.moves({ verbose: true });
      if (opponentMoves.length > 0) {
        let worstOpponentValue = Infinity;
        for (const oppMove of opponentMoves) {
          const testGame2 = new Chess(testGame.fen());
          testGame2.move(oppMove);
          const oppValue = -evaluateBoard(testGame2);
          worstOpponentValue = Math.min(worstOpponentValue, oppValue);
        }
        value = worstOpponentValue;
      }

      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }

    return bestMove;
  }, [evaluateBoard]);

  // HARD MODE: Minimax with alpha-beta pruning depth 4
  const minimax = useCallback((
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean
  ): number => {
    if (depth === 0 || game.isGameOver()) {
      return evaluateBoard(game);
    }

    const moves = game.moves({ verbose: true });

    if (isMaximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const testGame = new Chess(game.fen());
        testGame.move(move);
        const evaluation = minimax(testGame, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) {
          break; // Beta cutoff
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const testGame = new Chess(game.fen());
        testGame.move(move);
        const evaluation = minimax(testGame, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) {
          break; // Alpha cutoff
        }
      }
      return minEval;
    }
  }, [evaluateBoard]);

  const getHardMove = useCallback((game: Chess): Move | null => {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    let bestMove = moves[0];
    let bestValue = -Infinity;

    // Depth 4 minimax with alpha-beta pruning
    for (const move of moves) {
      const testGame = new Chess(game.fen());
      testGame.move(move);
      const value = minimax(testGame, 3, -Infinity, Infinity, false);

      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }

    return bestMove;
  }, [minimax]);

  const getBotMove = useCallback((game: Chess): Move | null => {
    switch (difficulty) {
      case 'easy':
        return getEasyMove(game);
      case 'moderate':
        return getModerateMove(game);
      case 'hard':
        return getHardMove(game);
      default:
        return getEasyMove(game);
    }
  }, [difficulty, getEasyMove, getModerateMove, getHardMove]);

  // FIXED: Bot move function that accepts the current game state
  const makeBotMove = useCallback(async (currentGame: Chess) => {
    if (currentGame.isGameOver()) return currentGame;

    setIsThinking(true);

    // Natural thinking delay: 400ms - 800ms
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));

    // Calculate bot move using the CURRENT game state passed in
    const move = getBotMove(currentGame);
    
    if (move) {
      // Apply move to the current game state
      currentGame.move(move);
      
      // HIGHLIGHT BOT MOVE - Apply immediately after move
      requestAnimationFrame(() => {
        // Remove old highlights
        document.querySelectorAll('.highlight-from, .highlight-to').forEach(el => {
          el.classList.remove('highlight-from', 'highlight-to');
        });
        
        // Add new highlights
        const fromSquare = document.querySelector(`[data-square="${move.from}"]`);
        const toSquare = document.querySelector(`[data-square="${move.to}"]`);
        
        if (fromSquare) fromSquare.classList.add('highlight-from');
        if (toSquare) toSquare.classList.add('highlight-to');
      });
    }

    setIsThinking(false);
    return currentGame;
  }, [getBotMove]);

  // FIXED: Player move function with correct state flow
  const makePlayerMove = useCallback(async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
    // Block moves during bot's turn or if game is over
    if (isThinking || chess.isGameOver() || chess.turn() !== playerColor[0]) {
      return false;
    }

    try {
      // Remove highlights when player moves
      document.querySelectorAll('.highlight-from, .highlight-to').forEach(el => {
        el.classList.remove('highlight-from', 'highlight-to');
      });
      
      // Step 1: Apply player move to a NEW chess instance
      const newGame = new Chess(chess.fen());
      const move = newGame.move({
        from,
        to,
        promotion: promotion || 'q'
      });

      if (!move) {
        // Illegal move
        return false;
      }

      // Step 2: Update UI with player's move immediately
      setChess(newGame);

      // Step 3: Check if game ended after player's move
      if (newGame.isGameOver()) {
        return true;
      }

      // Step 4: If it's now bot's turn, let bot move
      if (newGame.turn() === 'b') {
        // Pass the updated game state to bot
        const gameAfterBot = await makeBotMove(newGame);
        // Update state with both player and bot moves
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

  // Save bot game to match_history when game ends
  useEffect(() => {
    const saveGameToHistory = async () => {
      if (!chess.isGameOver()) return;
      
      const result = chess.isCheckmate() 
        ? (chess.turn() === 'w' ? 'black_wins' : 'white_wins')
        : 'draw';
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, rating, class')
        .eq('id', user.id)
        .single();
      
      if (!profile) return;
      
      // Generate FEN history
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
        player2_id: user.id, // Bot games reference same user
        player1_username: profile.username,
        player2_username: `Bot (${difficulty})`,
        player1_rating_before: profile.rating,
        player1_rating_after: profile.rating,
        player2_rating_before: 1200,
        player2_rating_after: 1200,
        player1_class: profile.class,
        player2_class: difficulty === 'hard' ? 'A' : difficulty === 'moderate' ? 'B' : 'C',
        winner_id: result === 'white_wins' ? user.id : result === 'black_wins' ? user.id : null,
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
  }, [chess.isGameOver(), difficulty]);

  return {
    chess,
    playerColor,
    isPlayerTurn: chess.turn() === playerColor[0] && !isThinking,
    makeMove: makePlayerMove,
    resetGame,
    isThinking,
    gameStatus: getGameStatus(),
    gameOver: chess.isGameOver()
  };
};
