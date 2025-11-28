declare module 'stockfish' {
  interface StockfishEngine {
    postMessage(command: string): void;
    onmessage: (event: MessageEvent | string) => void;
    terminate?: () => void;
  }

  function Stockfish(): StockfishEngine;
  export default Stockfish;
}
