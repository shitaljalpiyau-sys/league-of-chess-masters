import { ReactNode, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobilePerformanceWrapperProps {
  children: ReactNode;
  reducedMotion?: boolean;
  lazyLoad?: boolean;
  threshold?: number;
}

/**
 * Wrapper component that optimizes performance on mobile devices
 * - Reduces animations and particle effects
 * - Lazy loads content when in viewport
 * - Uses GPU-accelerated transforms
 */
export const MobilePerformanceWrapper = ({ 
  children, 
  reducedMotion = true,
  lazyLoad = false,
  threshold = 0.1 
}: MobilePerformanceWrapperProps) => {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!lazyLoad || !elementRef) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(elementRef);

    return () => observer.disconnect();
  }, [lazyLoad, elementRef, threshold]);

  // Apply mobile-specific performance optimizations
  const wrapperStyle: React.CSSProperties = isMobile && reducedMotion ? {
    willChange: 'transform',
    transform: 'translateZ(0)', // Force GPU acceleration
  } : {};

  if (!isVisible) {
    return (
      <div 
        ref={setElementRef} 
        style={{ minHeight: '100px' }}
        className="opacity-0"
      />
    );
  }

  return (
    <div 
      ref={setElementRef}
      style={wrapperStyle}
      className="mobile-performance-wrapper"
    >
      {children}
    </div>
  );
};
