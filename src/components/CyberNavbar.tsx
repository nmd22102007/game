/**
 * Custom Cyberpunk Navigation Bar - Sleek Theme
 */

import React from 'react';
import { useGameStore } from '../services/store';
import { ShoppingBag, Trophy, User, Settings, Disc } from 'lucide-react';

interface CyberNavbarProps {
  onOpenShop: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
}

export const CyberNavbar: React.FC<CyberNavbarProps> = ({
  onOpenShop,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenSettings,
  isMusicPlaying,
  onToggleMusic
}) => {
  const { profile } = useGameStore();

  // Find equipped avatar skin to render symbol
  const equippedAvatar = profile.skins.find(s => s.id === profile.avatarId && s.type === 'avatar');
  const avatarSymbol = equippedAvatar?.renderSymbol || '⚡';
  const avatarColor = equippedAvatar?.glowColor || '#00FF41';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-500/10 bg-[#080808]/90 backdrop-blur-md px-4 py-3 sm:px-10 h-20 flex items-center">
      <div className="w-full flex items-center justify-between gap-4">
        
        {/* Sleek Logo with separation lines and verification statuses */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-emerald-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.4)]">
              <div className="w-4 h-4 bg-emerald-500 animate-pulse"></div>
            </div>
            <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter text-emerald-500 uppercase font-sans">
              NURMD <span className="text-white">GAME HUB</span>
            </h1>
          </div>
          
          <div className="hidden sm:block h-4 w-px bg-white/20"></div>
          
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono tracking-widest text-white/50">
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ONLINE
            </span>
            <span>VER 2.0.48-X</span>
          </div>
        </div>

        {/* Right Controls & Wallet Area */}
        <div className="flex items-center gap-3 sm:gap-6">
          
          {/* Cyber Capsule Wallet */}
          <div className="flex items-center gap-2.5 bg-black/60 border border-emerald-500/30 px-3.5 py-1.5 rounded-full shadow-[0_0_12px_rgba(0,255,65,0.1)]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#00FF41] animate-pulse" />
            <span className="font-mono font-bold text-xs sm:text-sm tracking-tight text-white">
              {profile.coins.toLocaleString()} <span className="text-emerald-500/80 font-semibold font-mono">NURM</span>
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Nav Items */}
          <nav className="flex items-center gap-2">
            {/* Audio Tracker */}
            <button
              id="music-toggle-btn"
              onClick={onToggleMusic}
              title={isMusicPlaying ? "Mute BGM" : "Play Cyber BGM"}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                isMusicPlaying 
                  ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow-[0_0_8px_rgba(0,255,65,0.3)]' 
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-500'
              }`}
            >
              <Disc className={`w-4 h-4 ${isMusicPlaying ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="open-shop-btn"
              onClick={onOpenShop}
              title="Black Market Shop"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-emerald-500/50 text-zinc-350 hover:text-emerald-450 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            
            <button
              id="open-leaderboard-btn"
              onClick={onOpenLeaderboard}
              title="Global Leaderboards"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-emerald-500/50 text-zinc-350 hover:text-emerald-450 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <button
              id="open-profile-btn"
              onClick={onOpenProfile}
              title="Player Profile"
              className="flex items-center gap-2 px-2 sm:px-3 h-9 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-emerald-500/50 text-zinc-350 hover:text-emerald-450 transition-all cursor-pointer"
            >
              <div 
                className="w-5 h-5 rounded flex items-center justify-center text-xs border font-mono font-bold bg-zinc-950/80"
                style={{ borderColor: avatarColor, textShadow: `0 0 10px ${avatarColor}`, boxShadow: `0 0 6px ${avatarColor}33` }}
              >
                {avatarSymbol}
              </div>
              <span className="text-xs font-mono font-bold hidden md:inline max-w-[80px] truncate">
                {profile.username}
              </span>
            </button>
            <button
              id="open-settings-btn"
              onClick={onOpenSettings}
              title="System Settings"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-500/50 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </nav>
          
        </div>
      </div>
    </header>
  );
};
