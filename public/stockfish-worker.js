// Stockfish WASM Worker - Local Build
// Load Stockfish from local files
self.importScripts('/stockfish.js');

let engine = null;

// Initialize engine
try {
  engine = STOCKFISH();
  console.log('✓ Stockfish WASM engine initialized');
} catch (e) {
  console.error('✗ Failed to initialize Stockfish:', e);
  postMessage({ error: 'Engine initialization failed' });
}

// Forward all messages from Stockfish to main thread
if (engine) {
  engine.onmessage = function(msg) {
    const text = msg.data ? msg.data : msg;
    postMessage(text);
  };
}

// Handle messages from main thread
self.onmessage = function(e) {
  if (engine) {
    engine.postMessage(e.data);
  } else {
    postMessage({ error: 'Engine not ready' });
  }
};

// Global error handler
self.onerror = function(err) {
  console.error('Worker error:', err);
  postMessage({ error: err.message || 'Unknown error' });
};
