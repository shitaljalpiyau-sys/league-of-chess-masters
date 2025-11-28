import { motion } from "framer-motion";
import { Crown, Star, Trophy, Target, Shield, Zap, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";
import useEmblaCarousel from "embla-carousel-react";

const classData = [
  {
    name: "ELITE",
    color: "from-amber-400 via-amber-500 to-amber-600",
    borderColor: "border-amber-500/50",
    glowColor: "shadow-[0_0_30px_rgba(251,191,36,0.3)]",
    benefits: ["SOL Rewards", "NFT Priority", "Exclusive Perks", "VIP Status"],
    income: "10,000/hr",
    limit: "Limit: 5 players",
    icon: Crown,
    description: "The pinnacle of Elite League. Only 5 legendary players can hold this rank."
  },
  {
    name: "CLASS A",
    color: "from-purple-400 via-purple-500 to-purple-600",
    borderColor: "border-purple-500/50",
    glowColor: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
    benefits: ["High Income", "Store Access", "Profile Themes", "Priority Queue"],
    income: "~400/hr",
    limit: "Limit: 1,000",
    icon: Star,
    description: "Elite players with premium benefits and high hourly income."
  },
  {
    name: "CLASS B",
    color: "from-blue-400 via-blue-500 to-blue-600",
    borderColor: "border-blue-500/50",
    glowColor: "shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    benefits: ["Good Income", "Theme Store", "Tournaments", "Custom Boards"],
    income: "~140/hr",
    limit: "Limit: 20,000",
    icon: Trophy,
    description: "Skilled players with access to advanced features and tournaments."
  },
  {
    name: "CLASS C",
    color: "from-green-400 via-green-500 to-green-600",
    borderColor: "border-green-500/50",
    glowColor: "shadow-[0_0_30px_rgba(34,197,94,0.3)]",
    benefits: ["Basic Income", "Game Access", "Friends System", "Chat"],
    income: "~60/hr",
    limit: "Limit: 30,000",
    icon: Target,
    description: "Growing players building their reputation in the arena."
  },
  {
    name: "CLASS D",
    color: "from-gray-400 via-gray-500 to-gray-600",
    borderColor: "border-gray-500/50",
    glowColor: "shadow-[0_0_30px_rgba(107,114,128,0.3)]",
    benefits: ["Starting Income", "Learn & Grow", "Basic Features", "Community"],
    income: "~30/hr",
    limit: "Unlimited",
    icon: Shield,
    description: "Entry level for all new players. Start your journey here."
  }
];

export const ClassSection = () => {
  const isMobile = useIsMobile();
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
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl font-black mb-3 bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
            ELITE CLASS SYSTEM
          </h2>
          <p className="text-base text-muted-foreground mb-2">
            Compete weekly. Climb ranks. Earn rewards automatically.
          </p>
          <p className="text-sm text-primary font-medium">
            ← Swipe to explore classes →
          </p>
        </motion.div>

        {/* Mobile Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 pb-4">
            {classData.map((cls, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex-[0_0_85%] sm:flex-[0_0_70%]"
              >
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem 
                    value={`item-${idx}`} 
                    className={`relative bg-gradient-to-br from-card/80 to-card-dark/80 backdrop-blur-sm border-2 ${cls.borderColor} rounded-2xl overflow-hidden ${cls.glowColor}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${cls.color} opacity-10`} />
                    
                    <AccordionTrigger className="px-6 py-6 hover:no-underline [&[data-state=open]]:pb-4">
                      <div className="flex items-start gap-4 w-full text-left">
                        <cls.icon className={`w-16 h-16 flex-shrink-0 bg-gradient-to-br ${cls.color} bg-clip-text text-transparent`} />
                        
                        <div className="flex-1">
                          <div className={`text-2xl font-black mb-1 bg-gradient-to-br ${cls.color} bg-clip-text text-transparent`}>
                            {cls.name}
                          </div>
                          <div className="text-xs text-muted-foreground mb-3 font-medium">{cls.limit}</div>
                          
                          <div className="flex items-center gap-2 p-2.5 bg-background/50 rounded-lg border border-primary/20 inline-flex">
                            <Zap className="w-5 h-5 text-primary" />
                            <span className="text-xl font-black text-primary">{cls.income}</span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 pb-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        {cls.description}
                      </p>
                      <div className="space-y-2.5">
                        {cls.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-3 text-base">
                            <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
                            <span className="text-foreground/90 font-medium">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {classData.map((_, idx) => (
            <div key={idx} className="w-2 h-2 rounded-full bg-primary/30" />
          ))}
        </div>
      </section>
    );
  }

  // Desktop view - original grid layout
  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
          ELITE CLASS SYSTEM
        </h2>
        <p className="text-xl text-muted-foreground">
          Compete weekly. Climb ranks. Earn rewards automatically.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {classData.map((cls, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, y: -10 }}
            className={`relative group bg-gradient-to-br from-card/80 to-card-dark/80 backdrop-blur-sm border-2 ${cls.borderColor} rounded-2xl p-6 transition-all duration-300 ${cls.glowColor}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${cls.color} opacity-5 group-hover:opacity-15 rounded-2xl transition-opacity`} />
            
            <div className="relative z-10">
              <cls.icon className={`w-12 h-12 mb-4 bg-gradient-to-br ${cls.color} bg-clip-text text-transparent`} />
              
              <div className={`text-3xl font-black mb-2 bg-gradient-to-br ${cls.color} bg-clip-text text-transparent`}>
                {cls.name}
              </div>
              
              <div className="text-xs text-muted-foreground mb-4 font-medium">{cls.limit}</div>
              
              <div className="flex items-center gap-2 mb-6 p-3 bg-background/50 rounded-lg border border-primary/20">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-2xl font-black text-primary">{cls.income}</span>
              </div>
              
              <div className="space-y-2">
                {cls.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-primary" />
                    <span className="text-foreground/90 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
