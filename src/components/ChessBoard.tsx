import { useState } from "react";
import { Chess, Square } from "chess.js";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { UniversalChessBoard } from "@/components/shared/UniversalChessBoard";

export const ChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const { activeTheme, userPreferences } = useTheme();

  const handleSquareClick = (square: Square) => {
    if (selectedSquare) {
      try {
        const gameCopy = new Chess(game.fen());
        const result = gameCopy.move({
          from: selectedSquare,
          to: square,
          promotion: "q",
        });
        
        if (result) {
          setLastMove({ from: selectedSquare, to: square });
          setGame(gameCopy);
          setMoveHistory([...moveHistory, result.san]);
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }
      } catch (error) {
        console.log("Invalid move");
      }
    }
    
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map(m => m.to as Square));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="w-full aspect-square max-w-3xl mx-auto">
          <UniversalChessBoard
            chess={game}
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            customSquareColors={userPreferences?.custom_square_colors}
            themeColors={activeTheme ? {
              light_square_color: activeTheme.light_square_color,
              dark_square_color: activeTheme.dark_square_color
            } : undefined}
            pieceColors={userPreferences?.custom_piece_colors}
            isPremium={activeTheme?.is_premium}
            showCoordinates={true}
            useThemeBoards={userPreferences?.use_theme_boards !== false}
          />
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-rajdhani">Controls</h2>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="mr-2 h-4 w-4" />
            New Game
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Game Status</h3>
          <p className="text-sm text-muted-foreground">
            {game.isCheckmate() && "Checkmate! Game Over"}
            {game.isDraw() && "Draw!"}
            {game.isStalemate() && "Stalemate!"}
            {game.isCheck() && !game.isCheckmate() && "Check!"}
            {!game.isGameOver() && !game.isCheck() && `${game.turn() === 'w' ? 'White' : 'Black'} to move`}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Move History</h3>
          {moveHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No moves yet</p>
          ) : (
            <div className="space-y-1">
              {moveHistory.map((move, i) => (
                <div key={i} className="text-sm flex items-center gap-2">
                  <span className="text-muted-foreground">{Math.floor(i / 2) + 1}.</span>
                  <span className={i % 2 === 0 ? "text-foreground font-medium" : "text-muted-foreground"}>
                    {move}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
