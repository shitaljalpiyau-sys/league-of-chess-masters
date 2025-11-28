// Chess sound effects utility
export class ChessSounds {
  private static moveSound: HTMLAudioElement | null = null;
  private static captureSound: HTMLAudioElement | null = null;
  private static checkSound: HTMLAudioElement | null = null;
  private static gameEndSound: HTMLAudioElement | null = null;
  
  private static initialized = false;
  
  static initialize() {
    if (this.initialized) return;
    
    // Create simple audio using Web Audio API for cross-browser compatibility
    this.initialized = true;
  }
  
  private static createBeep(frequency: number, duration: number, volume: number = 0.3) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      console.log('Audio not supported');
    }
  }
  
  static playMove() {
    this.createBeep(400, 0.1, 0.2);
  }
  
  static playCapture() {
    this.createBeep(300, 0.15, 0.25);
    setTimeout(() => this.createBeep(250, 0.1, 0.2), 80);
  }
  
  static playCheck() {
    this.createBeep(600, 0.1, 0.3);
    setTimeout(() => this.createBeep(700, 0.1, 0.3), 100);
  }
  
  static playGameEnd() {
    this.createBeep(500, 0.15, 0.3);
    setTimeout(() => this.createBeep(600, 0.15, 0.3), 150);
    setTimeout(() => this.createBeep(700, 0.3, 0.3), 300);
  }
}
