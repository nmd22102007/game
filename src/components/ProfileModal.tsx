/**
 * Player Profile & Achievements Diagnostics Modal
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, X, Check, Gamepad, Award, Flame, Calendar, Coins, Edit2 } from 'lucide-react';
import { useGameStore } from '../services/store';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { profile, updateUsername } = useGameStore();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.username);
  
  // Tabs: Stats vs Achievements
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'achievements'>('stats');

  const handleSaveName = () => {
    if (tempName.trim().length > 0) {
      updateUsername(tempName);
      setEditingName(false);
    }
  };

  // Metrics details
  const equippedAvatar = profile.skins.find(s => s.id === profile.avatarId && s.type === 'avatar');
  const avatarCol = equippedAvatar?.glowColor || '#10b981';
  const avatarSym = equippedAvatar?.renderSymbol || '⚡';

  const unlockedCount = profile.achievements.filter(a => a.unlocked).length;
  const progressPercent = Math.round((unlockedCount / profile.achievements.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-emerald-500 bg-zinc-950 p-6 shadow-[0_0_25px_rgba(16,185,129,0.2)] flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/30">
              <User className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-widest text-white uppercase font-sans sm:text-lg">
                PLAYER_DOSSIER
              </h2>
              <p className="text-[10px] font-mono text-zinc-400 tracking-wider">IDENTITY DATA MATRIX</p>
            </div>
          </div>
          <button
            id="close-profile"
            onClick={onClose}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-1.5 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity Overview Section */}
        <div className="bg-zinc-900/10 border border-zinc-900 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 mb-4 text-center sm:text-left bg-zinc-950">
          
          {/* Avatar Rendering */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl border-2 select-none"
            style={{ borderColor: avatarCol, textShadow: `0 0 10px ${avatarCol}`, color: avatarCol }}
          >
            {avatarSym}
          </div>

          <div className="flex-1 min-w-0">
            {/* Username Editing controls */}
            {editingName ? (
              <div className="flex items-center gap-2 max-w-xs mx-auto sm:mx-0">
                <input
                  id="username-edit-input"
                  type="text"
                  maxLength={14}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-zinc-950 text-white border border-emerald-500 rounded-lg py-1 px-3.5 font-mono text-sm uppercase focus:outline-none focus:ring-1 focus:ring-emerald-400 w-full"
                />
                <button
                  id="save-username-btn"
                  onClick={handleSaveName}
                  className="p-1 px-2.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 text-xs uppercase cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider truncate">
                  {profile.username}
                </h3>
                <button
                  id="edit-username-btn"
                  onClick={() => setEditingName(true)}
                  className="text-zinc-500 hover:text-emerald-400 transition"
                  title="Modify Codename"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Achievement Bar overview */}
            <div className="mt-2.5 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                <span>ACHIEVEMENTS COMPLETED: {unlockedCount}/{profile.achievements.length}</span>
                <span className="text-emerald-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Quick stats items */}
          <div className="flex gap-4 sm:border-l sm:border-zinc-800 sm:pl-6">
            <div className="font-mono text-center">
              <span className="block text-[10px] text-zinc-500">TOTAL SCORE</span>
              <span className="text-sm font-bold text-white tracking-wide">{profile.totalScore} XP</span>
            </div>
            <div className="font-mono text-center">
              <span className="block text-[10px] text-zinc-500">SHARED COINS</span>
              <div className="flex items-center gap-0.5 justify-center">
                <Coins className="w-3 h-3 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">{profile.coins}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Local Tab Switcher */}
        <div className="flex gap-2 border-b border-zinc-900 pb-3 mb-4 font-mono text-xs">
          <button
            onClick={() => setActiveSubTab('stats')}
            className={`flex-1 py-1.5 rounded-lg border text-center font-bold uppercase transition ${
              activeSubTab === 'stats'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Stats Matrix
          </button>
          <button
            onClick={() => setActiveSubTab('achievements')}
            className={`flex-1 py-1.5 rounded-lg border text-center font-bold uppercase transition ${
              activeSubTab === 'achievements'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Achievements Sheet
          </button>
        </div>

        {/* Content container */}
        <div className="flex-1 overflow-y-auto pr-1 select-none custom-scrollbar min-h-[150px]">
          {activeSubTab === 'stats' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              
              {/* Card 1: Love Runner */}
              <div className="bg-zinc-900/10 border border-zinc-900 p-3.5 rounded-xl space-y-2">
                <h4 className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                  🏃 LOVE_RUNNER
                </h4>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Plays:</span>
                  <span className="text-white font-bold">{profile.stats.loveRunnerPlays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">High Score:</span>
                  <span className="text-white font-bold">{profile.stats.loveRunnerHighScore}m</span>
                </div>
              </div>

              {/* Card 2: Chess */}
              <div className="bg-zinc-900/10 border border-zinc-900 p-3.5 rounded-xl space-y-2">
                <h4 className="text-purple-400 text-[11px] font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                  ♟ CHESS_LEDGER
                </h4>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Plays:</span>
                  <span className="text-white font-bold">{profile.stats.chessPlays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">VS AI Winds:</span>
                  <span className="text-white font-bold">{profile.stats.chessWinsVsAI}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">VS Player Wins:</span>
                  <span className="text-white font-bold">{profile.stats.chessWinsVsPlayer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Draws:</span>
                  <span className="text-white font-bold">{profile.stats.chessDraws}</span>
                </div>
              </div>

              {/* Card 3: Wave Dash */}
              <div className="bg-zinc-900/10 border border-zinc-900 p-3.5 rounded-xl space-y-2">
                <h4 className="text-cyan-400 text-[11px] font-bold uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                  ⚡ WAVE_DASH
                </h4>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Plays:</span>
                  <span className="text-white font-bold">{profile.stats.waveDashPlays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">High Score:</span>
                  <span className="text-white font-bold">{profile.stats.waveDashHighScore}</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-2.5">
              {profile.achievements.map(a => (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    a.unlocked
                      ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
                      : 'border-zinc-900 bg-zinc-900/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg border shrink-0 ${
                    a.unlocked
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-650'
                  }`}>
                    {a.unlocked ? <Check className="w-4 h-4 ml-0 animate-pulse" /> : <Award className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={`font-mono text-xs font-bold leading-none ${a.unlocked ? 'text-white' : 'text-zinc-550'}`}>
                        {a.title}
                      </h4>
                      {a.unlocked && a.unlockedAt && (
                        <div className="flex items-center gap-0.5 text-[9px] text-zinc-500 font-mono">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{a.unlockedAt}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono mt-1 leading-normal">
                      {a.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 font-mono shrink-0 select-none">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{a.reward}</span>
                    </div>
                    {a.unlocked ? (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono">unlocked</span>
                    ) : (
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">locked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-zinc-800 pt-4 mt-4 text-[11px] text-zinc-500 font-mono text-center">
          CODENAME BROADCASTED PUBLIC_NODE://NURMD_NET
        </div>
      </motion.div>
    </div>
  );
};
