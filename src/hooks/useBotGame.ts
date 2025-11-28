import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square, Move } from 'chess.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useXPSystem } from '@/hooks/useXPSystem';

type Difficulty = 'easy' | 'moderate' | 'hard';

interface EngineConfig {
  skillLevel: number;
  depth: number;
  threads: number;
  moveOverhead: number;
  contempt?: number;
  hash?: number;
  description: string;
}

// Stockfish engine difficulty configurations
const DIFFICULTY_CONFIG: Record<Difficulty, EngineConfig> = {
  easy: { 
    skillLevel: 5, 
    depth: 10, 
    threads: 1, 
    moveOverhead: 50, 
    contempt: 30,
    description: '50% strength (~1500 ELO)'
  },
  moderate: { 
    skillLevel: 12, 
    depth: 16, 
    threads: 2, 
    moveOverhead: 80, 
    contempt: 15,
    description: '75% strength (~2000 ELO)'
  },
  hard: { 
    skillLevel: 20, 
    depth: 22, 
    threads: 4, 
    moveOverhead: 120, 
    hash: 256,
    description: '100% strength (~3000+ ELO)'
  }
};

export const useBotGame = (initialDifficulty: Difficulty = 'moderate') => {
  const [chess, setChess] = useState(new Chess());
  const [playerColor] = useState<'white' | 'black'>('white');
  const [isThinking, setIsThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [playerWinStreak, setPlayerWinStreak] = useState(0);
  const [playerLossStreak, setPlayerLossStreak] = useState(0);
  const [engineReady, setEngineReady] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { awardMatchXP } = useXPSystem();
  const engineRef = useRef<any>(null);
  const pendingMoveRef = useRef<((move: string) => void) | null>(null);

  // Initialize Stockfish engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        // Dynamically import stockfish
        const StockfishModule = await import('stockfish');
        const Stockfish = StockfishModule.default || StockfishModule;
        const engine = typeof Stockfish === 'function' ? Stockfish() : new (Stockfish as any)();
        engineRef.current = engine;

        // Set up message handler
        engine.onmessage = (event: MessageEvent) => {
          const message = event.data || event;
          console.log('Stockfish:', message);

          if (message === 'uciok') {
            engine.postMessage('isready');
          } else if (message === 'readyok') {
            setEngineReady(true);
            console.log('Stockfish engine ready');
          } else if (typeof message === 'string' && message.startsWith('bestmove')) {
            const match = message.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
            if (match && pendingMoveRef.current) {
              pendingMoveRef.current(match[1]);
              pendingMoveRef.current = null;
            }
          }
        };

        // Initialize UCI
        engine.postMessage('uci');
      } catch (error) {
        console.error('Failed to initialize Stockfish:', error);
      }
    };

    initEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.terminate?.();
      }
    };
  }, []);

  // Configure engine for current difficulty
  const configureEngine = useCallback(() => {
    if (!engineRef.current) return;

    const config = DIFFICULTY_CONFIG[difficulty];
    const engine = engineRef.current;

    engine.postMessage('ucinewgame');
    engine.postMessage(`setoption name Skill Level value ${config.skillLevel}`);
    engine.postMessage(`setoption name Threads value ${config.threads}`);
    engine.postMessage(`setoption name Move Overhead value ${config.moveOverhead}`);
    
    if (config.contempt !== undefined) {
      engine.postMessage(`setoption name Contempt value ${config.contempt}`);
    }
    
    if (config.hash !== undefined) {
      engine.postMessage(`setoption name Hash value ${config.hash}`);
    }

    console.log(`Stockfish configured: ${difficulty} - ${config.description}`);
  }, [difficulty]);

  // Get best move from Stockfish
  const getBotMove = useCallback(async (game: Chess): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!engineRef.current || !engineReady) {
        reject(new Error('Engine not ready'));
        return;
      }

      const moves = game.moves();
      if (moves.length === 0) {
        reject(new Error('No legal moves available'));
        return;
      }

      const config = DIFFICULTY_CONFIG[difficulty];
      const fen = game.fen();

      // Configure engine for this move
      configureEngine();

      // Set up the promise resolver
      pendingMoveRef.current = resolve;

      // Send position and request move
      engineRef.current.postMessage(`position fen ${fen}`);
      engineRef.current.postMessage(`go depth ${config.depth}`);

      // Timeout fallback
      setTimeout(() => {
        if (pendingMoveRef.current === resolve) {
          pendingMoveRef.current = null;
          // Return random legal move as fallback
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          console.warn('Engine timeout, using random move');
          resolve(randomMove);
        }
      }, 10000);
    });
  }, [difficulty, engineReady, configureEngine]);

  // Adaptive difficulty adjustment
  const adjustDifficulty = useCallback((playerWon: boolean) => {
    if (playerWon) {
      const newStreak = playerWinStreak + 1;
      setPlayerWinStreak(newStreak);
      setPlayerLossStreak(0);
      
      // Increase difficulty after 2 wins in a row
      if (newStreak >= 2) {
        if (difficulty === 'easy') {
          setDifficulty('moderate');
          console.log('Adaptive difficulty: Upgraded to MODERATE');
        } else if (difficulty === 'moderate') {
          setDifficulty('hard');
          console.log('Adaptive difficulty: Upgraded to HARD');
        }
        setPlayerWinStreak(0);
      }
    } else {
      const newStreak = playerLossStreak + 1;
      setPlayerLossStreak(newStreak);
      setPlayerWinStreak(0);
      
      // Decrease difficulty after 2 losses in a row
      if (newStreak >= 2) {
        if (difficulty === 'hard') {
          setDifficulty('moderate');
          console.log('Adaptive difficulty: Downgraded to MODERATE');
        } else if (difficulty === 'moderate') {
          setDifficulty('easy');
          console.log('Adaptive difficulty: Downgraded to EASY');
        }
        setPlayerLossStreak(0);
      }
    }
  }, [difficulty, playerWinStreak, playerLossStreak]);

  // Bot move execution with smooth animation
  const makeBotMove = useCallback(async (currentGame: Chess) => {
    // Use Chess.js to verify game status
    if (currentGame.isGameOver()) return { game: currentGame, move: null };

    setIsThinking(true);

    try {
      // Small delay to show thinking indicator
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get bot move from Stockfish
      const moveUci = await getBotMove(currentGame);
      
      // Parse UCI move (e.g., "e2e4" or "e7e8q")
      const from = moveUci.substring(0, 2) as Square;
      const to = moveUci.substring(2, 4) as Square;
      const promotion = moveUci.length > 4 ? moveUci[4] : undefined;
      
      // Apply move
      const move = currentGame.move({ from, to, promotion });
      
      if (!move) {
        console.error('Invalid engine move:', moveUci);
        return { game: currentGame, move: null };
      }
      
      // Return the move info for animation
      return { game: currentGame, move };
    } catch (error) {
      console.error('Bot move error:', error);
      return { game: currentGame, move: null };
    } finally {
      setIsThinking(false);
    }
  }, [getBotMove]);

  // Player move handler with smooth animation
  const makePlayerMove = useCallback(async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
    if (isThinking || chess.isGameOver() || chess.turn() !== playerColor[0]) {
      return false;
    }

    try {
      const newGame = new Chess(chess.fen());
      const move = newGame.move({ from, to, promotion: promotion || 'q' });

      if (!move) return false;

      // Update game state immediately for smooth UI
      setChess(newGame);

      if (newGame.isGameOver()) return true;

      // Bot's turn - run async without blocking UI
      if (newGame.turn() === 'b') {
        // Use setTimeout to ensure player move animation completes first
        setTimeout(async () => {
          const result = await makeBotMove(newGame);
          if (result && result.move) {
            setChess(new Chess(result.game.fen()));
          }
        }, 200);
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
    // Reset streaks on new game
    setPlayerWinStreak(0);
    setPlayerLossStreak(0);
    // Reconfigure engine for new game
    configureEngine();
  }, [configureEngine]);

  const getGameStatus = useCallback(() => {
    // Use Chess.js logic only, never rely on engine output
    const moves = chess.moves();
    const isInCheck = chess.isCheck();
    
    // No legal moves
    if (moves.length === 0) {
      if (isInCheck) return 'checkmate';
      return 'stalemate';
    }
    
    // Other draw conditions
    if (chess.isDraw()) return 'draw';
    if (isInCheck) return 'check';
    
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
      
      // Adjust difficulty based on result
      adjustDifficulty(playerWon);
      
      setTimeout(() => {
        if (playerWon) {
          awardMatchXP('win', { fastCheckmate: isFastCheckmate });
        } else if (isDraw) {
          awardMatchXP('draw');
        } else {
          awardMatchXP('loss');
        }
      }, 500);
      
      // Build FEN history from move history using verbose moves
      const fenHistory: string[] = [new Chess().fen()];
      const tempChess = new Chess();
      const moveHistory = chess.history({ verbose: true });
      
      moveHistory.forEach(move => {
        try {
          tempChess.move({ from: move.from, to: move.to, promotion: move.promotion });
          fenHistory.push(tempChess.fen());
        } catch (error) {
          console.error('Error building FEN history:', error, move);
        }
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
        total_moves: chess.history().length,
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      });
    };
    
    saveGameToHistory();
  }, [chess.isGameOver(), difficulty, user, playerColor, awardMatchXP, refreshProfile, adjustDifficulty, chess]);

  return {
    chess,
    playerColor,
    isPlayerTurn: chess.turn() === playerColor[0] && !isThinking,
    makeMove: makePlayerMove,
    resetGame,
    isThinking,
    gameStatus: getGameStatus(),
    gameOver: chess.isGameOver(),
    engineReady,
    currentDifficulty: difficulty
  };
};
