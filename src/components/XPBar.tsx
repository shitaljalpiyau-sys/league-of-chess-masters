import { useAuth } from "@/contexts/AuthContext";
import { calculateLevelFromXP, getTierForLevel } from "@/utils/xpSystem";
import { Progress } from "@/components/ui/progress";
import { Trophy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface XPBarProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const XPBar = ({ showDetails = true, compact = false }: XPBarProps) => {
  const { profile } = useAuth();

  if (!profile) return null;

  const totalXP = profile.xp || 0;
  const level = profile.level || 1;
  const { currentLevelXP, nextLevelXP } = calculateLevelFromXP(totalXP);
  const tier = getTierForLevel(level);
  const progress = (currentLevelXP / nextLevelXP) * 100;

  return (
    <div className={`${compact ? "space-y-2" : "space-y-3"}`}>
      {/* Level Badge and Tier */}
      <div className="flex items-center gap-3">
        {/* Level Badge */}
        <motion.div
          className={`flex items-center justify-center ${
            compact ? "w-12 h-12" : "w-14 h-14"
          } rounded-xl bg-gradient-to-br ${tier.badgeGradient} shadow-lg`}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="text-center">
            <div className={`${compact ? "text-xs" : "text-sm"} font-bold text-white/80`}>
              LVL
            </div>
            <div className={`${compact ? "text-lg" : "text-xl"} font-bold text-white`}>
              {level}
            </div>
          </div>
        </motion.div>

        {/* Tier Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Trophy className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
            <span className={`${compact ? "text-sm" : "text-base"} font-bold text-foreground`}>
              {tier.name}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Sparkles className={`${compact ? "w-3 h-3" : "w-4 h-4"}`} />
            <span className={`${compact ? "text-xs" : "text-sm"}`}>
              {tier.material} Tier
            </span>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {currentLevelXP} / {nextLevelXP} XP
          </span>
          <span className="font-bold text-primary">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="relative">
          <Progress 
            value={progress} 
            className={`${compact ? "h-2" : "h-3"} bg-card-dark`}
          />
          
          {/* Glow effect on high progress */}
          {progress > 80 && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </div>

        {showDetails && !compact && (
          <div className="text-xs text-muted-foreground text-center">
            {nextLevelXP - currentLevelXP} XP to Level {level + 1}
          </div>
        )}
      </div>
    </div>
  );
};
