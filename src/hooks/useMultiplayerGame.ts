import { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChessSounds } from "@/utils/chessSounds";
import { useXPSystem } from "@/hooks/useXPSystem";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Game {
  id: string;
  white_player_id: string;
  black_player_id: string;
  fen: string;
  pgn: string;
  current_turn: 'white' | 'black';
  time_control: string;
  white_time_remaining: number;
  black_time_remaining: number;
  status: 'active' | 'completed' | 'abandoned';
  result: string | null;
  move_count?: number;
  move_history?: any[];
  spectator_count?: number;
}

export const useMultiplayerGame = (gameId: string | null) => {
  const [game, setGame] = useState<Game | null>(null);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [loading, setLoading] = useState(true);
  const { user, refreshProfile } = useAuth();
  const { awardMatchXP } = useXPSystem();
  const gameEndedRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const playerColor = game 
    ? (game.white_player_id === user?.id ? 'white' : 'black')
    : null;

  const isPlayerTurn = game?.current_turn === playerColor;

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    // Reset game ended flag when game ID changes
    gameEndedRef.current = false;

    // Initialize sounds
    ChessSounds.initialize();
    
    fetchGame();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          const updatedGame = payload.new as any;
          
          // Ignore null or invalid updates
          if (!updatedGame || !updatedGame.id) {
            return;
          }
          
          setGame((prevGame) => {
            if (!prevGame) return null;
            
            const newGameState = {
              ...updatedGame,
              current_turn: updatedGame.current_turn as 'white' | 'black',
              move_history: Array.isArray(updatedGame.move_history) ? updatedGame.move_history : [],
            };
            
            // Update chess instance
            const newChess = new Chess();
            try {
              newChess.loadPgn(updatedGame.pgn);
            } catch (e) {
              console.error('Failed to load PGN:', e);
              return prevGame; // Don't update if PGN is invalid
            }
            
            // Play sound if move was made by opponent
            if (updatedGame.move_count > prevGame.move_count && updatedGame.status === 'active') {
              const currentPlayerColor = updatedGame.white_player_id === user?.id ? 'white' : 'black';
              const playerTurn = updatedGame.current_turn === currentPlayerColor;
              if (playerTurn) {
                const history = newChess.history({ verbose: true });
                const lastMove = history[history.length - 1];
                
                if (lastMove?.captured) {
                  ChessSounds.playCapture();
                } else {
                  ChessSounds.playMove();
                }
                
                if (newChess.isCheck()) {
                  setTimeout(() => ChessSounds.playCheck(), 200);
                }
              }
            }
            
            // Handle game end ONCE - check flag first
            if (updatedGame.status === 'completed' && prevGame.status === 'active' && !gameEndedRef.current) {
              console.log("GameOver: Detected game completion, triggering handler");
              handleGameOver(updatedGame, newChess);
            }
            
            setChess(newChess);
            return newGameState;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      // Cleanup on unmount - unsubscribe from channel
      if (channelRef.current) {
        console.log("Cleanup: Unsubscribing from game channel on unmount");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [gameId, user?.id]);

  const handleGameOver = async (gameData: any, chessInstance: Chess) => {
    // CRITICAL GUARD: Prevent double execution
    if (gameEndedRef.current) {
      console.warn("GameOver: Already processed, skipping");
      return;
    }
    
    if (!user?.id || !gameData.result) {
      console.error("GameOver: Missing user or result data");
      return;
    }

    // Mark as ended IMMEDIATELY to prevent re-entry
    gameEndedRef.current = true;

    // Unsubscribe from realtime immediately to stop receiving updates
    if (channelRef.current) {
      try {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log("GameOver: Realtime channel unsubscribed");
      } catch (err) {
        console.error("GameOver: Failed to unsubscribe channel", err);
      }
    }

    // Play game end sound
    ChessSounds.playGameEnd();

    const moveCount = gameData.move_count || 0;
    const isFastCheckmate = moveCount < 25;
    
    let result: 'win' | 'draw' | 'loss';
    const isWhitePlayer = gameData.white_player_id === user.id;
    const whiteWon = gameData.result === 'white_wins' || gameData.result === '1-0';
    const blackWon = gameData.result === 'black_wins' || gameData.result === '0-1';
    
    if (gameData.result === 'draw' || gameData.result === '1/2-1/2') {
      result = 'draw';
    } else if ((isWhitePlayer && whiteWon) || (!isWhitePlayer && blackWon)) {
      result = 'win';
    } else {
      result = 'loss';
    }

    // Update stats
    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('games_won, games_played')
        .eq('id', user.id)
        .single();
      
      if (currentProfile) {
        const updates: any = {
          games_played: currentProfile.games_played + 1,
        };
        
        if (result === 'win') {
          updates.games_won = currentProfile.games_won + 1;
        }
        
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
      }
      
      await refreshProfile();
      
      // Award XP
      setTimeout(() => {
        awardMatchXP(result, {
          fastCheckmate: result === 'win' && isFastCheckmate,
        });
      }, 500);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update stats');
    }
  };

  const fetchGame = async (retryCount = 0) => {
    if (!gameId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) {
      console.error('Error fetching game:', error);
      
      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 4000);
        console.log(`Retrying game fetch in ${delay}ms (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchGame(retryCount + 1);
        }, delay);
        return;
      }
      
      toast.error('Failed to load game. Please refresh the page.');
      setLoading(false);
      return;
    }

    if (!data) {
      console.error('Game not found');
      
      // Retry for newly created games
      if (retryCount < 3) {
        const delay = 500 * (retryCount + 1);
        console.log(`Game not found, retrying in ${delay}ms`);
        setTimeout(() => {
          fetchGame(retryCount + 1);
        }, delay);
        return;
      }
      
      toast.error('Game not found');
      setLoading(false);
      return;
    }

    setGame({
      ...data,
      current_turn: data.current_turn as 'white' | 'black',
      status: data.status as 'active' | 'completed' | 'abandoned',
      move_history: Array.isArray(data.move_history) ? data.move_history : [],
    });
    const newChess = new Chess();
    if (data.pgn) {
      try {
        newChess.loadPgn(data.pgn);
      } catch (e) {
        console.error('Failed to load PGN:', e);
        // Continue with default position
      }
    }
    setChess(newChess);
    setLoading(false);
  };

  const makeMove = async (from: string, to: string, promotion?: string) => {
    // CRITICAL: Don't allow moves if game is over
    if (gameEndedRef.current) {
      console.warn("GameOver: Move blocked - game already ended");
      return false;
    }

    if (!game || game.status !== 'active') {
      console.warn("GameOver: Move blocked - game not active");
      return false;
    }

    // Critical security check: ensure it's player's turn
    if (!isPlayerTurn) {
      toast.error("It's not your turn!");
      return false;
    }

    // Critical security check: validate input format
    if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) {
      console.error("Invalid square format");
      return false;
    }

    if (promotion && !/^[qrbn]$/.test(promotion)) {
      console.error("Invalid promotion piece");
      return false;
    }

    // Optimistic update for instant UI feedback
    const tempChess = new Chess();
    if (game.pgn) {
      try {
        tempChess.loadPgn(game.pgn);
      } catch (e) {
        console.error("Failed to load PGN:", e);
        toast.error("Game state error");
        return false;
      }
    }

    // Verify piece belongs to player (client-side pre-check)
    const piece = tempChess.get(from as any);
    if (!piece) {
      toast.error("No piece at that square");
      return false;
    }

    const pieceColor = piece.color === 'w' ? 'white' : 'black';
    if (pieceColor !== playerColor) {
      toast.error("Cannot move opponent's pieces!");
      return false;
    }

    const testMove = tempChess.move({
      from: from as any,
      to: to as any,
      promotion: promotion || 'q'
    });

    if (!testMove) {
      toast.error("Illegal move!");
      return false;
    }

    // Update UI immediately (optimistic)
    const newChess = new Chess();
    newChess.loadPgn(tempChess.pgn());
    setChess(newChess);
    
    // Play sound immediately
    if (testMove.captured) {
      ChessSounds.playCapture();
    } else {
      ChessSounds.playMove();
    }
    
    if (newChess.isCheck()) {
      setTimeout(() => ChessSounds.playCheck(), 200);
    }

    try {
      // CRITICAL: Check again before server call
      if (gameEndedRef.current) {
        console.warn("GameOver: Server call blocked - game ended during optimistic update");
        return false;
      }

      // Validate on server (authoritative)
      const { data, error } = await supabase.functions.invoke('validate-move', {
        body: {
          gameId: game.id,
          from,
          to,
          promotion
        }
      });

      if (error || !data?.success) {
        // Don't revert if game ended during the call
        if (gameEndedRef.current) {
          console.log("GameOver: Move failed but game ended, ignoring error");
          return false;
        }

        // Revert optimistic update
        const revertChess = new Chess();
        if (game.pgn) {
          revertChess.loadPgn(game.pgn);
        }
        setChess(revertChess);
        
        // Show user-friendly error
        const errorMsg = data?.error || error?.message || "Move failed";
        toast.error(errorMsg);
        return false;
      }

      // Show success messages for game end
      if (data.status === 'completed') {
        ChessSounds.playGameEnd();
        if (data.result === 'white_wins' || data.result === '1-0') {
          toast.success('White wins by checkmate!');
        } else if (data.result === 'black_wins' || data.result === '0-1') {
          toast.success('Black wins by checkmate!');
        } else if (data.result === 'draw' || data.result === '1/2-1/2') {
          toast.success('Game ended in a draw!');
        }
      }

      return true;
    } catch (error) {
      console.error('Error making move:', error);
      
      // Don't show errors if game already ended
      if (gameEndedRef.current) {
        console.log("GameOver: Network error but game ended, ignoring");
        return false;
      }

      // Revert optimistic update
      const revertChess = new Chess();
      if (game.pgn) {
        revertChess.loadPgn(game.pgn);
      }
      setChess(revertChess);
      toast.error("Network error");
      return false;
    }
  };

  const resign = async () => {
    if (!game) return;

    const result = playerColor === 'white' ? 'black_wins' : 'white_wins';
    
    const { error } = await supabase
      .from('games')
      .update({
        status: 'completed',
        result
      })
      .eq('id', game.id);

    if (error) {
      toast.error('Failed to resign');
      return;
    }

    toast.success('You resigned the game');
  };

  return {
    game,
    chess,
    loading,
    playerColor,
    isPlayerTurn,
    makeMove,
    resign
  };
};
