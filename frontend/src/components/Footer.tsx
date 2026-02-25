import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="relative py-8 px-4 bg-white/95 dark:bg-emerald-950/[0.97] backdrop-blur-xl shadow-lg border-t-2 border-green-200/50 dark:border-emerald-600/60 transition-all duration-300">
      {/* Gradient accent line at top edge */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 dark:from-green-500 dark:via-emerald-600 dark:to-teal-700" />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex items-center space-x-2"
          >
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.3, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
              className="absolute bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-xl opacity-50 w-8 h-8"
            />
            <span className="text-2xl relative z-10">🌿</span>
            <div>
              <div className="font-bold text-xl bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                AgriGPT
              </div>
              <div className="text-xs text-gray-600 dark:text-emerald-200/70 transition-colors duration-300">
                Empowering Farmers with AI
              </div>
            </div>
          </motion.div>

          {/* Center - Built by */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-sm text-gray-600 dark:text-emerald-200/80 transition-colors duration-300">
              Built with 💚 by{' '}
              <span className="font-semibold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                Novice Bytes
              </span>
            </p>
          </motion.div>

          {/* Right - Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center md:text-right"
          >
            <p className="text-xs text-gray-500 dark:text-emerald-300/60">
              © 2026 AgriGPT
            </p>
            <p className="text-xs text-gray-500 dark:text-emerald-300/60">
              All rights reserved
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
