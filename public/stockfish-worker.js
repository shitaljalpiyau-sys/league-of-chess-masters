// Stockfish WASM Worker - Proper UCI Protocol Implementation
self.importScripts('https://stockfishchess.org/js/stockfish.js');

let engine = null;
let isReady = false;

function initEngine() {
  try {
    if (typeof STOCKFISH === 'undefined') {
      postMessage({ error: 'STOCKFISH not loaded from CDN' });
      return;
    }
    
    engine = STOCKFISH();
    
    // Handle messages from Stockfish
    engine.onmessage = function(msg) {
      const message = msg.data ? msg.data : msg;
      postMessage(message);
      
      // Track ready state
      if (message === 'readyok') {
        isReady = true;
      }
    };
    
    console.log('Stockfish engine initialized successfully');
  } catch (err) {
    console.error('Stockfish init error:', err);
    postMessage({ error: 'Stockfish init failed: ' + err.message });
  }
}

// Initialize engine on load
initEngine();

// Handle messages from main thread
self.onmessage = function(e) {
  const command = e.data;
  
  // Reinitialize if needed
  if (!engine) {
    initEngine();
  }
  
  // Forward command to engine
  if (engine && typeof engine.postMessage === 'function') {
    engine.postMessage(command);
  } else {
    postMessage({ error: 'Engine not ready' });
  }
};

// Error handling
self.onerror = function(err) {
  console.error('Worker error:', err);
  postMessage({ error: err.message || 'Unknown worker error' });
};
