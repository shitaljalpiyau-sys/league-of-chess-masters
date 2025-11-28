// Stockfish WebWorker wrapper for chess AI
let stockfish: any = null;
let currentSearch: any = null;

// Initialize Stockfish engine
const initStockfish = async () => {
  const Stockfish = await import('stockfish.js');
  stockfish = new Stockfish();
  
  stockfish.onmessage = (message: string) => {
    self.postMessage({ type: 'engine', message });
  };
};

// Handle messages from main thread
self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;
  
  if (type === 'init') {
    await initStockfish();
    self.postMessage({ type: 'ready' });
    return;
  }
  
  if (type === 'command') {
    if (!stockfish) {
      self.postMessage({ type: 'error', message: 'Engine not initialized' });
      return;
    }
    
    stockfish.postMessage(payload);
  }
  
  if (type === 'stop') {
    if (stockfish) {
      stockfish.postMessage('stop');
    }
  }
};

export {};
