import { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { UniversalChessBoard } from '@/components/shared/UniversalChessBoard';

interface MultiplayerChessBoardProps {
  chess: Chess;
  playerColor: 'white' | 'black' | null;
  isPlayerTurn: boolean;
  onMove: (from: string, to: string, promotion?: string) => Promise<boolean>;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const getPieceSymbol = (piece: { type: string; color: string }) => {
  const symbols: { [key: string]: string } = {
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
  };
  return symbols[piece.type];
};

export const MultiplayerChessBoard = ({ 
  chess, 
  playerColor, 
  isPlayerTurn,
  onMove,
  fullscreen = false,
  onToggleFullscreen
}: MultiplayerChessBoardProps) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square; isOpponent: boolean } | null>(null);
  const { activeTheme, userPreferences } = useTheme();

  // Track all moves - RED for opponent, BLUE for player
  // Logic: If it's now MY turn, the last move was OPPONENT's (RED)
  //        If it's now OPPONENT's turn, the last move was MINE (BLUE)
  useEffect(() => {
    const history = chess.history({ verbose: true });
    const moveCount = history.length;
    
    if (moveCount > 0) {
      const lastGameMove = history[moveCount - 1];
      const newMove = { 
        from: lastGameMove.from as Square, 
        to: lastGameMove.to as Square,
        isOpponent: isPlayerTurn // If it's my turn now, opponent just moved (RED)
      };
      
      // Update highlight whenever there's a new move
      if (!lastMove || lastMove.from !== newMove.from || lastMove.to !== newMove.to) {
        setLastMove(newMove);
      }
    }
  }, [chess.history().length, isPlayerTurn]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    onToggleFullscreen?.();
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && fullscreen) {
        onToggleFullscreen?.();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [fullscreen, onToggleFullscreen]);

  const handleSquareClick = async (square: Square) => {
    // Critical security: Block ALL interaction if it's not player's turn
    if (!isPlayerTurn) {
      return;
    }

    // Critical security: Validate square format
    if (!/^[a-h][1-8]$/.test(square)) {
      console.error("Invalid square format:", square);
      return;
    }

    if (!selectedSquare) {
      const piece = chess.get(square);
      
      // Critical security: Only allow selecting pieces that match player's color
      const playerChessColor = playerColor === 'white' ? 'w' : 'b';
      
      if (piece && piece.color === playerChessColor) {
        const moves = chess.moves({ square, verbose: true });
        setSelectedSquare(square);
        setLegalMoves(moves.map(m => m.to));
      } else if (piece) {
        // Attempted to select opponent's piece
        console.warn(`Player tried to select opponent's piece at ${square}`);
      }
    } else {
      if (legalMoves.includes(square)) {
        // Don't set lastMove here - let useEffect handle it after move completes
        // This ensures consistent highlight logic based on turn state
        
        // Disable further clicks while processing
        const processingFrom = selectedSquare;
        setSelectedSquare(null);
        setLegalMoves([]);
        
        const success = await onMove(processingFrom, square);
        
        if (!success) {
          // Move failed, allow retry
          console.log("Move failed, allowing retry");
        }
      } else {
        // Clicked outside legal moves, deselect
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    }
  };

  return (
    <div className="w-full h-full">
      <UniversalChessBoard
        chess={chess}
        onSquareClick={handleSquareClick}
        selectedSquare={selectedSquare}
        legalMoves={legalMoves as Square[]}
        lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : null}
        isPlayerTurn={isPlayerTurn}
        playerColor={playerColor || 'white'}
        customSquareColors={userPreferences?.custom_square_colors}
        themeColors={activeTheme ? {
          light_square_color: activeTheme.light_square_color,
          dark_square_color: activeTheme.dark_square_color
        } : undefined}
        pieceColors={userPreferences?.custom_piece_colors}
        isPremium={activeTheme?.is_premium}
        showCoordinates={true}
        useThemeBoards={userPreferences?.use_theme_boards !== false}
        highlightOpponentMove={lastMove?.isOpponent}
      />
    </div>
  );
};
