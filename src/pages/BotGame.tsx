import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBotGame } from '@/hooks/useBotGame';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, RotateCcw, Brain, Zap, Target, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChessBoard3D } from '@/components/ChessBoard3D';
import { UniversalChessBoard } from '@/components/shared/UniversalChessBoard';
import type { Square } from 'chess.js';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

const BotGame = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const powerParam = searchParams.get('power');
  const power = powerParam ? parseInt(powerParam) : 50; // Default to 50 if no power specified
  const navigate = useNavigate();
  const { activeTheme, userPreferences, active3DTheme } = useTheme();
  const is3DMode = userPreferences?.is_3d_mode || false;
  const isMobile = useIsMobile();
  
  const { chess, playerColor, isPlayerTurn, makeMove, resetGame, isThinking, gameStatus, lastMove: botLastMove, gameId } = useBotGame(power);
  
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const changePower = (newPower: number) => {
    setSearchParams({ power: newPower.toString() });
    resetGame();
  };

  const adjustPower = (delta: number) => {
    const newPower = Math.max(0, Math.min(100, power + delta));
    changePower(newPower);
  };

  // ESC key handler to exit full-screen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullScreen]);

  const handleSquareClick = (square: Square) => {
    if (!isPlayerTurn || isThinking) return;

    const piece = chess.get(square);

    if (selectedSquare) {
      if (legalMoves.includes(square)) {
        makeMove(selectedSquare, square);
        setSelectedSquare(null);
        setLegalMoves([]);
      } else if (piece && piece.color === playerColor[0]) {
        setSelectedSquare(square);
        const moves = chess.moves({ square, verbose: true });
        setLegalMoves(moves.map(m => m.to as Square));
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    } else if (piece && piece.color === playerColor[0]) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalMoves(moves.map(m => m.to as Square));
    }
  };

  const getPowerInfo = () => {
    if (power <= 33) {
      return {
        color: 'text-green-400',
        bgColor: 'bg-green-500/10 border-green-500/30',
        range: 'Easy',
        description: 'Frequent mistakes • Good for practice'
      };
    } else if (power <= 66) {
      return {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10 border-yellow-500/30',
        range: 'Medium',
        description: 'Occasional mistakes • Tactical play'
      };
    } else {
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-500/10 border-red-500/30',
        range: 'Hard',
        description: 'Strong moves • Competitive strength'
      };
    }
  };

  const powerInfo = getPowerInfo();

  // Full-screen mode layout
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-background flex flex-col items-center justify-center p-0 m-0 overflow-hidden z-50 transition-all duration-300">
        {/* Full-screen controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <Button 
            variant="outline" 
            size="icon"
            onClick={resetGame} 
            className="border-border bg-background/80 backdrop-blur-sm"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setIsFullScreen(false)} 
            className="border-border bg-background/80 backdrop-blur-sm"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Game Status in Full Screen */}
        {gameStatus !== 'active' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <Card className="p-4 bg-card/90 backdrop-blur-sm border-border">
              <div className="text-center space-y-3">
                <p className="text-xl font-bold font-rajdhani text-primary">
                  {gameStatus === 'checkmate' && '🎉 Checkmate!'}
                  {gameStatus === 'draw' && '🤝 Draw!'}
                  {gameStatus === 'stalemate' && '🤝 Stalemate!'}
                </p>
                {gameId && (
                  <Button
                    variant="default"
                    onClick={() => navigate(`/replay/${gameId}`)}
                    className="bg-primary text-primary-foreground"
                  >
                    Replay Game
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {isThinking && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <Card className="p-3 bg-card/90 backdrop-blur-sm border-border">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-primary animate-pulse" />
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">Master is thinking</p>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Full-screen Chessboard */}
        <div className="flex items-center justify-center w-full h-full p-4">
          <div className="w-full h-full max-w-[min(95vw,95vh)] max-h-[95vh] aspect-square">
            <UniversalChessBoard
              chess={chess}
              onSquareClick={handleSquareClick}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={botLastMove ? { from: botLastMove.from, to: botLastMove.to } : null}
              isPlayerTurn={isPlayerTurn && !isThinking}
              playerColor="white"
              pieceColors={userPreferences?.custom_piece_colors}
              showCoordinates={true}
              highlightOpponentMove={botLastMove?.isOpponent}
            />
          </div>
        </div>
      </div>
    );
  }

  // Normal mode layout
  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Mobile Header */}
        {isMobile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/play')} 
                className="h-10 px-3"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <h1 className="text-xl font-bold font-rajdhani text-foreground">Bot Game</h1>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={resetGame}
                className="h-10 px-3"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Power Control */}
            <div className="relative bg-card border-2 border-primary/20 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => adjustPower(-10)}
                  className="h-10 w-10 flex-shrink-0"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <motion.div 
                  key={power}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 text-center"
                >
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${powerInfo.bgColor}`}>
                    <Brain className={`h-6 w-6 ${powerInfo.color}`} />
                    <div className="text-left">
                      <div className={`text-lg font-bold font-rajdhani ${powerInfo.color}`}>
                        POWER {power}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {powerInfo.description}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => adjustPower(10)}
                  className="h-10 w-10 flex-shrink-0"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                ← Adjust master power →
              </p>
            </div>
          </div>
        ) : (
          /* Desktop Header */
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Button variant="outline" onClick={() => navigate('/play')} className="border-border">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Play
            </Button>
            
            <div className="text-center flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold font-rajdhani text-foreground">Practice Mode</h1>
              <div className={`inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg border ${powerInfo.bgColor}`}>
                <Brain className={`h-5 w-5 ${powerInfo.color}`} />
                <span className={`text-lg font-semibold font-rajdhani ${powerInfo.color}`}>
                  POWER {power}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  {powerInfo.range} • {powerInfo.description}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetGame} className="border-border">
                <RotateCcw className="mr-2 h-4 w-4" />
                New Game
              </Button>
              <Button variant="default" onClick={() => setIsFullScreen(true)} className="bg-primary text-primary-foreground">
                <Maximize2 className="mr-2 h-4 w-4" />
                Full Screen
              </Button>
            </div>
          </div>
        )}

        {/* Game Status */}
        {gameStatus !== 'active' && (
          <Card className="p-6 bg-card border-border">
            <div className="text-center space-y-4">
              <div>
                <p className="text-2xl font-bold font-rajdhani text-primary">
                  {gameStatus === 'checkmate' && '🎉 Checkmate!'}
                  {gameStatus === 'draw' && '🤝 Draw!'}
                  {gameStatus === 'stalemate' && '🤝 Stalemate!'}
                </p>
                <p className="text-muted-foreground mt-2">
                  {gameStatus === 'checkmate' && chess.turn() === 'w' ? 'Black wins!' : gameStatus === 'checkmate' ? 'White wins!' : 'Game ended in a draw'}
                </p>
              </div>
              {gameId && (
                <Button
                  variant="default"
                  onClick={() => navigate(`/replay/${gameId}`)}
                  className="bg-primary text-primary-foreground"
                >
                  Replay Game
                </Button>
              )}
            </div>
          </Card>
        )}

        {isThinking && (
          <Card className="p-4 bg-card border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3">
                <Brain className="h-5 w-5 text-primary animate-pulse" />
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">Master is thinking</p>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
          {/* Chessboard - Better responsive sizing */}
          <div className={`${isMobile ? '' : 'lg:col-span-2'} flex justify-center items-center ${isMobile ? 'px-2' : ''}`}>
            <div 
              className="w-full aspect-square"
              style={{ 
                maxWidth: isMobile ? '100%' : 'min(70vh, 800px)',
                maxHeight: isMobile ? '100vw' : '70vh',
              }}
            >
              {is3DMode ? (
                <ChessBoard3D
                  chess={chess}
                  playerColor="white"
                  isPlayerTurn={isPlayerTurn && !isThinking}
                  onMove={async (from, to) => {
                    const success = makeMove(from as Square, to as Square);
                    return success;
                  }}
                  themeColors={active3DTheme ? {
                    lightSquare: active3DTheme.light_square_color,
                    darkSquare: active3DTheme.dark_square_color
                  } : undefined}
                />
              ) : (
                <UniversalChessBoard
                  chess={chess}
                  onSquareClick={handleSquareClick}
                  selectedSquare={selectedSquare}
                  legalMoves={legalMoves}
                  lastMove={botLastMove ? { from: botLastMove.from, to: botLastMove.to } : null}
                  isPlayerTurn={isPlayerTurn && !isThinking}
                  playerColor="white"
                  pieceColors={userPreferences?.custom_piece_colors}
                  showCoordinates={true}
                  highlightOpponentMove={botLastMove?.isOpponent}
                />
              )}
            </div>
          </div>

          {/* Move History & Info */}
          <div className={`space-y-3 sm:space-y-4 ${isMobile ? 'mt-4' : ''}`}>
            {/* Mobile: Compact Game Info */}
            {isMobile ? (
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-3 bg-card border-border text-center">
                  <div className="text-xs text-muted-foreground mb-1">You Play</div>
                  <div className="text-sm font-bold text-foreground">White</div>
                </Card>
                <Card className="p-3 bg-card border-border text-center">
                  <div className="text-xs text-muted-foreground mb-1">Turn</div>
                  <div className="text-sm font-bold text-foreground">
                    {chess.turn() === 'w' ? 'White' : 'Black'}
                  </div>
                </Card>
                <Card className="p-3 bg-card border-border text-center">
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div className="text-sm font-bold text-foreground">
                    {gameStatus === 'active' ? 'Active' : 'Ended'}
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold font-rajdhani text-lg text-foreground mb-3">Game Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You play:</span>
                    <span className="font-semibold text-foreground">White</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turn:</span>
                    <span className="font-semibold text-foreground">
                      {chess.turn() === 'w' ? 'White' : 'Black'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-semibold text-foreground">
                      {gameStatus === 'active' ? 'In Progress' : gameStatus}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            <Card className={`p-3 sm:p-4 bg-card border-border ${isMobile ? 'max-h-60' : 'max-h-96'} overflow-y-auto`}>
              <h3 className="font-semibold font-rajdhani text-base sm:text-lg text-foreground mb-2 sm:mb-3">Move History</h3>
              <div className="space-y-1">
                {chess.history().length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">No moves yet</p>
                ) : (
                  <div className={isMobile ? "grid grid-cols-2 gap-1" : "space-y-1"}>
                    {chess.history().map((move, i) => (
                      <div key={i} className={`text-xs sm:text-sm flex items-center gap-1 sm:gap-2 ${isMobile ? 'p-1.5 bg-background/50 rounded' : ''}`}>
                        <span className="text-muted-foreground text-xs">{Math.floor(i / 2) + 1}.</span>
                        <span className={i % 2 === 0 ? "text-foreground font-medium" : "text-muted-foreground"}>
                          {move}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotGame;
