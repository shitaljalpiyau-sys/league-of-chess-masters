import { ReactNode, useEffect, useState, useRef } from "react";

interface LazySectionProps {
  children: ReactNode;
  threshold?: number;
  rootMargin?: string;
  fallbackHeight?: string;
}

/**
 * Lazy loads section content when it enters the viewport
 * Improves initial page load performance
 */
export const LazySection = ({ 
  children, 
  threshold = 0.1,
  rootMargin = "100px",
  fallbackHeight = "200px"
}: LazySectionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  if (!isVisible) {
    return (
      <div 
        ref={ref} 
        style={{ minHeight: fallbackHeight }}
        className="opacity-0"
      />
    );
  }

  return (
    <div ref={ref}>
      {children}
    </div>
  );
};
