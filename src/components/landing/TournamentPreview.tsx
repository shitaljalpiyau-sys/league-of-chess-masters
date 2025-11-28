import { motion } from "framer-motion";
import { Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import useEmblaCarousel from "embla-carousel-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const tournaments = [
  { name: "Elite Championship", prize: "$10,000", players: "128", time: "2h 45m", featured: true },
  { name: "Weekly Blitz", prize: "$2,500", players: "256", time: "5h 12m", featured: false },
  { name: "Rookie Arena", prize: "$500", players: "512", time: "1d 3h", featured: false },
  { name: "Speed Masters", prize: "$1,500", players: "64", time: "3h 30m", featured: false }
];

export const TournamentPreview = () => {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("all");
  const [emblaRef] = useEmblaCarousel({ 
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true 
  });

  if (isMobile) {
    return (
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl sm:text-4xl font-black mb-3 bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
            UPCOMING TOURNAMENTS
          </h2>
          <p className="text-base text-muted-foreground mb-4">
            Compete for glory and massive prize pools
          </p>
          
          {/* Mobile Filter Dropdown */}
          <div className="flex justify-center mb-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px] h-11 border-primary/30 bg-card">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tournaments</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="weekly">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>
        
        {/* Horizontal Scroll for Mobile */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 pb-4">
            {tournaments.map((tournament, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex-[0_0_85%] sm:flex-[0_0_70%]"
              >
                <div className="bg-gradient-to-br from-card/80 to-card-dark/80 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-6 hover:border-primary/60 transition-all duration-300 h-full flex flex-col">
                  {tournament.featured && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 border border-primary/40 rounded-full text-xs font-bold text-primary mb-3 self-start">
                      ⭐ Featured
                    </div>
                  )}
                  
                  <Trophy className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-black text-foreground mb-4">{tournament.name}</h3>
                  
                  <div className="space-y-2.5 flex-1">
                    <div className="flex justify-between items-center p-2.5 bg-background/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Prize</span>
                      <span className="text-lg font-black text-primary">{tournament.prize}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-background/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Players</span>
                      <span className="text-base font-bold text-foreground">{tournament.players}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-background/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Starts in</span>
                      <span className="text-base font-bold text-amber-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {tournament.time}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full h-11 mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
                  >
                    Register Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-primary font-medium mt-4">
          ← Swipe to see more →
        </p>
      </section>
    );
  }

  // Desktop - 3-column grid
  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
          UPCOMING TOURNAMENTS
        </h2>
        <p className="text-xl text-muted-foreground">
          Compete for glory and massive prize pools
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tournaments.slice(0, 3).map((tournament, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-card/80 to-card-dark/80 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-8 hover:border-primary/60 transition-all duration-300"
          >
            <Trophy className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-2xl font-black text-foreground mb-4">{tournament.name}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">Prize</span>
                <span className="text-xl font-black text-primary">{tournament.prize}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">Players</span>
                <span className="text-lg font-bold text-foreground">{tournament.players}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">Starts in</span>
                <span className="text-lg font-bold text-amber-500">{tournament.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
