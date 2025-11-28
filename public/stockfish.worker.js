// Stockfish Web Worker - UCI Protocol Handler
importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');

let stockfish = null;
let isReady = false;

// Initialize Stockfish
if (typeof STOCKFISH !== 'undefined') {
  stockfish = STOCKFISH();
  
  // Handle messages from Stockfish engine
  stockfish.onmessage = function(line) {
    // Forward all engine messages to main thread
    postMessage(line);
    
    // Track ready state
    if (line === 'readyok') {
      isReady = true;
    }
  };
  
  console.log('Stockfish worker initialized');
} else {
  console.error('STOCKFISH not available');
  postMessage('error: STOCKFISH not loaded');
}

// Handle messages from main thread
self.onmessage = function(e) {
  const command = e.data;
  
  if (stockfish) {
    stockfish.postMessage(command);
  } else {
    postMessage('error: engine not initialized');
  }
};
