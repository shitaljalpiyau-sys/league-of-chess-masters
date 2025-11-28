import { useParams, useNavigate } from "react-router-dom";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, MessageSquare, X, PanelLeftClose, PanelLeft } from "lucide-react";
import { MultiplayerChessBoard } from "@/components/MultiplayerChessBoard";
import { GameChat } from "@/components/GameChat";
import { useState, useEffect } from "react";
import { CapturedPieces } from "@/components/CapturedPieces";
import { TurnIndicator } from "@/components/TurnIndicator";
import { GameResultBanner } from "@/components/GameResultBanner";
import { ThinMoveHistory } from "@/components/ThinMoveHistory";
import { motion } from "framer-motion";
import { useSidebar } from "@/components/ui/sidebar";

const Game = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { game, chess, loading, playerColor, isPlayerTurn, makeMove, resign } = useMultiplayerGame(id || null);
  const [fullscreen, setFullscreen] = useState(false);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [chatVisible, setChatVisible] = useState(true);
  const [moveHistoryVisible, setMoveHistoryVisible] = useState(true);
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();

  // Keep sidebar toggleable during gameplay
  useEffect(() => {
    // Don't auto-close sidebar, let user control it
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [fullscreen]);

  useEffect(() => {
    if (game?.spectator_count !== undefined) {
      setSpectatorCount(game.spectator_count);
    }
  }, [game?.spectator_count]);

  if (!game) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 flex items-center justify-center bg-background z-50"
      >
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold font-rajdhani text-destructive mb-2">Game not found</h2>
          <p className="text-muted-foreground mb-4">This game may have been deleted or doesn't exist</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/challenges')}>View Challenges</Button>
            <Button onClick={() => navigate('/play')} variant="outline">Quick Match</Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`${fullscreen ? 'fixed inset-0 z-[9999] bg-background' : 'fixed bg-background'} flex overflow-hidden`}
      style={!fullscreen ? {
        left: sidebarOpen ? 'clamp(200px, 20vw, 250px)' : '3.5rem',
        top: '3.5rem',
        right: 0,
        bottom: 0,
        transition: 'left 300ms ease-in-out'
      } : {}}
    >
      {/* Sidebar Toggle - Always visible above chat */}
      {!fullscreen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-16 z-[100] bg-card/90 backdrop-blur-sm hover:bg-accent transition-colors shadow-lg"
          style={{
            left: sidebarOpen ? 'calc(clamp(200px, 20vw, 250px) + 0.5rem)' : '4rem'
          }}
          title={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </Button>
      )}

      {/* Chat Panel - Left Side */}
      <div 
        className={`
          flex-shrink-0 border-r border-border bg-card z-10
          transition-all duration-300 ease-in-out
          ${chatVisible ? 'w-80' : 'w-0 overflow-hidden'}
        `}
        style={{ 
          height: '100%'
        }}
      >
        {chatVisible && (
          <GameChat 
            gameId={id!} 
            fullscreen={fullscreen}
            opponentName={
              playerColor === 'white' 
                ? 'Black Player'
                : 'White Player'
            }
            spectatorCount={spectatorCount}
            onResign={game.status === 'active' ? resign : undefined}
            whitePlayerId={game.white_player_id}
            blackPlayerId={game.black_player_id}
          />
        )}
      </div>

      {/* Chat Toggle Button - Only in fullscreen mode */}
      {fullscreen && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setChatVisible(!chatVisible)}
          className={`
            absolute top-4 z-50
            transition-all duration-300
            ${chatVisible ? 'left-[19.5rem]' : 'left-2'}
            bg-card/95 backdrop-blur-sm hover:bg-accent
          `}
        >
          {chatVisible ? <X className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
        </Button>
      )}

      {/* Main Game Area - Center */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Turn Indicator - Small pill, top right */}
        <div className="absolute top-3 right-3 z-40">
          <TurnIndicator 
            currentTurn={game.current_turn}
            playerColor={playerColor as 'white' | 'black'}
            isPlayerTurn={isPlayerTurn}
            status={game.status}
          />
        </div>

        {/* Fullscreen Exit Button */}
        {fullscreen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(false)}
            className="absolute top-3 left-3 z-40 bg-card/90 backdrop-blur-md"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Exit Fullscreen
          </Button>
        )}

        {/* Game Result Banner */}
        {game.status === 'completed' && game.result && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
            <GameResultBanner 
              result={game.result}
              playerColor={playerColor as 'white' | 'black'}
            />
          </div>
        )}

        {/* Board Container - Center with auto-fit */}
        <div className="flex-1 flex items-center justify-center p-2">
          <div 
            className="aspect-square"
            style={{ 
              width: fullscreen 
                ? 'min(95vh, 90vw)' 
                : `min(calc(100vh - 5rem), calc(100vw - ${chatVisible ? '20rem' : '0rem'} - ${moveHistoryVisible ? '8rem' : '2rem'} - ${sidebarOpen ? '16rem' : '4rem'}))`,
              maxWidth: fullscreen ? '95vh' : 'calc(100vh - 5rem)',
              margin: '0 0.5rem'
            }}
          >
            <MultiplayerChessBoard
              chess={chess}
              playerColor={playerColor as 'white' | 'black'}
              isPlayerTurn={isPlayerTurn}
              onMove={makeMove}
            />
          </div>
        </div>

        {/* Bottom Bar - Captured pieces */}
        <div className="h-12 border-t border-border bg-card/50 backdrop-blur-sm flex items-center justify-center px-4 flex-shrink-0">
          <CapturedPieces 
            chess={chess}
            playerColor={playerColor as 'white' | 'black'}
          />
        </div>

        {/* Fullscreen Toggle - Bottom Right */}
        {!fullscreen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(true)}
            className="absolute bottom-14 right-4 z-40 bg-card/90 backdrop-blur-sm hover:bg-accent"
            title="Enter Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Move History Panel - Right Side (thin, collapsible) */}
      <div 
        className={`
          flex-shrink-0 border-l border-border bg-card/30 relative
          transition-all duration-300 ease-in-out
          ${moveHistoryVisible ? 'w-32' : 'w-8'}
        `}
        style={{ 
          height: '100%'
        }}
      >
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMoveHistoryVisible(!moveHistoryVisible)}
          className="absolute top-3 left-1 z-20 h-6 w-6 p-0 hover:bg-accent"
          title={moveHistoryVisible ? 'Hide Move History' : 'Show Move History'}
        >
          {moveHistoryVisible ? '›' : '‹'}
        </Button>
        
        {moveHistoryVisible && (
          <ThinMoveHistory 
            pgn={game.pgn}
            playerColor={playerColor as 'white' | 'black'}
          />
        )}
      </div>
    </motion.div>
  );
};

export default Game;
