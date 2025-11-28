import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Crown, ArrowRight, Gamepad2, Github, MessageCircle, FileText, Info, Twitter
} from "lucide-react";
import { motion } from "framer-motion";
import { ClassSection } from "@/components/landing/ClassSection";
import { WeeklyRankFlow } from "@/components/landing/WeeklyRankFlow";
import { PointsEconomy } from "@/components/landing/PointsEconomy";
import { LiveStats } from "@/components/landing/LiveStats";
import { TournamentPreview } from "@/components/landing/TournamentPreview";
import { LazySection } from "@/components/landing/LazySection";
import { useIsMobile } from "@/hooks/use-mobile";

const Landing = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const openAuthModal = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />
        
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(217, 119, 6, 0.2) 2px, transparent 2px),
              linear-gradient(90deg, rgba(217, 119, 6, 0.2) 2px, transparent 2px)
            `,
            backgroundSize: "60px 60px",
            animation: "gridMove 20s linear infinite",
          }}
        />
        
        {/* Glowing Orbs */}
        <div className="fixed w-[800px] h-[800px] rounded-full blur-[150px] opacity-20 -top-[300px] -right-[300px] bg-gradient-radial from-primary to-transparent animate-pulse" />
        <div className="fixed w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 -bottom-[200px] -left-[200px] bg-gradient-radial from-amber-500 to-transparent animate-pulse" style={{ animationDelay: "3s" }} />
      </div>

      {/* Particles - reduced for mobile, fewer on mobile for performance */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {[...Array(isMobile ? 10 : 30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particleFloat ${8 + Math.random() * 12}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 8}s`,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-50 flex justify-between items-center px-4 sm:px-6 md:px-12 py-4 sm:py-6 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-primary drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]" />
          <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
            ELITE LEAGUE
          </span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden sm:flex gap-3"
        >
          <Button
            onClick={() => openAuthModal("signin")}
            variant="outline"
            className="border-primary/30 hover:border-primary hover:bg-primary/10 font-bold"
          >
            LOGIN
          </Button>
          <Button
            onClick={() => openAuthModal("signup")}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold shadow-lg hover:shadow-amber-500/50"
          >
            CREATE ACCOUNT
          </Button>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 px-4 sm:px-6">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center min-h-[85vh] sm:min-h-[90vh] text-center py-12 sm:py-20">
          {/* Chess Pieces Animation - Scaled for mobile */}
          <motion.div className={`mb-8 sm:mb-12 relative ${isMobile ? "w-48 h-48" : "w-64 h-64"}`}>
            {/* Center King (in check) */}
            <motion.div
              className={`absolute inset-0 flex items-center justify-center ${isMobile ? "text-6xl" : "text-8xl"}`}
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0],
                color: ["#d97706", "#f59e0b", "#d97706"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ♔
            </motion.div>
            
            {/* Queen Sliding */}
            <motion.div
              className={`absolute text-amber-500 ${isMobile ? "text-4xl" : "text-6xl"}`}
              animate={{
                x: isMobile ? [-60, 60, -60] : [-100, 100, -100],
                y: isMobile ? [-30, 30, -30] : [-50, 50, -50],
                rotate: [0, 360],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              ♕
            </motion.div>
            
            {/* Knight Jumping */}
            <motion.div
              className={`absolute text-primary ${isMobile ? "text-4xl" : "text-6xl"}`}
              animate={{
                x: isMobile ? [50, -50, 50] : [80, -80, 80],
                y: isMobile ? [40, -40, 40] : [60, -60, 60],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              ♘
            </motion.div>
            
            {/* Rook Moving - hidden on mobile for performance */}
            {!isMobile && (
              <motion.div
                className="absolute text-5xl text-purple-500"
                animate={{
                  x: [-80, -80, 80, 80, -80],
                  y: [80, -80, -80, 80, 80],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                ♖
              </motion.div>
            )}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-4 sm:mb-6 leading-tight px-4"
          >
            <span className="bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent animate-gradient">
              ELITE LEAGUE
            </span>
            <br />
            <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent">
              FUTURISTIC CHESS ARENA
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-16 max-w-3xl px-4"
          >
            Next-gen AI-powered chess battles, class ranks, and points economy
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="px-4"
          >
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              className={`${
                isMobile 
                  ? "text-lg px-8 py-6 h-auto" 
                  : "text-2xl px-16 py-10"
              } bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black shadow-[0_0_50px_rgba(217,119,6,0.6)] hover:shadow-[0_0_80px_rgba(217,119,6,0.8)] transition-all duration-300`}
            >
              LAUNCH APP <ArrowRight className={`ml-2 sm:ml-3 ${isMobile ? "w-5 h-5" : "w-8 h-8"}`} />
            </Button>
          </motion.div>
        </section>

        {/* Live Stats Section */}
        <LiveStats />

        {/* Class System Section - Lazy loaded */}
        <LazySection threshold={0.1} rootMargin="50px">
          <ClassSection />
        </LazySection>

        {/* Weekly Rank Progression - Lazy loaded */}
        <LazySection threshold={0.1} rootMargin="50px">
          <WeeklyRankFlow />
        </LazySection>

        {/* Points Economy - Lazy loaded */}
        <LazySection threshold={0.1} rootMargin="50px">
          <PointsEconomy />
        </LazySection>

        {/* Bot Gameplay Section */}
        <section className="py-16 sm:py-24 px-4 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-3 sm:mb-4 bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
              PLAY VS BOT — NO ACCOUNT NEEDED
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground">
              Try the platform instantly. No signup required.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { level: "Beginner", rating: "800", color: "from-green-500 to-green-600", difficulty: "Easy" },
              { level: "Intermediate", rating: "1500", color: "from-blue-500 to-blue-600", difficulty: "Medium" },
              { level: "Grandmaster", rating: "2500", color: "from-red-500 to-red-600", difficulty: "Hard" }
            ].map((bot, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
              >
                <Button
                  onClick={() => navigate("/bot-game")}
                  size="lg"
                  variant="outline"
                  className={`w-full h-auto flex-col gap-3 sm:gap-4 p-6 sm:p-8 border-2 hover:scale-105 transition-all duration-300 bg-gradient-to-br ${bot.color} bg-opacity-5 hover:bg-opacity-10 min-h-[140px]`}
                >
                  <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16" />
                  <div>
                    <div className="text-xl sm:text-2xl font-black mb-1 sm:mb-2">{bot.level} Bot</div>
                    <div className="text-sm text-muted-foreground">Rating: {bot.rating}</div>
                    <div className="text-xs text-muted-foreground mt-1">{bot.difficulty}</div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tournament Preview - Lazy loaded */}
        <LazySection threshold={0.1} rootMargin="50px">
          <TournamentPreview />
        </LazySection>

        {/* CTA Section */}
        <section className="py-16 sm:py-24 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
              READY TO DOMINATE?
            </h2>
            <p className="text-base sm:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto">
              Join thousands of players competing for glory and rewards
            </p>
            <Button
              onClick={() => openAuthModal("signup")}
              size="lg"
              className={`${
                isMobile 
                  ? "text-lg px-8 py-6 h-auto" 
                  : "text-2xl px-16 py-10"
              } bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black shadow-[0_0_50px_rgba(217,119,6,0.6)] hover:shadow-[0_0_80px_rgba(217,119,6,0.8)] transition-all duration-300`}
            >
              CREATE FREE ACCOUNT <ArrowRight className={`ml-2 sm:ml-3 ${isMobile ? "w-5 h-5" : "w-8 h-8"}`} />
            </Button>
          </motion.div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="relative z-20 border-t border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-8 h-8 text-primary" />
                <span className="text-xl font-black bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                  ELITE LEAGUE
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Next-gen AI-powered chess arena with class ranks and points economy.
              </p>
            </div>
            
            {/* About */}
            <div>
              <h4 className="font-black text-foreground mb-4">ABOUT</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><Info className="w-4 h-4" />About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><FileText className="w-4 h-4" />Roadmap</a></li>
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><MessageCircle className="w-4 h-4" />FAQ</a></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h4 className="font-black text-foreground mb-4">LEGAL</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
            
            {/* Social */}
            <div>
              <h4 className="font-black text-foreground mb-4">COMMUNITY</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-lg bg-card-dark border border-primary/20 hover:border-primary/60 flex items-center justify-center transition-all hover:scale-110">
                  <Twitter className="w-5 h-5 text-primary" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-card-dark border border-primary/20 hover:border-primary/60 flex items-center justify-center transition-all hover:scale-110">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-card-dark border border-primary/20 hover:border-primary/60 flex items-center justify-center transition-all hover:scale-110">
                  <Github className="w-5 h-5 text-primary" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-primary/20 pt-8 text-center text-sm text-muted-foreground">
            © 2024 Elite League. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
        
        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-120vh) translateX(60px); opacity: 0; }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;
