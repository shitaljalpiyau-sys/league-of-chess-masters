import { Brain, Cpu, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface BotThinkingIndicatorProps {
  difficulty: 'easy' | 'moderate' | 'hard';
  show: boolean;
}

export const BotThinkingIndicator = ({ difficulty, show }: BotThinkingIndicatorProps) => {
  if (!show) return null;

  const getDifficultyConfig = () => {
    switch (difficulty) {
      case 'easy':
        return { 
          icon: Zap, 
          color: 'text-green-400',
          glowColor: 'rgb(74, 222, 128)',
          label: 'Easy Bot Thinking'
        };
      case 'moderate':
        return { 
          icon: Cpu, 
          color: 'text-yellow-400',
          glowColor: 'rgb(250, 204, 21)',
          label: 'Moderate Bot Thinking'
        };
      case 'hard':
        return { 
          icon: Brain, 
          color: 'text-red-400',
          glowColor: 'rgb(248, 113, 113)',
          label: 'Hard Bot Computing'
        };
    }
  };

  const config = getDifficultyConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed bottom-6 right-6 z-50 pointer-events-none"
    >
      <div 
        className="bg-card/95 backdrop-blur-xl border-2 rounded-2xl px-6 py-4 shadow-2xl"
        style={{
          borderColor: config.glowColor,
          boxShadow: `0 0 40px ${config.glowColor}33, 0 10px 50px rgba(0,0,0,0.3)`
        }}
      >
        <div className="flex items-center gap-3">
          {/* Animated Icon */}
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={config.color}
            style={{
              filter: `drop-shadow(0 0 8px ${config.glowColor})`
            }}
          >
            <Icon className="h-7 w-7" />
          </motion.div>

          {/* Text with animated dots */}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold font-rajdhani text-foreground">
              {config.label}
            </p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: config.glowColor,
                    boxShadow: `0 0 8px ${config.glowColor}`
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <motion.div
          className="h-1 mt-3 rounded-full overflow-hidden bg-muted"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: config.glowColor }}
            animate={{ 
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
