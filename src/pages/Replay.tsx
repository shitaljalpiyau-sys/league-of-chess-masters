import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chess } from "chess.js";
import { UniversalChessBoard } from "@/components/shared/UniversalChessBoard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { Square } from "chess.js";

const Replay = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<any>(null);
  const [chess] = useState(new Chess());
  const [moves, setMoves] = useState<string[]>([]);
  const [fenTimeline, setFenTimeline] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  useEffect(() => {
    if (!isPlaying || currentMoveIndex >= moves.length) return;

    const timeout = setTimeout(() => {
      nextMove();
    }, 1000 / playbackSpeed);

    return () => clearTimeout(timeout);
  }, [isPlaying, currentMoveIndex, playbackSpeed, moves.length]);

  const fetchGame = async () => {
    if (!gameId) return;

    // Try match_history first (completed games)
    const { data: historyData, error: historyError } = await supabase
      .from("match_history")
      .select("*")
      .eq("match_id", gameId)
      .single();

    if (historyData) {
      setGame(historyData);
      
      // Parse PGN to get moves
      const tempChess = new Chess();
      tempChess.loadPgn(historyData.pgn);
      const history = tempChess.history({ verbose: false });
      setMoves(history);
      
      // Use fen_history if available, otherwise generate
      if (historyData.fen_history && Array.isArray(historyData.fen_history)) {
        setFenTimeline(historyData.fen_history as string[]);
      } else {
        // Generate FEN timeline from PGN
        const fens: string[] = [new Chess().fen()];
        const genChess = new Chess();
        history.forEach(move => {
          genChess.move(move);
          fens.push(genChess.fen());
        });
        setFenTimeline(fens);
      }
      
      chess.reset();
      setLoading(false);
      return;
    }

    // Fallback to games table for ongoing games
    const { data, error } = await supabase
      .from("games")
      .select(`
        *,
        white_player:profiles!games_white_player_id_fkey(username, rating, class),
        black_player:profiles!games_black_player_id_fkey(username, rating, class)
      `)
      .eq("id", gameId)
      .single();

    if (error || !data) {
      toast.error("Game not found");
      navigate("/");
      return;
    }

    setGame(data);
    
    // Parse PGN to get moves
    const tempChess = new Chess();
    tempChess.loadPgn(data.pgn);
    const history = tempChess.history({ verbose: false });
    setMoves(history);
    
    // Generate FEN timeline
    const fens: string[] = [new Chess().fen()];
    const genChess = new Chess();
    history.forEach(move => {
      genChess.move(move);
      fens.push(genChess.fen());
    });
    setFenTimeline(fens);
    
    // Reset to initial position
    chess.reset();
    setLoading(false);
  };

  const nextMove = () => {
    if (currentMoveIndex >= moves.length) {
      setIsPlaying(false);
      return;
    }

    // Use FEN timeline for instant accurate board state
    if (fenTimeline[currentMoveIndex + 1]) {
      chess.load(fenTimeline[currentMoveIndex + 1]);
    } else {
      chess.move(moves[currentMoveIndex]);
    }
    
    // Update last move highlight
    const moveObj = chess.history({ verbose: true })[currentMoveIndex];
    if (moveObj) {
      setLastMove({ from: moveObj.from as Square, to: moveObj.to as Square });
    }
    
    setCurrentMoveIndex(currentMoveIndex + 1);
  };

  const prevMove = () => {
    if (currentMoveIndex === 0) return;

    // Use FEN timeline for accurate backward navigation
    if (fenTimeline[currentMoveIndex - 1]) {
      chess.load(fenTimeline[currentMoveIndex - 1]);
    } else {
      chess.undo();
    }
    
    // Update last move highlight
    if (currentMoveIndex > 1) {
      const moveObj = chess.history({ verbose: true })[currentMoveIndex - 2];
      if (moveObj) {
        setLastMove({ from: moveObj.from as Square, to: moveObj.to as Square });
      }
    } else {
      setLastMove(null);
    }
    
    setCurrentMoveIndex(currentMoveIndex - 1);
  };

  const jumpToMove = (moveIndex: number) => {
    setIsPlaying(false);
    
    // Use FEN timeline for instant jump
    if (fenTimeline[moveIndex]) {
      chess.load(fenTimeline[moveIndex]);
    } else {
      // Fallback to sequential moves
      chess.reset();
      for (let i = 0; i < moveIndex; i++) {
        chess.move(moves[i]);
      }
    }
    
    // Update last move highlight
    if (moveIndex > 0) {
      const moveObj = chess.history({ verbose: true })[moveIndex - 1];
      if (moveObj) {
        setLastMove({ from: moveObj.from as Square, to: moveObj.to as Square });
      }
    } else {
      setLastMove(null);
    }
    
    setCurrentMoveIndex(moveIndex);
  };

  const togglePlay = () => {
    if (currentMoveIndex >= moves.length) {
      // Restart from beginning
      chess.reset();
      setCurrentMoveIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    setIsPlaying(false);
    chess.reset();
    setCurrentMoveIndex(0);
  };

  const goToEnd = () => {
    setIsPlaying(false);
    chess.reset();
    moves.forEach((move) => chess.move(move));
    setCurrentMoveIndex(moves.length);
  };

  if (loading || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading replay...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="mb-4">
                <p className="text-lg font-bold">{game.white_player.username}</p>
                <p className="text-sm text-muted-foreground">
                  Class {game.white_player.class} • {game.white_player.rating}
                </p>
              </div>

              <UniversalChessBoard
                chess={chess}
                playerColor="white"
                isPlayerTurn={false}
                lastMove={lastMove}
                showCoordinates={true}
              />

              <div className="mt-4">
                <p className="text-lg font-bold text-right">{game.black_player.username}</p>
                <p className="text-sm text-muted-foreground text-right">
                  Class {game.black_player.class} • {game.black_player.rating}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Replay Controls</h3>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Move</span>
                <span className="font-bold">
                  {currentMoveIndex} / {moves.length}
                </span>
              </div>
              <Slider
                value={[currentMoveIndex]}
                max={moves.length}
                step={1}
                onValueChange={([value]) => jumpToMove(value)}
                className="mb-4"
              />
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              <Button
                onClick={restart}
                variant="outline"
                size="icon"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                onClick={prevMove}
                variant="outline"
                size="icon"
                disabled={currentMoveIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={togglePlay}
                size="icon"
                className="w-12 h-12"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button
                onClick={nextMove}
                variant="outline"
                size="icon"
                disabled={currentMoveIndex >= moves.length}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={goToEnd}
                variant="outline"
                size="icon"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Speed</span>
                <span className="font-bold">{playbackSpeed}x</span>
              </div>
              <Slider
                value={[playbackSpeed]}
                min={0.5}
                max={3}
                step={0.5}
                onValueChange={([value]) => setPlaybackSpeed(value)}
              />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Result</span>
                <span className="font-bold">{game.result || 'In Progress'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Control</span>
                <span className="font-bold">{game.time_control || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Moves</span>
                <span className="font-bold">{moves.length}</span>
              </div>
              {game.start_time && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-bold">
                    {Math.floor((new Date(game.end_time).getTime() - new Date(game.start_time).getTime()) / 60000)} min
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Replay;