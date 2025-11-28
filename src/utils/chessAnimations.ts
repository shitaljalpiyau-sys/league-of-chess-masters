import type { Square } from 'chess.js';

export const animateMove = (fromSquare: Square, toSquare: Square, isPlayerMove: boolean) => {
  // Remove previous highlights
  document.querySelectorAll('.highlight-from, .highlight-to').forEach(el => {
    el.classList.remove('highlight-from', 'highlight-to');
  });

  // Add new highlights with player-specific colors
  requestAnimationFrame(() => {
    const fromElement = document.querySelector(`[data-square="${fromSquare}"]`);
    const toElement = document.querySelector(`[data-square="${toSquare}"]`);
    
    if (fromElement && toElement) {
      // Apply the highlight class
      fromElement.classList.add('highlight-from');
      toElement.classList.add('highlight-to');
      
      // Apply player-specific glow colors
      const glowClass = isPlayerMove ? 'highlight-player' : 'highlight-bot';
      fromElement.classList.add(glowClass);
      toElement.classList.add(glowClass);
    }
  });
};

export const clearMoveHighlights = () => {
  document.querySelectorAll('.highlight-from, .highlight-to, .highlight-player, .highlight-bot').forEach(el => {
    el.classList.remove('highlight-from', 'highlight-to', 'highlight-player', 'highlight-bot');
  });
};
