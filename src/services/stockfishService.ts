// Stockfish service for managing chess AI engine
type Difficulty = 'easy' | 'moderate' | 'hard';

interface DifficultyConfig {
  skillLevel: number;
  depth: number;
  moveTime: number;
  randomness: number;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    skillLevel: 3,
    depth: 5,
    moveTime: 150,
    randomness: 0.4
  },
  moderate: {
    skillLevel: 8,
    depth: 7,
    moveTime: 350,
    randomness: 0.15
  },
  hard: {
    skillLevel: 10,
    depth: 10,
    moveTime: 700,
    randomness: 0.05
  }
};

export class StockfishService {
  private worker: Worker | null = null;
  private engineReady = false;
  private messageQueue: Array<(message: string) => void> = [];
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(
          new URL('../workers/stockfish.worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        this.worker.onmessage = (e: MessageEvent) => {
          const { type, message } = e.data;
          
          if (type === 'ready') {
            this.engineReady = true;
            this.sendCommand('uci');
            resolve();
          } else if (type === 'engine') {
            this.messageQueue.forEach(handler => handler(message));
          } else if (type === 'error') {
            console.error('Stockfish error:', message);
            reject(new Error(message));
          }
        };
        
        this.worker.onerror = (error) => {
          console.error('Worker error:', error);
          reject(error);
        };
        
        this.worker.postMessage({ type: 'init' });
      } catch (error) {
        console.error('Failed to initialize Stockfish worker:', error);
        reject(error);
      }
    });
    
    return this.initPromise;
  }

  private sendCommand(command: string): void {
    if (!this.worker || !this.engineReady) {
      console.warn('Engine not ready, command ignored:', command);
      return;
    }
    this.worker.postMessage({ type: 'command', payload: command });
  }

  async getBestMove(
    fen: string,
    difficulty: Difficulty
  ): Promise<string | null> {
    if (!this.engineReady) {
      console.warn('Engine not ready');
      return null;
    }

    const config = DIFFICULTY_CONFIGS[difficulty];
    
    // Stop any previous search
    this.sendCommand('stop');
    
    // Apply randomness for lower difficulties
    if (Math.random() < config.randomness) {
      // Return early to force a faster, less optimal move
      return this.getQuickMove(fen, difficulty);
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.sendCommand('stop');
        resolve(null);
      }, 1200); // Hard cap at 1.2s

      const messageHandler = (message: string) => {
        if (message.startsWith('bestmove')) {
          clearTimeout(timeout);
          const match = message.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
          const bestMove = match ? match[1] : null;
          
          // Remove this handler
          const index = this.messageQueue.indexOf(messageHandler);
          if (index > -1) this.messageQueue.splice(index, 1);
          
          resolve(bestMove);
        }
      };
      
      this.messageQueue.push(messageHandler);
      
      // Configure engine for this difficulty
      this.sendCommand('setoption name Skill Level value ' + config.skillLevel);
      this.sendCommand('setoption name UCI_LimitStrength value true');
      this.sendCommand('position fen ' + fen);
      this.sendCommand(`go depth ${config.depth} movetime ${config.moveTime}`);
    });
  }

  private async getQuickMove(fen: string, difficulty: Difficulty): Promise<string | null> {
    const config = DIFFICULTY_CONFIGS[difficulty];
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.sendCommand('stop');
        resolve(null);
      }, config.moveTime);

      const messageHandler = (message: string) => {
        if (message.startsWith('bestmove')) {
          clearTimeout(timeout);
          const match = message.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
          const bestMove = match ? match[1] : null;
          
          const index = this.messageQueue.indexOf(messageHandler);
          if (index > -1) this.messageQueue.splice(index, 1);
          
          resolve(bestMove);
        }
      };
      
      this.messageQueue.push(messageHandler);
      
      this.sendCommand('setoption name Skill Level value ' + Math.max(0, config.skillLevel - 2));
      this.sendCommand('position fen ' + fen);
      this.sendCommand(`go depth ${Math.max(1, config.depth - 2)} movetime ${Math.floor(config.moveTime * 0.6)}`);
    });
  }

  destroy(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
      this.worker.terminate();
      this.worker = null;
      this.engineReady = false;
      this.messageQueue = [];
    }
  }
}

export const stockfishService = new StockfishService();
