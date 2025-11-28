import { motion } from "framer-motion";
import { Sparkles, Gamepad2, Zap, Twitter, Coins, Gift, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const pointsItems = [
  { 
    name: "Board Skins", 
    desc: "Premium chess boards with stunning visual themes and animations", 
    cost: "500", 
    emoji: "🎨", 
    icon: Sparkles 
  },
  { 
    name: "Piece Skins", 
    desc: "Animated chess pieces with unique styles and smooth movements", 
    cost: "750", 
    emoji: "♟️", 
    icon: Gamepad2 
  },
  { 
    name: "Animations", 
    desc: "Victory celebrations and special move effects to show off your skills", 
    cost: "1,000", 
    emoji: "✨", 
    icon: Zap 
  },
  { 
    name: "Twitter Promo", 
    desc: "Get featured on our official Twitter feed and gain recognition", 
    cost: "2,500", 
    emoji: "🐦", 
    icon: Twitter 
  },
  { 
    name: "$SOL Token", 
    desc: "Convert your points to Solana tokens and use them anywhere", 
    cost: "10,000", 
    emoji: "💰", 
    icon: Coins 
  },
  { 
    name: "NFT Mint Spot", 
    desc: "Exclusive access to OG collection NFT mints with guaranteed whitelist", 
    cost: "50,000", 
    emoji: "🎫", 
    icon: Gift 
  }
];

export const PointsEconomy = () => {
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
            POINTS ECONOMY
          </h2>
          <p className="text-base text-muted-foreground">
            Earn hourly. Spend on skins, promotions, SOL, and NFT spots.
          </p>
        </motion.div>
        
        {/* 2-Column Grid for Mobile */}
        <div className="grid grid-cols-2 gap-3">
          {pointsItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem 
                  value={`item-${idx}`}
                  className="relative bg-gradient-to-br from-card/80 to-card-dark/80 backdrop-blur-sm border-2 border-primary/30 rounded-xl overflow-hidden hover:border-primary/60 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                  
                  <AccordionTrigger className="px-3 py-4 hover:no-underline [&[data-state=open]]:pb-2">
                    <div className="text-left w-full">
                      <div className="text-4xl mb-2">{item.emoji}</div>
                      <h3 className="text-base font-black text-foreground mb-2 leading-tight">{item.name}</h3>
                      <div className="flex items-center gap-1.5 p-2 bg-background/50 rounded-lg border border-primary/20">
                        <span className="text-xl font-black text-primary">{item.cost}</span>
                        <span className="text-xs text-muted-foreground font-medium">pts</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-3 pb-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          ))}
        </div>
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
          POINTS ECONOMY
        </h2>
        <p className="text-xl text-muted-foreground">
          Earn hourly. Spend on skins, promotions, SOL, and NFT spots.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pointsItems.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, y: -10 }}
            className="relative group bg-gradient-to-br from-card/80 to-card-dark/80 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-8 hover:border-primary/60 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="text-6xl mb-4">{item.emoji}</div>
              <h3 className="text-2xl font-black text-foreground mb-2">{item.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{item.desc}</p>
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border border-primary/20">
                <span className="text-3xl font-black text-primary">{item.cost}</span>
                <span className="text-muted-foreground font-medium">points</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
