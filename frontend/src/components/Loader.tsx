import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wheat, Sun, CloudRain, Sparkles } from 'lucide-react';

interface LoaderProps {
  onLoadComplete: () => void;
}

const Loader: React.FC<LoaderProps> = ({ onLoadComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress + 2;
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(onLoadComplete, 500);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [onLoadComplete]);

  const iconVariants = {
    initial: { scale: 0, rotate: 0 },
    animate: { 
      scale: [0, 1.2, 1], 
      rotate: [0, 10, -10, 0],
      transition: { 
        duration: 1.5, 
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  const leafVariants = {
    initial: { x: -100, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { 
        duration: 0.8,
        delay: 0.2 
      }
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950 flex items-center justify-center z-50 transition-colors duration-500 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center z-10 relative w-full max-w-sm mx-auto px-4 py-8">
        {/* Logo and Title with glassmorphism */}
        <motion.div
          className="mb-8 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl p-8 pb-10 border-2 border-green-200/50 dark:border-green-700/50 shadow-2xl"
          initial={{ y: -50, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <div className="flex items-center justify-center mb-4 overflow-visible">
            {/* Floating plant emoji */}
            <motion.div
              className="relative mr-4"
              variants={iconVariants}
              initial="initial"
              animate="animate"
            >
              <motion.div
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
                className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-2xl"
              />
              <span className="text-5xl relative z-10">🌿</span>
            </motion.div>
            <motion.h1 
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent pb-2"
              variants={leafVariants}
              initial="initial"
              animate="animate"
            >
              AgriGPT
            </motion.h1>
          </div>
          
          <motion.p 
            className="text-lg text-green-700 dark:text-green-300 font-medium flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <Sparkles size={18} className="mr-2" />
            Your AI-Powered Krishi Assistant 🌾
          </motion.p>
        </motion.div>

        {/* Animated Icons with glassmorphism */}
        <motion.div 
          className="flex justify-center space-x-6 mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, duration: 0.6, type: "spring" }}
        >
          <motion.div
            className="backdrop-blur-xl bg-yellow-400/80 dark:bg-yellow-500/80 p-4 rounded-2xl shadow-xl border-2 border-yellow-300/50 dark:border-yellow-600/50"
            animate={{ 
              rotate: [0, 360],
              y: [-5, 5, -5]
            }}
            transition={{ 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Sun className="w-8 h-8 text-yellow-900 dark:text-yellow-100" />
          </motion.div>
          
          <motion.div
            className="backdrop-blur-xl bg-blue-400/80 dark:bg-blue-500/80 p-4 rounded-2xl shadow-xl border-2 border-blue-300/50 dark:border-blue-600/50"
            animate={{ 
              y: [-8, 8, -8],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <CloudRain className="w-8 h-8 text-blue-900 dark:text-blue-100" />
          </motion.div>
          
          <motion.div
            className="backdrop-blur-xl bg-amber-400/80 dark:bg-amber-500/80 p-4 rounded-2xl shadow-xl border-2 border-amber-300/50 dark:border-amber-600/50"
            animate={{ 
              scale: [1, 1.15, 1],
              rotate: [-5, 5, -5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Wheat className="w-8 h-8 text-amber-900 dark:text-amber-100" />
          </motion.div>
        </motion.div>

        {/* Enhanced Progress Bar */}
        <motion.div 
          className="w-96 max-w-full mx-auto mb-6 px-4"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "24rem", opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <div className="relative backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-full h-4 overflow-hidden border-2 border-green-200/50 dark:border-green-700/50 shadow-lg">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 dark:from-green-500 dark:via-emerald-600 dark:to-teal-700 rounded-full relative overflow-hidden"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            >
              {/* Shimmer effect */}
              <motion.div
                animate={{
                  x: [-200, 400],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ width: '50%' }}
              />
            </motion.div>
          </div>
          <motion.p 
            className="text-green-700 dark:text-green-300 text-sm mt-3 font-semibold"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading AgriGPT... {progress}%
          </motion.p>
        </motion.div>

        {/* Loading Messages with better styling */}
        <motion.div
          className="space-y-3 min-h-[80px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          {progress < 30 && (
            <motion.div
              className="backdrop-blur-xl bg-green-100/80 dark:bg-green-900/30 rounded-2xl px-6 py-3 inline-block border-2 border-green-300/50 dark:border-green-700/50 shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-green-700 dark:text-green-300 font-medium flex items-center">
                <span className="text-2xl mr-3">🌱</span>
                Initializing farming intelligence...
              </p>
            </motion.div>
          )}
          {progress >= 30 && progress < 60 && (
            <motion.div
              className="backdrop-blur-xl bg-green-100/80 dark:bg-green-900/30 rounded-2xl px-6 py-3 inline-block border-2 border-green-300/50 dark:border-green-700/50 shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-green-700 dark:text-green-300 font-medium flex items-center">
                <span className="text-2xl mr-3">🤖</span>
                Loading AI models...
              </p>
            </motion.div>
          )}
          {progress >= 60 && progress < 90 && (
            <motion.div
              className="backdrop-blur-xl bg-green-100/80 dark:bg-green-900/30 rounded-2xl px-6 py-3 inline-block border-2 border-green-300/50 dark:border-green-700/50 shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-green-700 dark:text-green-300 font-medium flex items-center">
                <span className="text-2xl mr-3">☀️</span>
                Fetching weather data...
              </p>
            </motion.div>
          )}
          {progress >= 90 && (
            <motion.div
              className="backdrop-blur-xl bg-green-100/80 dark:bg-green-900/30 rounded-2xl px-6 py-3 inline-block border-2 border-green-300/50 dark:border-green-700/50 shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-green-700 dark:text-green-300 font-medium flex items-center">
                <span className="text-2xl mr-3">✅</span>
                Ready to assist farmers!
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Team Credit */}
        <motion.div
          className="mt-12"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Built with 💚 by{' '}
            <span className="font-semibold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
              Novice Bytes
            </span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Loader;