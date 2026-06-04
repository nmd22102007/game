/**
 * Master App Entry Point - NURMD GAME HUB
 * Orchestrates Loading Screen Particle Engine, Custom Game Grid Views,
 * Modal Triggers, and Synthesized Background Melodies.
 * Refactored to feature the "Sleek Interface" premium retro-cyber styling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameStoreProvider, useGameStore } from './services/store';
import { audio } from './services/audio';
import { CyberNavbar } from './components/CyberNavbar';
import { ShopModal } from './components/ShopModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { AchievementToast } from './components/AchievementToast';

// Games imports
import { LoveRunnerGame } from './games/love-runner/LoveRunnerGame';
import { ChessGame } from './games/chess/ChessGame';
import { WaveDashGame } from './games/wave-dash/WaveDashGame';

import { Play, Flame, Swords, Zap, Gamepad2, ShoppingBag, Trophy, User, Settings, Disc, Shield, Sparkles, AlertCircle } from 'lucide-react';

function HubPortal() {
  const { profile, loadingScreen, setLoadingScreen } = useGameStore();

  // Active view hooks
  const [activeGame, setActiveGame] = useState<'loveRunner' | 'chess' | 'waveDash' | null>(null);
  
  // Modal tracking hooks
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Audio BGM tracking
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Canvas context for Loading Screen Particles
  const loadingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Loading Screen Particles initialization with Matrix Green color themes
  useEffect(() => {
    if (!loadingScreen) return;
    const canvas = loadingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initial particle pool using matrix green
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.8,
        vy: (Math.random() - 0.5) * 1.4,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.15
      });
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Cyber black/neon dark backdrop
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 255, 65, 0.04)';
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.08)';
      ctx.lineWidth = 1;

      // Draw subtle loading wire grid matching design
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Loop boundaries wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `rgba(0, 255, 65, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [loadingScreen]);

  // Audio controls handle
  const handleToggleMusic = () => {
    if (isMusicPlaying) {
      audio.stopMusic();
      setIsMusicPlaying(false);
    } else {
      audio.startMusic();
      setIsMusicPlaying(true);
    }
  };

  const handleEnterPlatform = () => {
    // Unlocks browser autoplay policies
    audio.resume();
    audio.playClick();
    
    // Auto-engage ambient synth
    audio.startMusic();
    setIsMusicPlaying(true);

    setLoadingScreen(false);
  };

  // Dynamic values calculation
  const unlockedAchievementsCount = profile.achievements.filter(a => a.unlocked).length;
  const totalAchievementsCount = profile.achievements.length;

  const totalRunsPlayed = profile.stats.loveRunnerPlays + profile.stats.waveDashPlays;
  const calculatedWinRate = totalRunsPlayed > 0 
    ? Math.min(95, Math.max(50, Math.round(((profile.stats.chessWinsVsAI * 1.5 + profile.stats.waveDashHighScore / 25) / Math.max(1, profile.stats.totalGamesPlayed)) * 10) + 60))
    : 68;

  const equippedAvatar = profile.skins.find(s => s.id === profile.avatarId && s.type === 'avatar');
  const avatarSymbol = equippedAvatar?.renderSymbol || '⚡';
  const avatarColor = equippedAvatar?.glowColor || '#ffb800';

  return (
    <>
      {/* LOADING PORTAL MOUNT */}
      {loadingScreen ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 font-mono overflow-hidden">
          <canvas ref={loadingCanvasRef} className="absolute inset-0 block w-full h-full" />
          
          <div className="relative text-center space-y-8 max-w-sm px-6 z-10">
            <div className="space-y-2">
              <div className="inline-block relative">
                <div className="absolute -inset-4 bg-emerald-500/20 blur-xl animate-pulse rounded-full" />
                <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-[0.25em] relative text-shadow-[0_0_20px_#ffb800] italic">
                  NURMD <span className="text-emerald-500 font-extrabold">HUB</span>
                </h1>
              </div>
              <p className="text-[10px] tracking-widest text-emerald-500 font-mono animate-pulse mt-2">// ENTERPRISE_SECURE_BOOT_v2.0.48-X</p>
            </div>

            <div className="h-[2px] w-24 bg-zinc-805 mx-auto overflow-hidden rounded-full border border-emerald-500/30">
              <div className="h-full bg-emerald-500 animate-[loading_2s_infinite]" />
            </div>

            <button
              id="tap-to-enter-btn"
              onClick={handleEnterPlatform}
              className="px-8 py-4 border-2 border-emerald-555 bg-emerald-950/15 text-emerald-500 rounded-sm relative overflow-hidden group hover:bg-emerald-500 hover:text-zinc-950 font-black tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(0,255,65,0.4)] cursor-pointer"
            >
              TAP TO ENTER
            </button>

            <span className="block text-[8.5px] text-zinc-500 max-w-xs mx-auto leading-relaxed mt-4">
              CYBERNETIC AUDIO CHORD SYNTH ENGINE INITIALIZED. <br />
              WAVE INTERFACES RUNNING IN ENCRYPTED MEMORY CORE
            </span>
          </div>
        </div>
      ) : (

        /* MAIN GAMING HUB PORTAL WITH SIDE RAIL LAYOUT */
        <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex overflow-hidden relative">
          
          {/* Ambient matrix green dot grid specified in Design Spec */}
          <div className="absolute inset-0 pointer-events-none opacity-8 grid-dots-bg z-0" />
          <div className="absolute inset-0 pointer-events-none opacity-4 scanlines-overlay z-0" />

          {/* Left Widescreen navigation rail (aside) as seen in Design HTML */}
          <aside className="hidden md:flex w-20 border-r border-emerald-500/20 flex-col items-center py-8 justify-between bg-[#080808] z-30 shrink-0">
            <div className="flex flex-col items-center gap-10">
              {/* Pulsing neon green container logo block */}
              <div className="w-10 h-10 border-2 border-emerald-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.4)] bg-black">
                <div className="w-5 h-5 bg-emerald-500 animate-pulse rounded-sm"></div>
              </div>
              
              {/* Navigation icons stack */}
              <nav className="flex flex-col gap-6">
                <button
                  id="aside-shop"
                  onClick={() => setShowShop(true)}
                  title="Black Market Shop"
                  className="p-3 text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-lg transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-5 h-5" />
                </button>
                <button
                  id="aside-leader"
                  onClick={() => setShowLeaderboard(true)}
                  title="Global Leaderboards"
                  className="p-3 text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-lg transition-all cursor-pointer"
                >
                  <Trophy className="w-5 h-5" />
                </button>
                <button
                  id="aside-profile"
                  onClick={() => setShowProfile(true)}
                  title="Player Profile"
                  className="p-3 text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-lg transition-all cursor-pointer"
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  id="aside-settings"
                  onClick={() => setShowSettings(true)}
                  title="System Settings"
                  className="p-3 text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-lg transition-all cursor-pointer"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </nav>
            </div>

            {/* Bottom active profile circle */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleToggleMusic}
                title={isMusicPlaying ? "Stop Synthesizer BGM" : "Engage Synthesizer BGM"}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                  isMusicPlaying 
                    ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow-[0_0_10px_rgba(0,255,65,0.4)]'
                    : 'border-zinc-805 text-zinc-500 hover:text-emerald-500 bg-zinc-900/60'
                }`}
              >
                <Disc className={`w-4 h-4 ${isMusicPlaying ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setShowProfile(true)}
                className="w-10 h-10 rounded-full border border-emerald-500/40 bg-gradient-to-tr from-black to-[#111] flex items-center justify-center text-sm font-bold text-emerald-500 hover:border-emerald-500 shadow-[0_0_8px_rgba(0,255,65,0.2)] transition-all cursor-pointer"
              >
                {avatarSymbol}
              </button>
            </div>
          </aside>

          {/* Master View Window */}
          <div className="flex-1 flex flex-col z-10 overflow-y-auto min-h-screen">
            
            {/* Top Sleek Header banner */}
            <CyberNavbar
              onOpenShop={() => setShowShop(true)}
              onOpenLeaderboard={() => setShowLeaderboard(true)}
              onOpenProfile={() => setShowProfile(true)}
              onOpenSettings={() => setShowSettings(true)}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={handleToggleMusic}
            />

            {/* Core Body Container - Bento grid layout */}
            <main className="flex-1 p-4 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 max-w-7xl w-full mx-auto justify-center">
              
              {/* Left Column (Main Board content - width 8) */}
              <div className="md:col-span-8 flex flex-col gap-6 sm:gap-8">
                
                {/* 1. Hero Showcase Wave Dash Section */}
                <section className="relative h-[300px] sm:h-[340px] rounded-3xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10"></div>
                  <div className="absolute inset-0 bg-[#0a0a0a] border border-emerald-500/20 rounded-3xl"></div>
                  
                  {/* Glowing custom graphics inside */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/10 via-transparent to-transparent pointer-events-none opacity-50" />
                  
                  {/* Decorative techno bracket in corner */}
                  <div className="absolute top-8 right-8 z-20 pointer-events-none">
                     <div className="w-20 h-20 sm:w-28 sm:h-28 border-r border-t border-emerald-500/30"></div>
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 z-20">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <span className="px-2 py-0.5 bg-emerald-500 text-black text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded">Trending Now</span>
                      <span className="px-2 py-0.5 border border-emerald-500 text-emerald-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-950/20">Speed Vector</span>
                    </div>
                    
                    <h2 className="text-3xl sm:text-5xl font-black uppercase text-white mb-2 tracking-tighter sm:text-shadow-[0_0_12px_#ffb800]">
                      Wave Dash
                    </h2>
                    
                    <p className="text-zinc-400 text-xs max-w-md mb-5 leading-relaxed font-mono">
                      Navigate the equipped arrow pointer through a lethal geometric grid bounds. High-speed vector precision required. Speed scales dynamically.
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <button
                        id="play-hero-wave-btn"
                        onClick={() => {
                          audio.playClick();
                          setActiveGame('waveDash');
                        }}
                        className="w-fit px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs rounded-sm shadow-[0_0_25px_rgba(0,255,65,0.4)] transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        Play Now
                      </button>

                      {profile.stats.waveDashHighScore > 0 && (
                        <span className="font-mono text-[10px] sm:text-xs text-white/50">
                          PREVIOUS HIGHSCORE: <b className="text-emerald-500">{profile.stats.waveDashHighScore}</b>
                        </span>
                      )}
                    </div>
                  </div>
                </section>

                {/* 2. Your Library Area */}
                <section>
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Our Game Library</h3>
                    <span className="text-[10px] text-emerald-500 hover:underline cursor-pointer font-mono font-bold">// SECURE_LEDGER_GRID</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Library Card 1: Love Runner */}
                    <div 
                      id="card-love-runner"
                      onClick={() => {
                        audio.playClick();
                        setActiveGame('loveRunner');
                      }}
                      className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl flex gap-4 hover:border-emerald-500/40 hover:bg-[#080808]/50 transition-all cursor-pointer group"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-pink-500 via-pink-600 to-[#0e0007] flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-md">
                         <div className="absolute inset-0 bg-black/20"></div>
                         <Flame className="w-8 h-8 text-white relative z-10 animate-pulse" />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <h4 className="font-extrabold text-base sm:text-lg text-white group-hover:text-emerald-500 transition-colors truncate">
                          Love Runner
                        </h4>
                        <p className="text-[11px] sm:text-xs text-zinc-400 mb-2 truncate">Infinite neon city speed dash.</p>
                        <div className="flex gap-2">
                          <span className="text-[10px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900 text-zinc-400 font-mono font-semibold">
                            HIGH: {profile.stats.loveRunnerHighScore}m
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Library Card 2: Chess League */}
                    <div 
                      id="card-chess"
                      onClick={() => {
                        audio.playClick();
                        setActiveGame('chess');
                      }}
                      className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl flex gap-4 hover:border-emerald-500/40 hover:bg-[#080808]/50 transition-all cursor-pointer group"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-zinc-700 via-zinc-800 to-black flex-shrink-0 flex items-center justify-center relative overflow-hidden shadow-md">
                         <div className="absolute inset-0 bg-black/30"></div>
                         <Swords className="w-8 h-8 text-white relative z-10" />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <h4 className="font-extrabold text-base sm:text-lg text-white group-hover:text-emerald-500 transition-colors truncate">
                          Chess League
                        </h4>
                        <p className="text-[11px] sm:text-xs text-zinc-400 mb-2 truncate">PvP and Neural AI strategist.</p>
                        <div className="flex gap-2">
                           <span className="text-[10px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900 text-zinc-400 font-mono font-semibold">
                             ELO: {1200 + (profile.stats.chessWinsVsAI * 15) - (profile.stats.chessLossesVsAI * 10)} MMR
                           </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </section>

                {/* Sub banner panel */}
                <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left relative overflow-hidden">
                  <div className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-xl">
                    <Gamepad2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-mono text-[9px] font-bold tracking-widest text-emerald-500 uppercase">// MODULE_ACTIVE_READY</h4>
                    <h3 className="text-sm font-extrabold text-white mt-1">ADD MODULAR GAMES</h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Shared currency tokens and local states persistence automatically link upon module boot and compilation.
                    </p>
                  </div>
                  <div className="px-3 py-1 border border-dashed border-zinc-700 font-mono text-[9px] font-bold uppercase rounded text-zinc-500 shrink-0">
                    SYSTEMS_OK
                  </div>
                </div>

              </div>

              {/* Right Column (Diagnostic & Leaderboard sidebar - width 4) */}
              <div className="md:col-span-4 flex flex-col gap-6">
                
                {/* 1. Cyber Diagnostic User Card */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-5 sm:p-6 shadow-[0_0_15px_rgba(0,255,65,0.03)]">
                  <div className="flex items-center gap-4 mb-6">
                    {/* Glowing Avatar base border box */}
                    <div className="w-12 h-12 rounded-full border border-emerald-500 p-1 bg-black">
                      <div className="w-full h-full rounded-full bg-zinc-905 flex items-center justify-center text-xl">
                        {avatarSymbol}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-white tracking-tight text-base">{profile.username}</h3>
                      <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest font-mono">
                        LEVEL {Math.max(1, 1 + Math.floor(profile.totalScore / 1000))} CHROME MASTER
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 font-mono">
                    <div className="bg-black/60 border border-white/5 p-3 rounded-xl">
                      <p className="text-[9px] uppercase text-zinc-550 mb-1">ACHIEVEMENTS</p>
                      <p className="text-lg font-black text-white">
                        {unlockedAchievementsCount}/{totalAchievementsCount}
                      </p>
                    </div>
                    <div className="bg-black/60 border border-white/5 p-3 rounded-xl">
                      <p className="text-[9px] uppercase text-zinc-550 mb-1">COMPETENCY</p>
                      <p className="text-lg font-black text-emerald-500">
                        {calculatedWinRate}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Global Leaderboard Mini Dashboard Feed */}
                <div className="bg-zinc-900/10 border border-white/5 rounded-3xl p-5 sm:p-6 flex flex-col overflow-hidden min-h-[280px]">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-5">
                    Realtime Scoreboard
                  </h3>
                  
                  {/* Scoreboard List feed */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {profile.leaderboard.length > 0 ? (
                      profile.leaderboard.map((entry, index) => {
                        const rankNum = String(index + 1).padStart(2, '0');
                        return (
                          <div 
                            key={entry.id} 
                            className={`flex items-center justify-between p-3 border-l-2 rounded-r-xl transition-all ${
                              index === 0 
                                ? 'bg-emerald-500/5 border-emerald-500' 
                                : 'bg-black/20 border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-black ${index === 0 ? 'text-emerald-500' : 'text-zinc-600'} w-4 font-mono`}>
                                {rankNum}
                              </span>
                              <span className={`text-xs font-semibold ${index === 0 ? 'text-white font-bold' : 'text-zinc-300'} truncate max-w-[120px]`}>
                                {entry.username}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-zinc-400">{entry.score} pts</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-zinc-650 text-xs">
                        <AlertCircle className="w-5 h-5 mb-2 text-zinc-700" />
                        <span>No records logged on server</span>
                      </div>
                    )}

                    {/* ALWAYS HIGHLIGHT "YOU" ENTRY */}
                    <div className="flex items-center justify-between p-3 border-l-2 border-emerald-500/50 bg-emerald-500/10 rounded-r-xl shadow-[0_0_8px_rgba(0,255,65,0.05)] font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-emerald-500 w-4">ME</span>
                        <span className="text-xs text-white font-black italic">{profile.username}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-500">{Number(profile.totalScore)} XP</span>
                    </div>
                  </div>

                  {/* Operational diagnostics state */}
                  <div className="mt-4 p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[8.5px] uppercase text-zinc-500 tracking-wider mb-0.5">Platform Node Grid</span>
                       <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter pr-2">All Systems Operational</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#ffb800]"></div>
                  </div>
                </div>

              </div>

            </main>

            {/* Platform Footer */}
            <footer className="h-14 px-4 sm:px-10 flex flex-col sm:flex-row items-center justify-between bg-black text-[9px] sm:text-[10px] uppercase font-semibold tracking-[0.2em] text-white/30 border-t border-white/5 gap-2 sm:gap-4 mt-8 py-3 sm:py-0 shrink-0">
              <div className="flex gap-6">
                <span className="hover:text-emerald-500 cursor-pointer transition-colors" onClick={() => setShowSettings(true)}>Support</span>
                <span className="hover:text-emerald-500 cursor-pointer transition-colors" onClick={() => setShowSettings(true)}>Terms</span>
                <span className="hover:text-emerald-500 cursor-pointer transition-colors" onClick={() => setShowProfile(true)}>Developer Log</span>
              </div>
              <div className="font-mono">
                &copy; 2026 NURMD SYSTEM ARCHITECTURE Grid Node // 127.0.0.1:3000
              </div>
            </footer>

          </div>

          {/* ACTIVE MODAL MOUNT NODES */}
          {showShop && <ShopModal onClose={() => setShowShop(false)} />}
          {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
          {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

          {/* GAMES HOST POPUP SCREENS */}
          {activeGame === 'loveRunner' && (
            <LoveRunnerGame onClose={() => setActiveGame(null)} />
          )}
          {activeGame === 'chess' && (
            <ChessGame onClose={() => setActiveGame(null)} />
          )}
          {activeGame === 'waveDash' && (
            <WaveDashGame onClose={() => setActiveGame(null)} />
          )}

          {/* Floating Achievement Toasts notifier */}
          <AchievementToast />

        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <React.StrictMode>
      <GameStoreProvider>
        <HubPortal />
      </GameStoreProvider>
    </React.StrictMode>
  );
}
