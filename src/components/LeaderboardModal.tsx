/**
 * Custom Cyberpunk Leaderboard Modal
 */

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, X, Calendar, Medal } from 'lucide-react';
import { useGameStore } from '../services/store';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const { profile } = useGameStore();

  const getGameBadgeColor = (gameName: string) => {
    switch (gameName) {
      case 'Love Runner':
        return 'bg-emerald-950/45 text-emerald-400 border-emerald-500/30';
      case 'Chess (AI)':
        return 'bg-purple-950/45 text-purple-400 border-purple-500/30';
      case 'Wave Dash':
        return 'bg-cyan-950/45 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-700';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 0) return <Medal className="w-5 h-5 text-amber-400" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-zinc-500 font-mono text-xs">#{rank + 1}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-purple-500 bg-zinc-950 p-6 shadow-[0_0_30px_rgba(168,85,247,0.25)] flex flex-col max-h-[85vh]"
      >
        {/* Glow corner elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tl from-purple-500/10 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/45">
              <Trophy className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-widest text-white uppercase font-sans sm:text-lg">
                GLOBAL_LEADERBOARD
              </h2>
              <p className="text-[10px] font-mono text-zinc-400 tracking-wider">TOP RANKS IN THE GRID</p>
            </div>
          </div>
          <button
            id="close-leaderboard"
            onClick={onClose}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-1.5 text-zinc-400 hover:text-white hover:border-purple-500/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Leaderboard Table / Cards */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {profile.leaderboard.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 font-mono text-sm leading-relaxed">
              No entries logged in the system ledger yet. <br />
              Play any game and claim your high score!
            </div>
          ) : (
            profile.leaderboard.map((entry, index) => {
              const matchedAvatar = profile.skins.find(s => s.id === entry.avatarId && s.type === 'avatar');
              const symbol = matchedAvatar?.renderSymbol || '⚡';
              const col = matchedAvatar?.glowColor || '#c084fc';

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between gap-4 p-3 rounded-xl border border-zinc-900 bg-zinc-900/20 hover:border-zinc-800 hover:bg-zinc-900/40 transition-all ${
                    entry.username === profile.username ? 'border-purple-500/40 bg-purple-950/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank indicator */}
                    <div className="flex w-8 items-center justify-center">
                      {getRankBadge(index)}
                    </div>

                    {/* Custom Avatar Indicator */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border font-sans pointer-events-none shrink-0"
                      style={{ borderColor: col, textShadow: `0 0 10px ${col}` }}
                    >
                      {symbol}
                    </div>

                    <div className="min-w-0">
                      {/* Name */}
                      <span className="block font-mono text-sm font-semibold truncate text-white">
                        {entry.username}
                        {entry.username === profile.username && (
                          <span className="ml-1.5 text-[9px] bg-purple-950 text-purple-400 border border-purple-500/40 px-1 py-0.2 rounded uppercase font-semibold">
                            YOU
                          </span>
                        )}
                      </span>
                      {/* Timestamp */}
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-zinc-500 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{entry.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Score Info */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span 
                      className={`px-2 py-0.5 rounded text-[10px] border font-mono tracking-wider font-semibold uppercase ${getGameBadgeColor(entry.game)}`}
                    >
                      {entry.game}
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {entry.score}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-zinc-800 pt-4 mt-4 flex justify-between text-[11px] text-zinc-500 font-mono">
          <span>DATA INTEGRITY VERIFIED</span>
          <span>NURMD ENG® v1.10</span>
        </div>
      </motion.div>
    </div>
  );
};
