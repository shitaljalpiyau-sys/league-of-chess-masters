import { motion } from "framer-motion";
import { TrendingUp, Trophy, Shield, ArrowRight, ArrowDown, ArrowUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const WeeklyRankFlow = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl font-black mb-3 bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
            WEEKLY RANK SYSTEM
          </h2>
          <p className="text-base text-muted-foreground mb-2">
            Top 3 players promoted. Bottom 3 demoted. Every week resets.
          </p>
          <p className="text-sm text-primary font-medium">
            ↕ Scroll for full rules ↕
          </p>
        </motion.div>
        
        {/* Vertical Timeline for Mobile */}
        <div className="bg-gradient-to-br from-card/50 to-card-dark/50 backdrop-blur-sm border-2 border-primary/30 rounded-3xl p-6 space-y-8">
          {/* Promotion */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center border-2 border-green-500/50">
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-green-500 mb-2">PROMOTION</h3>
            <p className="text-sm text-muted-foreground mb-1">Finish in top 3 of your class</p>
            <p className="text-base text-foreground/90 font-medium">Move up one class level</p>
          </motion.div>
          
          {/* Arrow Down */}
          <motion.div
            className="flex justify-center"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex flex-col items-center">
              <ArrowDown className="w-8 h-8 text-primary mb-2" />
              <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
            </div>
          </motion.div>
          
          {/* Compete */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-2xl flex items-center justify-center border-2 border-amber-500/50">
              <Trophy className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-amber-500 mb-2">COMPETE</h3>
            <p className="text-sm text-muted-foreground mb-1">Play all week long</p>
            <p className="text-base text-foreground/90 font-medium">Your rating determines your position</p>
          </motion.div>
          
          {/* Arrow Down */}
          <motion.div
            className="flex justify-center"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            <div className="flex flex-col items-center">
              <ArrowDown className="w-8 h-8 text-primary mb-2" />
              <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
            </div>
          </motion.div>
          
          {/* Demotion */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl flex items-center justify-center border-2 border-red-500/50">
              <Shield className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-red-500 mb-2">DEMOTION</h3>
            <p className="text-sm text-muted-foreground mb-1">Finish in bottom 3 of your class</p>
            <p className="text-base text-foreground/90 font-medium">Move down one class level</p>
          </motion.div>
        </div>
      </section>
    );
  }

  // Desktop - horizontal layout
  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
          WEEKLY RANK SYSTEM
        </h2>
        <p className="text-xl text-muted-foreground">
          Top 3 players promoted. Bottom 3 demoted. Every week resets.
        </p>
      </motion.div>
      
      <div className="bg-gradient-to-br from-card/50 to-card-dark/50 backdrop-blur-sm border-2 border-primary/30 rounded-3xl p-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Promotion */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center border-2 border-green-500/50">
              <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-3xl font-black text-green-500 mb-3">PROMOTION</h3>
            <p className="text-muted-foreground mb-2">Finish in top 3</p>
            <p className="text-foreground/90 font-medium">↑ Move up one class</p>
          </motion.div>
          
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowRight className="w-16 h-16 text-primary rotate-90 md:rotate-0" />
          </motion.div>
          
          {/* Compete */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex-1 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-2xl flex items-center justify-center border-2 border-amber-500/50">
              <Trophy className="w-12 h-12 text-amber-500" />
            </div>
            <h3 className="text-3xl font-black text-amber-500 mb-3">COMPETE</h3>
            <p className="text-muted-foreground mb-2">Play all week</p>
            <p className="text-foreground/90 font-medium">Rating = Position</p>
          </motion.div>
          
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            <ArrowRight className="w-16 h-16 text-primary rotate-90 md:rotate-0" />
          </motion.div>
          
          {/* Demotion */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl flex items-center justify-center border-2 border-red-500/50">
              <Shield className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-3xl font-black text-red-500 mb-3">DEMOTION</h3>
            <p className="text-muted-foreground mb-2">Finish in bottom 3</p>
            <p className="text-foreground/90 font-medium">↓ Move down one class</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
