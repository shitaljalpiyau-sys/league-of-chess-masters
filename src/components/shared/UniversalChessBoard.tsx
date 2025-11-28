import { useState, useEffect } from 'react';
import type { Chess, Square } from 'chess.js';
import { getChessTheme, type ChessTheme } from '@/config/chessTheme';
import { ChessPieceSVG } from './ChessPieceSVG';

interface UniversalChessBoardProps {
  chess: Chess;
  onSquareClick?: (square: Square) => void;
  selectedSquare?: Square | null;
  legalMoves?: Square[];
  lastMove?: { from: Square; to: Square } | null;
  isPlayerTurn?: boolean;
  playerColor?: 'white' | 'black';
  customTheme?: Partial<ChessTheme>;
  customSquareColors?: { light: string; dark: string };
  themeColors?: { light_square_color: string; dark_square_color: string };
  showCoordinates?: boolean;
  pieceColors?: { white: string; black: string };
  isPremium?: boolean;
  highlightOpponentMove?: boolean;
}

// Board now uses container-based sizing via CSS Grid
// Each square will be 1/8th of the container width/height

export const UniversalChessBoard = ({
  chess,
  onSquareClick,
  selectedSquare = null,
  legalMoves = [],
  lastMove = null,
  isPlayerTurn = true,
  playerColor = 'white',
  customTheme,
  customSquareColors,
  themeColors,
  showCoordinates = true,
  pieceColors = { white: '#ffffff', black: '#000000' },
  isPremium = false,
  useThemeBoards = true,
  highlightOpponentMove = false
}: UniversalChessBoardProps & { useThemeBoards?: boolean }) => {
  const [animatingPiece, setAnimatingPiece] = useState<{ from: Square; to: Square; captured?: boolean } | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);
  
  useEffect(() => {
    if (lastMove) {
      const piece = chess.get(lastMove.to);
      setAnimatingPiece({ ...lastMove, captured: !!piece });
      const timer = setTimeout(() => setAnimatingPiece(null), 500);
      return () => clearTimeout(timer);
    }
  }, [lastMove, chess]);
  
  const board = chess.board();
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = playerColor === 'white' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  const theme = { ...getChessTheme(customSquareColors, themeColors, useThemeBoards), ...customTheme };

  const handleClick = (square: Square) => {
    if (onSquareClick) {
      onSquareClick(square);
    }
  };

  const isLightSquare = (file: string, rank: string) => {
    return (files.indexOf(file) + parseInt(rank)) % 2 === 0;
  };

  return (
    <div className="relative w-full h-full inline-block animate-fade-in" style={{ animationDuration: '0.3s' }}>
      <div 
        className={`
          w-full h-full border-4 rounded-lg overflow-hidden shadow-2xl
          ${isPremium ? 'ring-4 ring-primary/30 shadow-primary/20 animate-pulse' : ''}
        `}
        style={{ borderColor: theme.borderColor }}
      >
        <div className="w-full h-full grid grid-cols-8 grid-rows-8">
          {ranks.map((rank) =>
            files.map((file) => {
              const square = `${file}${rank}` as Square;
              const piece = board[8 - parseInt(rank)][files.indexOf(file)];
              const isLight = isLightSquare(file, rank);
              const isSelected = selectedSquare === square;
              const isLegalMove = legalMoves.includes(square);
              const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square);
              const isOpponentHighlight = highlightOpponentMove && isLastMoveSquare;
              const isAnimating = animatingPiece?.from === square || animatingPiece?.to === square;

              return (
                <div
                  key={square}
                  data-square={square}
                  onMouseEnter={() => isPlayerTurn && setHoveredSquare(square)}
                  onMouseLeave={() => setHoveredSquare(null)}
                  style={{ 
                    '--light-square-base': theme.lightSquareColor,
                    '--dark-square-base': theme.darkSquareColor,
                  } as React.CSSProperties}
                  className={`
                    w-full h-full flex items-center justify-center cursor-pointer
                    relative transition-all duration-300 ease-out
                    ${isLight ? 'chess-square-light' : 'chess-square-dark'}
                    ${isSelected ? 'ring-4 ring-inset ring-primary scale-[1.08] z-10' : ''}
                    ${isOpponentHighlight ? 'after:absolute after:inset-0 after:bg-red-500/35 after:shadow-[inset_0_0_30px_rgba(239,68,68,0.8),0_0_30px_rgba(239,68,68,0.7)] after:rounded-md after:z-20' : isLastMoveSquare ? 'after:absolute after:inset-0 after:bg-blue-500/35 after:shadow-[inset_0_0_30px_rgba(59,139,255,0.8),0_0_30px_rgba(59,139,255,0.7)] after:rounded-md after:z-20' : ''}
                    ${isAnimating ? 'animate-[move-piece_0.5s_ease-out]' : ''}
                    ${isPlayerTurn ? 'hover:brightness-110 hover:scale-105' : 'cursor-not-allowed opacity-70'}
                    ${isLegalMove && hoveredSquare === square ? 'animate-[square-glow_1s_ease-in-out_infinite]' : ''}
                    ${isPremium ? 'hover:shadow-xl hover:shadow-primary/40' : ''}
                  `}
                  onClick={() => handleClick(square)}
                >
                  {piece && (
                    <div 
                      className={`
                        w-[85%] h-[85%] chess-piece select-none pointer-events-none transition-all duration-500 ease-out
                        ${piece.color === 'w' ? 'chess-piece-white' : 'chess-piece-black'}
                        ${isSelected ? 'chess-piece-selected' : ''}
                        ${animatingPiece?.from === square ? (animatingPiece.captured ? 'animate-[piece-capture_0.5s_ease-out_forwards]' : 'opacity-0 scale-50') : 'opacity-100 scale-100'}
                        ${animatingPiece?.to === square ? 'animate-[move-piece_0.5s_ease-out]' : ''}
                        ${hoveredSquare === square && isPlayerTurn ? 'scale-110 brightness-110' : ''}
                      `}
                    >
                      <ChessPieceSVG type={piece.type} color={piece.color} />
                    </div>
                  )}
                  {isLegalMove && (
                    <div className={`
                      absolute inset-0 flex items-center justify-center pointer-events-none z-10
                      transition-all duration-300
                      ${piece ? 'ring-4 ring-inset rounded-full animate-[square-glow_1.5s_ease-in-out_infinite]' : ''}
                    `}
                    style={{
                      boxShadow: piece 
                        ? `inset 0 0 25px rgba(163, 228, 77, 0.6), 0 0 25px rgba(163, 228, 77, 0.5)` 
                        : undefined,
                      borderColor: piece ? '#A3E44D' : undefined
                    }}
                    >
                      {!piece && (
                        <div className="w-4 h-4 rounded-full animate-[pulse-glow_1.5s_ease-in-out_infinite]" 
                          style={{
                            backgroundColor: 'rgba(163, 228, 77, 0.7)',
                            boxShadow: '0 0 15px rgba(163, 228, 77, 0.8), 0 0 25px rgba(163, 228, 77, 0.5)'
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Coordinates */}
      {showCoordinates && (
        <>
          {/* Files (A-H) at bottom */}
          <div className="absolute -bottom-6 left-0 right-0 flex justify-around px-2">
            {files.map(file => (
              <div 
                key={file} 
                className="w-[12.5%] text-center text-xs sm:text-sm font-semibold"
                style={{ color: theme.coordinateColor }}
              >
                {file.toUpperCase()}
              </div>
            ))}
          </div>
          
          {/* Ranks (1-8) on right */}
          <div className="absolute top-0 -right-6 sm:-right-8 flex flex-col justify-around h-full py-2">
            {ranks.map(rank => (
              <div 
                key={rank} 
                className="h-[12.5%] flex items-center text-xs sm:text-sm font-semibold"
                style={{ color: theme.coordinateColor }}
              >
                {rank}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
