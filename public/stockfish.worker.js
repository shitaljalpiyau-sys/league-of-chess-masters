// Stockfish Web Worker
// Load Stockfish from CDN
self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');

let engine = null;

// Initialize Stockfish engine
try {
  if (typeof STOCKFISH !== 'undefined') {
    engine = STOCKFISH();
    console.log('Stockfish engine initialized');
  } else {
    console.error('STOCKFISH not found after loading script');
  }
} catch (e) {
  console.error('Failed to initialize Stockfish:', e);
}

// Forward messages from engine to main thread
if (engine && typeof engine.addMessageListener === 'function') {
  engine.addMessageListener((message) => {
    postMessage(message);
  });
} else if (engine && typeof engine.onmessage === 'function') {
  engine.onmessage = (message) => {
    postMessage(message);
  };
}

// Forward messages from main thread to engine
self.onmessage = (e) => {
  if (engine && typeof engine.postMessage === 'function') {
    engine.postMessage(e.data);
  } else if (engine) {
    engine(e.data);
  }
};

// Error handling
self.onerror = (error) => {
  console.error('Worker error:', error);
  postMessage({ error: error.message });
};
