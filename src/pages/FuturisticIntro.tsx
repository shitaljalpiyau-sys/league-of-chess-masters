import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIsMobile } from "@/hooks/use-mobile";
import { Crown, Zap, Trophy, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function FuturisticIntro() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [currentPanel, setCurrentPanel] = useState(0);

  useEffect(() => {
    if (isMobile) {
      // Mobile: Simple fade sequence
      const panels = gsap.utils.toArray(".intro-panel");
      panels.forEach((panel: any, i) => {
        gsap.fromTo(
          panel,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
              trigger: panel,
              start: "top 80%",
              end: "top 50%",
              scrub: 1,
            },
          }
        );
      });
      return;
    }

    // Desktop: Pinned scroll animation
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray(".intro-panel");
      
      // Pin the hero section
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: "top top",
        end: () => `+=${panels.length * 1000}`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const panelIndex = Math.floor(progress * panels.length);
          setCurrentPanel(panelIndex);
        },
      });

      // Animate each panel
      panels.forEach((panel, i) => {
        const panelElement = panel as Element;
        const isLast = i === panels.length - 1;
        
        gsap.fromTo(
          panelElement,
          {
            opacity: 0,
            scale: 0.8,
            y: 100,
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
              trigger: heroRef.current,
              start: `top+=${i * 1000} top`,
              end: `top+=${(i + 1) * 1000} top`,
              scrub: 1,
            },
          }
        );

        // Fade out previous panel
        if (i > 0) {
          gsap.to(panels[i - 1] as Element, {
            opacity: 0,
            scale: 0.8,
            scrollTrigger: {
              trigger: heroRef.current,
              start: `top+=${i * 1000} top`,
              end: `top+=${(i + 1) * 1000} top`,
              scrub: 1,
            },
          });
        }
      });

      // Animate chess pieces
      gsap.to(".chess-piece-1", {
        rotation: 360,
        y: -30,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      gsap.to(".chess-piece-2", {
        rotation: -360,
        y: 30,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      // Glow pulse
      gsap.to(".glow-text", {
        textShadow: "0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(147, 51, 234, 0.6)",
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [isMobile]);

  const handleLaunchApp = () => {
    navigate("/dashboard");
  };

  return (
    <div ref={containerRef} className="relative bg-background overflow-x-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="particle-bg" />
      </div>

      {/* Pinned Hero Section */}
      <div
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-purple-950/50 to-background animate-gradient" />
        
        {/* 3D Chess pieces */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="chess-piece-1 absolute text-blue-500 text-[200px] -left-20 top-1/4">
            <Crown className="w-full h-full" />
          </div>
          <div className="chess-piece-2 absolute text-purple-500 text-[200px] -right-20 bottom-1/4">
            <Trophy className="w-full h-full" />
          </div>
        </div>

        {/* Content panels */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">
          {/* Panel 1 */}
          <div className="intro-panel absolute inset-0 flex flex-col items-center justify-center">
            <h1 className="glow-text text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              CHESS LEAGUE
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Enter the Future of Chess
            </p>
          </div>

          {/* Panel 2 */}
          <div className="intro-panel absolute inset-0 flex flex-col items-center justify-center opacity-0">
            <Zap className="w-24 h-24 text-blue-400 mb-6 animate-pulse" />
            <h2 className="text-5xl md:text-7xl font-bold mb-4 text-foreground">
              Rise Across Leagues
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              From Bronze to Elite. Every match brings you closer to greatness.
            </p>
          </div>

          {/* Panel 3 */}
          <div className="intro-panel absolute inset-0 flex flex-col items-center justify-center opacity-0">
            <Sparkles className="w-24 h-24 text-purple-400 mb-6 animate-pulse" />
            <h2 className="text-5xl md:text-7xl font-bold mb-4 text-foreground">
              Challenge Anyone, Anytime
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              Real-time multiplayer. Friends. Rivals. Champions.
            </p>
          </div>

          {/* Panel 4 */}
          <div className="intro-panel absolute inset-0 flex flex-col items-center justify-center opacity-0">
            <Trophy className="w-24 h-24 text-blue-400 mb-6 animate-pulse" />
            <h2 className="text-5xl md:text-7xl font-bold mb-4 text-foreground">
              Earn XP. Level Up. Become Elite.
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              Every victory rewards you. Every challenge shapes you.
            </p>
          </div>

          {/* Panel 5 - Launch Button */}
          <div className="intro-panel absolute inset-0 flex flex-col items-center justify-center opacity-0">
            <button
              onClick={handleLaunchApp}
              className="group relative px-12 py-6 text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-3">
                Launch App
                <Crown className="w-8 h-8" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for scroll */}
      {!isMobile && <div style={{ height: "400vh" }} />}

      {/* Mobile panels */}
      {isMobile && (
        <div className="space-y-screen">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="intro-panel min-h-screen flex items-center justify-center p-6">
              {/* Content duplicated for mobile */}
            </div>
          ))}
          <div className="min-h-screen flex items-center justify-center">
            <button
              onClick={handleLaunchApp}
              className="px-12 py-6 text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:scale-110 transition-transform"
            >
              Launch App
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
