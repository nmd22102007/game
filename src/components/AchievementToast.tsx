/**
 * Automated Floating Toast notification when an Achievement is unlocked.
 * Animated using motion/react.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Coins } from 'lucide-react';
import { useGameStore } from '../services/store';

export const AchievementToast: React.FC = () => {
  const { activeToast, resetToast } = useGameStore();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        resetToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, resetToast]);

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          id="achievement-toast"
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed top-24 right-4 z-50 flex items-center gap-4 bg-zinc-950/95 border-2 border-emerald-500 text-white p-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md max-w-sm"
        >
          <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-400">
            <Trophy className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-400 font-semibold tracking-widest uppercase">Achievement Unlocked!</p>
            <h4 className="text-sm font-bold text-white truncate font-sans">{activeToast.title}</h4>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-400">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-mono">+{activeToast.reward} Coins</span> credited
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
