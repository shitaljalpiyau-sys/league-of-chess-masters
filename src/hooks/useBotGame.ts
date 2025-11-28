import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Square, Move } from 'chess.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useXPSystem } from '@/hooks/useXPSystem';
import { stockfishService } from '@/services/stockfishService';

type Difficulty = 'easy' | 'moderate' | 'hard';

export const useBotGame = (difficulty: Difficulty = 'moderate') => {
  const [chess, setChess] = useState(new Chess());
  const [playerColor] = useState<'white' | 'black'>('white');
  const [isThinking, setIsThinking] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { awardMatchXP } = useXPSystem();

  // Initialize Stockfish engine
  useEffect(() => {
    stockfishService.init()
      .then(() => setEngineReady(true))
      .catch(err => console.error('Failed to initialize Stockfish:', err));
    
    return () => {
      stockfishService.destroy();
    };
  }, []);

  const getBotMove = useCallback(async (game: Chess): Promise<string | null> => {
    if (!engineReady) {
      console.warn('Stockfish not ready yet');
      return null;
    }
    
    const fen = game.fen();
    const bestMove = await stockfishService.getBestMove(fen, difficulty);
    return bestMove;
  }, [difficulty, engineReady]);

  // FIXED: Bot move function that accepts the current game state
  const makeBotMove = useCallback(async (currentGame: Chess) => {
    if (currentGame.isGameOver() || !engineReady) return currentGame;

    setIsThinking(true);

    // Get bot move from Stockfish (already has timing built-in)
    const moveString = await getBotMove(currentGame);
    
    if (moveString) {
      try {
        // Parse UCI move format (e.g., "e2e4" or "e7e8q")
        const from = moveString.substring(0, 2);
        const to = moveString.substring(2, 4);
        const promotion = moveString.length > 4 ? moveString[4] : undefined;
        
        // Apply move to the current game state
        const move = currentGame.move({
          from,
          to,
          promotion
        });
        
        if (move) {
          // HIGHLIGHT BOT MOVE - Apply immediately after move
          requestAnimationFrame(() => {
            // Remove old highlights
            document.querySelectorAll('.highlight-from, .highlight-to').forEach(el => {
              el.classList.remove('highlight-from', 'highlight-to');
            });
            
            // Add new highlights
            const fromSquare = document.querySelector(`[data-square="${from}"]`);
            const toSquare = document.querySelector(`[data-square="${to}"]`);
            
            if (fromSquare) fromSquare.classList.add('highlight-from');
            if (toSquare) toSquare.classList.add('highlight-to');
          });
        }
      } catch (error) {
        console.error('Bot move error:', error);
      }
    }

    setIsThinking(false);
    return currentGame;
  }, [getBotMove, engineReady]);

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
      
      // Determine if player won
      const playerWon = (playerColor === 'white' && result === 'white_wins') || 
                        (playerColor === 'black' && result === 'black_wins');
      const isDraw = result === 'draw';
      const moveCount = chess.history().length;
      const isFastCheckmate = playerWon && moveCount < 25;
      
      // Update profile stats
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
      
      // Award XP
      setTimeout(() => {
        if (playerWon) {
          awardMatchXP('win', { fastCheckmate: isFastCheckmate });
        } else if (isDraw) {
          awardMatchXP('draw');
        } else {
          awardMatchXP('loss');
        }
      }, 500);
      
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
    isPlayerTurn: chess.turn() === playerColor[0] && !isThinking && engineReady,
    makeMove: makePlayerMove,
    resetGame,
    isThinking: isThinking || !engineReady,
    gameStatus: getGameStatus(),
    gameOver: chess.isGameOver(),
    engineReady
  };
};
