// Minimal anime-style coach silhouette icon
export const CoachSilhouette = ({ className = "", size = 56 }: { className?: string; size?: number }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 56 56" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Head */}
      <circle 
        cx="28" 
        cy="16" 
        r="7" 
        stroke="currentColor" 
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Neck */}
      <path 
        d="M 28 23 L 28 28" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Suit - Shoulders and Body */}
      <path 
        d="M 18 28 L 22 28 L 24 32 L 24 44 L 20 48 M 38 28 L 34 28 L 32 32 L 32 44 L 36 48" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Torso - Center Suit */}
      <path 
        d="M 24 32 L 24 48 L 32 48 L 32 32 Z" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Suit Collar */}
      <path 
        d="M 24 28 L 28 32 L 32 28" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Arms */}
      <path 
        d="M 22 30 L 18 34 L 16 42" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path 
        d="M 34 30 L 38 34 L 40 42" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};
