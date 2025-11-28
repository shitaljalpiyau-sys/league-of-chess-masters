import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Star } from "lucide-react";
import { getTierForLevel } from "@/utils/xpSystem";

interface LevelUpAnimationProps {
  isVisible: boolean;
  level: number;
  isTierUpgrade?: boolean;
}

export const LevelUpAnimation = ({
  isVisible,
  level,
  isTierUpgrade = false,
}: LevelUpAnimationProps) => {
  const tier = getTierForLevel(level);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Particle burst */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(isTierUpgrade ? 20 : 12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: `${50 + (Math.random() - 0.5) * 100}%`,
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              >
                {isTierUpgrade ? (
                  <Star className={`w-6 h-6 text-${tier.color}`} fill="currentColor" />
                ) : (
                  <Sparkles className="w-4 h-4 text-primary" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Main content */}
          <motion.div
            className="relative z-10 text-center space-y-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
          >
            {/* Level badge with glow */}
            <motion.div
              className="relative mx-auto"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <motion.div
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${tier.badgeGradient} flex items-center justify-center shadow-2xl`}
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                    "0 0 40px rgba(59, 130, 246, 0.8)",
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Trophy className="w-16 h-16 text-white" />
              </motion.div>

              {/* Rotating ring */}
              <motion.div
                className="absolute inset-0 border-4 border-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  borderTopColor: "transparent",
                  borderRightColor: "transparent",
                }}
              />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-4xl font-bold text-white mb-2">
                {isTierUpgrade ? "Tier Upgrade!" : "Level Up!"}
              </h2>
              <p className="text-2xl font-bold text-primary mb-1">
                Level {level}
              </p>
              {isTierUpgrade && (
                <motion.p
                  className="text-xl text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {tier.name} - {tier.material} Tier
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
