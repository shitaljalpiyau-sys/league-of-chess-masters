import { Chess } from 'chess.js';

interface CapturedPiecesProps {
  chess: Chess;
  playerColor: 'white' | 'black';
}

const pieceValues: { [key: string]: number } = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
};

const pieceSymbols: { [key: string]: string } = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚'
};

export const CapturedPieces = ({ chess, playerColor }: CapturedPiecesProps) => {
  const getCapturedPieces = () => {
    const board = chess.board();
    const allPieces = board.flat().filter(p => p !== null);
    
    // Count pieces on board
    const whitePieces = allPieces.filter(p => p?.color === 'w').length;
    const blackPieces = allPieces.filter(p => p?.color === 'b').length;
    
    // Starting pieces count
    const startingPieces: { [key: string]: number } = {
      p: 8, n: 2, b: 2, r: 2, q: 1, k: 1
    };
    
    const whiteCaptured: string[] = [];
    const blackCaptured: string[] = [];
    
    // Count each piece type on board
    const whitePieceCount: { [key: string]: number } = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
    const blackPieceCount: { [key: string]: number } = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
    
    allPieces.forEach(piece => {
      if (!piece) return;
      if (piece.color === 'w') {
        whitePieceCount[piece.type]++;
      } else {
        blackPieceCount[piece.type]++;
      }
    });
    
    // Calculate captured pieces
    Object.keys(startingPieces).forEach(type => {
      const whiteMissing = startingPieces[type] - whitePieceCount[type];
      const blackMissing = startingPieces[type] - blackPieceCount[type];
      
      for (let i = 0; i < whiteMissing; i++) {
        whiteCaptured.push(type);
      }
      for (let i = 0; i < blackMissing; i++) {
        blackCaptured.push(type);
      }
    });
    
    // Sort by value (highest first)
    whiteCaptured.sort((a, b) => pieceValues[b] - pieceValues[a]);
    blackCaptured.sort((a, b) => pieceValues[b] - pieceValues[a]);
    
    // Calculate material advantage
    const whiteValue = whiteCaptured.reduce((sum, p) => sum + pieceValues[p], 0);
    const blackValue = blackCaptured.reduce((sum, p) => sum + pieceValues[p], 0);
    
    return {
      white: whiteCaptured,
      black: blackCaptured,
      whiteAdvantage: blackValue - whiteValue,
      blackAdvantage: whiteValue - blackValue
    };
  };
  
  const captured = getCapturedPieces();
  const myCaptured = playerColor === 'white' ? captured.black : captured.white;
  const opponentCaptured = playerColor === 'white' ? captured.white : captured.black;
  const myAdvantage = playerColor === 'white' ? captured.whiteAdvantage : captured.blackAdvantage;
  
  return (
    <div className="space-y-2">
      {/* Opponent's captured pieces (what you captured) */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
        <div className="text-xs font-semibold text-muted-foreground min-w-[60px]">
          You took:
        </div>
        <div className="flex flex-wrap gap-0.5 flex-1">
          {myCaptured.map((piece, i) => (
            <span 
              key={i} 
              className="text-lg opacity-80 animate-scale-in"
              style={{ 
                color: playerColor === 'white' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                animationDelay: `${i * 50}ms`
              }}
            >
              {pieceSymbols[piece]}
            </span>
          ))}
          {myCaptured.length === 0 && (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
        {myAdvantage > 0 && (
          <div className="text-sm font-bold text-primary ml-auto">
            +{myAdvantage}
          </div>
        )}
      </div>
      
      {/* Your captured pieces (what opponent captured) */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
        <div className="text-xs font-semibold text-muted-foreground min-w-[60px]">
          They took:
        </div>
        <div className="flex flex-wrap gap-0.5 flex-1">
          {opponentCaptured.map((piece, i) => (
            <span 
              key={i} 
              className="text-lg opacity-80 animate-scale-in"
              style={{ 
                color: playerColor === 'black' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                animationDelay: `${i * 50}ms`
              }}
            >
              {pieceSymbols[piece]}
            </span>
          ))}
          {opponentCaptured.length === 0 && (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
      </div>
    </div>
  );
};
