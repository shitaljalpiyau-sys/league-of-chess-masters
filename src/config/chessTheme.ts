// Global chess theme configuration
// Single source of truth for all chessboard colors

export interface ChessTheme {
  lightSquareColor: string;
  darkSquareColor: string;
  highlightColor: string;
  lastMoveColor: string;
  checkColor: string;
  legalMoveColor: string;
  selectedColor: string;
  borderColor: string;
  coordinateColor: string;
}

export const DEFAULT_THEME: ChessTheme = {
  lightSquareColor: '#1D2E50',
  darkSquareColor: '#0F1A33',
  highlightColor: '#00E5FF',
  lastMoveColor: 'rgba(0, 229, 255, 0.3)',
  checkColor: 'rgba(255, 0, 0, 0.5)',
  legalMoveColor: '#00E5FF',
  selectedColor: '#00E5FF',
  borderColor: '#0F1A33',
  coordinateColor: '#1D2E50'
};

// Get current theme - ALWAYS return default theme to force consistency
export const getChessTheme = (
  customSquareColors?: { light: string; dark: string },
  themeColors?: { light_square_color: string; dark_square_color: string },
  useThemeBoards: boolean = true
): ChessTheme => {
  // FORCED DEFAULT THEME - ignore all user preferences and marketplace themes
  return DEFAULT_THEME;
};
