import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBotGame } from '@/hooks/useBotGame';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, RotateCcw, Brain, Zap, Target, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChessBoard3D } from '@/components/ChessBoard3D';
import { UniversalChessBoard } from '@/components/shared/UniversalChessBoard';
import { BotThinkingIndicator } from '@/components/BotThinkingIndicator';
import type { Square } from 'chess.js';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

const BotGame = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const difficulty = (searchParams.get('difficulty') || 'moderate') as 'easy' | 'moderate' | 'hard';
  const navigate = useNavigate();
  const { activeTheme, userPreferences, active3DTheme } = useTheme();
  const is3DMode = userPreferences?.is_3d_mode || false;
  const isMobile = useIsMobile();
  
  const { chess, playerColor, isPlayerTurn, makeMove, resetGame, isThinking, gameStatus } = useBotGame(difficulty);
  
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);

  const difficulties: Array<'easy' | 'moderate' | 'hard'> = ['easy', 'moderate', 'hard'];
  const currentIndex = difficulties.indexOf(difficulty);

  const changeDifficulty = (newDifficulty: 'easy' | 'moderate' | 'hard') => {
    setSearchParams({ difficulty: newDifficulty });
    resetGame();
    setShowDifficultySelector(false);
  };

  const nextDifficulty = () => {
    const nextIndex = (currentIndex + 1) % difficulties.length;
    changeDifficulty(difficulties[nextIndex]);
  };

  const prevDifficulty = () => {
    const prevIndex = (currentIndex - 1 + difficulties.length) % difficulties.length;
    changeDifficulty(difficulties[prevIndex]);
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
        const success = makeMove(selectedSquare, square);
        if (success) {
          setLastMove({ from: selectedSquare, to: square });
        }
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

  const getDifficultyInfo = () => {
    switch (difficulty) {
      case 'easy':
        return { 
          color: 'text-green-400', 
          bgColor: 'bg-green-500/10 border-green-500/30',
          icon: Zap,
          description: 'Basic moves, makes mistakes'
        };
      case 'moderate':
        return { 
          color: 'text-yellow-400', 
          bgColor: 'bg-yellow-500/10 border-yellow-500/30',
          icon: Target,
          description: 'Tactical play, depth 2'
        };
      case 'hard':
        return { 
          color: 'text-red-400', 
          bgColor: 'bg-red-500/10 border-red-500/30',
          icon: Brain,
          description: 'Advanced AI, depth 4+'
        };
      default:
        return { 
          color: 'text-muted-foreground', 
          bgColor: 'bg-secondary',
          icon: Target,
          description: ''
        };
    }
  };

  const difficultyInfo = getDifficultyInfo();
  const DifficultyIcon = difficultyInfo.icon;

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
              <div className="text-center">
                <p className="text-xl font-bold font-rajdhani text-primary">
                  {gameStatus === 'checkmate' && '🎉 Checkmate!'}
                  {gameStatus === 'draw' && '🤝 Draw!'}
                  {gameStatus === 'stalemate' && '🤝 Stalemate!'}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Bot Thinking Indicator - Floating */}
        <BotThinkingIndicator difficulty={difficulty} show={isThinking} />

        {/* Full-screen Chessboard */}
        <div className="flex items-center justify-center w-full h-full p-4">
          <div className="w-full h-full max-w-[min(95vw,95vh)] max-h-[95vh] aspect-square">
            <UniversalChessBoard
              chess={chess}
              onSquareClick={handleSquareClick}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={lastMove}
              isPlayerTurn={isPlayerTurn && !isThinking}
              playerColor="white"
              pieceColors={userPreferences?.custom_piece_colors}
              showCoordinates={true}
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

            {/* Mobile Difficulty Swiper */}
            <div className="relative bg-card border-2 border-primary/20 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevDifficulty}
                  className="h-10 w-10 flex-shrink-0"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <motion.div 
                  key={difficulty}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 text-center"
                >
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${difficultyInfo.bgColor}`}>
                    <DifficultyIcon className={`h-6 w-6 ${difficultyInfo.color}`} />
                    <div className="text-left">
                      <div className={`text-lg font-bold font-rajdhani ${difficultyInfo.color}`}>
                        {difficulty.toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {difficultyInfo.description}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextDifficulty}
                  className="h-10 w-10 flex-shrink-0"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                ← Swipe to change difficulty →
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
              <div className={`inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg border ${difficultyInfo.bgColor}`}>
                <DifficultyIcon className={`h-5 w-5 ${difficultyInfo.color}`} />
                <span className={`text-lg font-semibold font-rajdhani ${difficultyInfo.color}`}>
                  {difficulty.toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  {difficultyInfo.description}
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
            <div className="text-center">
              <p className="text-2xl font-bold font-rajdhani text-primary">
                {gameStatus === 'checkmate' && '🎉 Checkmate!'}
                {gameStatus === 'draw' && '🤝 Draw!'}
                {gameStatus === 'stalemate' && '🤝 Stalemate!'}
              </p>
              <p className="text-muted-foreground mt-2">
                {gameStatus === 'checkmate' && chess.turn() === 'w' ? 'Black wins!' : gameStatus === 'checkmate' ? 'White wins!' : 'Game ended in a draw'}
              </p>
            </div>
          </Card>
        )}

        {/* Bot Thinking Indicator - Floating for normal mode */}
        <BotThinkingIndicator difficulty={difficulty} show={isThinking} />

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
                  lastMove={lastMove}
                  isPlayerTurn={isPlayerTurn && !isThinking}
                  playerColor="white"
                  pieceColors={userPreferences?.custom_piece_colors}
                  showCoordinates={true}
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
