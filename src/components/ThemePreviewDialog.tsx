import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Chess } from 'chess.js';
import { useMemo } from 'react';

interface ThemePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeName: string;
  lightSquareColor?: string;
  darkSquareColor?: string;
  pieceColors?: { white: string; black: string };
}

export const ThemePreviewDialog = ({
  open,
  onOpenChange,
  themeName,
  lightSquareColor = '#f0d9b5',
  darkSquareColor = '#b58863',
  pieceColors = { white: '#ffffff', black: '#000000' }
}: ThemePreviewDialogProps) => {
  const chess = useMemo(() => new Chess(), []);
  const board = chess.board();
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const getPieceSymbol = (piece: any) => {
    const symbols: Record<string, string> = {
      'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
    };
    return symbols[piece.type] || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-rajdhani text-2xl text-foreground">
            Preview: {themeName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center p-4">
          <div 
            className="inline-block border-4 border-border rounded-lg overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-8 gap-0">
              {ranks.map((rank) =>
                files.map((file) => {
                  const square = `${file}${rank}`;
                  const piece = board[8 - parseInt(rank)][files.indexOf(file)];
                  const isLight = (files.indexOf(file) + parseInt(rank)) % 2 === 0;

                  return (
                    <div
                      key={square}
                      style={{
                        '--light-square-base': lightSquareColor,
                        '--dark-square-base': darkSquareColor,
                      } as React.CSSProperties}
                      className={`
                        w-16 h-16 flex items-center justify-center text-4xl
                        transition-all duration-200
                        ${isLight ? 'chess-square-light' : 'chess-square-dark'}
                      `}
                    >
                      {piece && (
                        <span
                          style={{
                            color: piece.color === 'w' ? pieceColors.white : pieceColors.black,
                            filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3)) drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))'
                          }}
                        >
                          {getPieceSymbol(piece)}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* File labels */}
            <div className="flex justify-around py-1 bg-card">
              {files.map((file) => (
                <span key={file} className="text-xs text-muted-foreground font-semibold w-16 text-center">
                  {file.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};