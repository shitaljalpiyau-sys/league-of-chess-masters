import { useEffect } from "react";
import { gsap } from "gsap";

/**
 * Global animation effects applied across the entire platform
 * Handles smooth fade-ins, parallax, and micro-interactions
 */
export const GlobalAnimations = () => {
  useEffect(() => {
    // Fade in all cards on mount
    gsap.fromTo(
      ".card, .hover-lift",
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      }
    );

    // Subtle parallax on scroll
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const parallaxElements = document.querySelectorAll(".parallax-element");
      
      parallaxElements.forEach((el: any) => {
        const speed = el.dataset.speed || 0.5;
        gsap.to(el, {
          y: scrollY * parseFloat(speed),
          duration: 0.5,
          ease: "power1.out",
        });
      });
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return null;
};
