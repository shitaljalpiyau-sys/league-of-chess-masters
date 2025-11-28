import { motion } from "framer-motion";
import { Users, Trophy, Coins, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const liveStats = [
  { label: "Active Players", value: 12847, suffix: "", icon: Users },
  { label: "Games Today", value: 3456, suffix: "", icon: Trophy },
  { label: "Prize Pool", value: 500, suffix: "K", icon: Coins },
  { label: "Tournaments", value: 24, suffix: "", icon: Crown }
];

const CountUpNumber = ({ end, suffix = "", delay = 0 }: { end: number; suffix?: string; delay?: number }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;

    const timer = setTimeout(() => {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = end / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= end) {
          setCount(end);
          setHasAnimated(true);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [end, delay, hasAnimated]);

  return (
    <span>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

export const LiveStats = () => {
  const isMobile = useIsMobile();

  return (
    <section className="py-12 sm:py-16 px-4 max-w-7xl mx-auto">
      <div className={`grid gap-4 sm:gap-6 ${
        isMobile 
          ? "grid-cols-2" // Mobile: 2 columns
          : "grid-cols-2 md:grid-cols-4" // Desktop: 4 columns
      }`}>
        {liveStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative group bg-gradient-to-br from-card to-card-dark border-2 border-primary/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary/60 transition-all duration-300 overflow-hidden min-h-[140px] sm:min-h-[160px] flex flex-col justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <stat.icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-2 sm:mb-3 relative z-10" />
            <div className="text-3xl sm:text-4xl font-black text-primary mb-1 sm:mb-2 relative z-10">
              <CountUpNumber end={stat.value} suffix={stat.suffix} delay={i * 200} />
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground font-medium relative z-10 leading-tight">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
