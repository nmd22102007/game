/**
 * WAVE DASH: GEOMETRY ARROW - Geometry Dash Wave Style Vector Runner
 * High-performance HTML5 Canvas simulation code with:
 * - Hold-to-rise, release-to-dip real mechanical physics equations.
 * - Real-time green gold coin collections.
 * - Staggered trail sparks synced with shop equipped Arrow Skins.
 * - Game Modes: Endless High Score pursuit AND Progression Levels (reaching 100% survival unlocks).
 */

import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../../services/store';
import { audio } from '../../services/audio';
import { X, Play, RotateCcw, Award, Coins, Flame, Map, CheckCircle2 } from 'lucide-react';

interface WaveDashGameProps {
  onClose: () => void;
}

interface LevelPreset {
  id: string;
  name: string;
  speed: number;
  length: number; // Duration or score goal to finish
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  color: string;
}

const PRESET_LEVELS: LevelPreset[] = [
  { id: '1', name: 'VECTOR SECTOR', speed: 6, length: 1000, difficulty: 'EASY', color: '#10b981' },
  { id: '2', name: 'SUNSET CASCADE', speed: 7.5, length: 1500, difficulty: 'MEDIUM', color: '#ec4899' },
  { id: '3', name: 'CYBER CHAOS MATRIX', speed: 9, length: 2000, difficulty: 'HARD', color: '#a855f7' }
];

export const WaveDashGame: React.FC<WaveDashGameProps> = ({ onClose }) => {
  const { addCoins, updateHighScore, incrementPlayCount, profile } = useGameStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game state vars
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWonLevel, setHasWonLevel] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<LevelPreset | null>(null); // Null = endless mode!
  
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [highScore, setHighScore] = useState(profile.stats.waveDashHighScore);
  const [levelProgress, setLevelProgress] = useState(0); // 0 to 100 %

  // Core high speed state ref
  const stateRef = useRef({
    isPlaying: false,
    isGameOver: false,
    hasWonLevel: false,
    score: 0,
    coinsCollected: 0,
    isMouseDown: false,
    arrow: {
      x: 120,
      y: 200,
      radius: 12,
      vy: 0,
      speedUp: -5.2,
      speedDown: 5.2,
    },
    obstacles: [] as Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      isTriangle: boolean;
    }>,
    coins: [] as Array<{
      x: number;
      y: number;
      radius: number;
      collected: boolean;
    }>,
    particles: [] as Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      life: number;
      maxLife: number;
      radius: number;
    }>,
    trail: [] as Array<{ x: number; y: number }>,
    gameSpeed: 6.5,
    distanceSinceLastObstacle: 0,
    distanceSinceLastCoin: 0,
    trackHeight: 280, // Safe bounding inner tracks
    viewportWidth: 800,
    viewportHeight: 400,
  });

  // Equipped cosmetic details
  const equippedArrow = profile.skins.find(s => s.type === 'arrow' && s.equipped) || { glowColor: '#10b981', color: 'text-emerald-400' };
  const particleColor = equippedArrow.glowColor;

  useEffect(() => {
    incrementPlayCount('waveDash');
  }, []);

  // Window inputs handler (Space / Click hold patterns)
  useEffect(() => {
    const s = stateRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        s.isMouseDown = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        s.isMouseDown = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Selection start game
  const startNewRun = (preset: LevelPreset | null) => {
    audio.playClick();
    setSelectedLevel(preset);

    const s = stateRef.current;
    s.isPlaying = true;
    s.isGameOver = false;
    s.hasWonLevel = false;
    s.score = 0;
    s.coinsCollected = 0;
    s.gameSpeed = preset ? preset.speed : 6.5;
    s.obstacles = [];
    s.coins = [];
    s.particles = [];
    s.trail = [];
    s.arrow.y = 200;
    s.arrow.vy = 0;
    s.isMouseDown = false;

    setScore(0);
    setCoinsCollected(0);
    setLevelProgress(0);
    setHasWonLevel(false);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  // Main Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const gameLoop = () => {
      const s = stateRef.current;

      // Auto resize bounds
      if (canvas.width !== canvas.parentElement?.clientWidth) {
        canvas.width = canvas.parentElement?.clientWidth || 800;
        canvas.height = canvas.parentElement?.clientHeight || 400;
        s.viewportWidth = canvas.width;
        s.viewportHeight = canvas.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const topBoundary = 50;
      const bottomBoundary = canvas.height - 50;

      // 1. PHYSICAL EQUATIONS CALCULATIONS IF PLAYING
      if (s.isPlaying && !s.isGameOver && !s.hasWonLevel) {
        s.score += 1;
        setScore(s.score);

        // Map selection progress percentage tracking
        if (selectedLevel) {
          const progressVal = Math.min(100, Math.round((s.score / selectedLevel.length) * 100));
          setLevelProgress(progressVal);

          if (s.score >= selectedLevel.length) {
            triggerLevelWin();
          }
        } else {
          // Endless Mode speeds up slightly over time
          s.gameSpeed = 6.2 + Math.floor(s.score / 250) * 0.4;
        }

        // Holding to rise, release to fall
        if (s.isMouseDown) {
          s.arrow.vy = s.arrow.speedUp;
        } else {
          s.arrow.vy = s.arrow.speedDown;
        }

        s.arrow.y += s.arrow.vy;

        // Bounding limits collision check
        if (s.arrow.y - s.arrow.radius < topBoundary) {
          s.arrow.y = topBoundary + s.arrow.radius;
          s.arrow.vy = 0;
        }
        if (s.arrow.y + s.arrow.radius > bottomBoundary) {
          s.arrow.y = bottomBoundary - s.arrow.radius;
          s.arrow.vy = 0;
        }

        // Shift existing trail points to make the light path flow straight back with the game scrolling speed
        s.trail.forEach(pt => {
          pt.x -= s.gameSpeed;
        });

        // Add coordinate to trailing spark wave lines
        s.trail.push({ x: s.arrow.x, y: s.arrow.y });
        if (s.trail.length > 35) s.trail.shift();

        // Spawn Trail custom spark particles
        if (Math.random() > 0.2) {
          s.particles.push({
            x: s.arrow.x - 10,
            y: s.arrow.y,
            vx: -s.gameSpeed * 0.3 - Math.random() * 2,
            vy: (Math.random() - 0.5) * 3,
            color: particleColor,
            life: 25,
            maxLife: 25,
            radius: Math.random() * 2.5 + 1
          });
        }

        // Obstacles spawner logic
        s.distanceSinceLastObstacle += s.gameSpeed;
        if (s.distanceSinceLastObstacle > Math.random() * 120 + 150) {
          const isTriangle = Math.random() > 0.4;
          let oY = 0;
          let oHeight = Math.random() * 80 + 40;
          let oWidth = 30;

          if (isTriangle) {
            // Roof vs Floor Spikes
            const isRoof = Math.random() > 0.5;
            oY = isRoof ? topBoundary : bottomBoundary - oHeight;
            s.obstacles.push({
              x: canvas.width + 10,
              y: oY,
              width: oWidth,
              height: oHeight,
              isTriangle: true
            });
          } else {
            // Solid rectangular narrow floating wall gates
            oY = Math.random() * (bottomBoundary - topBoundary - 130) + topBoundary + 25;
            s.obstacles.push({
              x: canvas.width + 10,
              y: oY,
              width: 32,
              height: oHeight,
              isTriangle: false
            });
          }

          s.distanceSinceLastObstacle = 0;
        }

        // Spawns Core Dash Coins (green)
        s.distanceSinceLastCoin += s.gameSpeed;
        if (s.distanceSinceLastCoin > Math.random() * 140 + 170) {
          s.coins.push({
            x: canvas.width + 10,
            y: Math.random() * (bottomBoundary - topBoundary - 60) + topBoundary + 30,
            radius: 8,
            collected: false
          });
          s.distanceSinceLastCoin = 0;
        }

        // Update obstacles positions and check hitboxes
        s.obstacles.forEach(obs => {
          obs.x -= s.gameSpeed;

          // Simple polygon AABB proximity checks
          const buffer = 3;
          if (
            s.arrow.x + s.arrow.radius > obs.x + buffer &&
            s.arrow.x - s.arrow.radius < obs.x + obs.width - buffer &&
            s.arrow.y + s.arrow.radius > obs.y + buffer &&
            s.arrow.y - s.arrow.radius < obs.y + obs.height - buffer
          ) {
            triggerGameOver();
          }
        });
        s.obstacles = s.obstacles.filter(obs => obs.x + obs.width > -10);

        // Update green Coins positions
        s.coins.forEach(coin => {
          coin.x -= s.gameSpeed;

          const dx = s.arrow.x - coin.x;
          const dy = s.arrow.y - coin.y;
          const dist = Math.hypot(dx, dy);

          if (dist < (coin.radius + s.arrow.radius + 8) && !coin.collected) {
            coin.collected = true;
            s.coinsCollected += 1;
            setCoinsCollected(s.coinsCollected);
            audio.playCoin();
            createExplosion(coin.x, coin.y, '#10b981');
          }
        });
        s.coins = s.coins.filter(c => !c.collected && c.x + c.radius > -10);
      }

      // Update particles
      s.particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) s.particles.splice(index, 1);
      });

      // 2. RENDERING CANVAS GRAPHIC GRAPHICS LAYERS

      // A. Starry cyber gradient space
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#09090b');
      bgGrad.addColorStop(0.6, '#03141f'); // dark blue geometry wave atmosphere
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ceiling and floor boundaries grids static glow lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, topBoundary);
      ctx.lineTo(canvas.width, topBoundary);
      ctx.moveTo(0, bottomBoundary);
      ctx.lineTo(canvas.width, bottomBoundary);
      ctx.stroke();

      // Draw stylized warning diagonal stripes in ceiling border area
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let sx = 0; sx < canvas.width; sx += 40) {
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx + 20, 0);
        ctx.lineTo(sx - 10, topBoundary);
        ctx.lineTo(sx - 30, topBoundary);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(sx, bottomBoundary);
        ctx.lineTo(sx + 20, bottomBoundary);
        ctx.lineTo(sx - 10, canvas.height);
        ctx.lineTo(sx - 30, canvas.height);
        ctx.closePath();
        ctx.fill();
      }

      // B. Draw Wave continuous trails line
      if (s.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = particleColor;
        ctx.shadowColor = particleColor;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        ctx.moveTo(s.trail[0].x, s.trail[0].y);
        for (let i = 1; i < s.trail.length; i++) {
          ctx.lineTo(s.trail[i].x, s.trail[i].y);
        }
        ctx.stroke();

        // Sleek thin inner core line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // C. Draw Arrow Player Shape
      ctx.save();
      ctx.translate(s.arrow.x, s.arrow.y);
      
      // Rotate based on current movement direction vector
      // Point straight forward (angle 0) when gliding along ceiling/floor boundaries
      const targetAngle = s.arrow.vy === 0 ? 0 : (s.arrow.vy < 0 ? -Math.PI / 6 : Math.PI / 6);
      ctx.rotate(targetAngle);

      // Glowing body bounds
      ctx.shadowColor = particleColor;
      ctx.shadowBlur = 15;
      ctx.fillStyle = particleColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      ctx.beginPath();
      // Cyber Chevron styled triangle arrow head
      ctx.moveTo(14, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // D. Draw Green gold coins
      s.coins.forEach(coin => {
        ctx.save();
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#10b981';
        
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner glowing spin star
        ctx.fillStyle = '#ffffff';
        const pulse = Math.abs(Math.sin(Date.now() / 150)) * 2;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius * 0.45 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // E. Draw Obstacles shapes
      s.obstacles.forEach(obs => {
        ctx.save();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.5;

        if (obs.isTriangle) {
          // Draw pointy neon obstacle triangles
          ctx.fillStyle = '#e11d48'; // crimson block
          ctx.beginPath();
          
          const isRoof = obs.y < 100;
          if (isRoof) {
            // Pointing downwards
            ctx.moveTo(obs.x, obs.y);
            ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width, obs.y);
          } else {
            // Pointing upwards
            ctx.moveTo(obs.x, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width / 2, obs.y);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Draw solid rectangular floating grid walls
          ctx.fillStyle = '#4c0519'; // very deep crimson dark
          ctx.beginPath();
          ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 4);
          ctx.fill();
          ctx.stroke();

          // Internal grid warning lines
          ctx.strokeStyle = '#ef444455';
          ctx.lineWidth = 1;
          for (let gy = obs.y + 10; gy < obs.y + obs.height; gy += 15) {
            ctx.beginPath();
            ctx.moveTo(obs.x, gy);
            ctx.lineTo(obs.x + obs.width, gy);
            ctx.stroke();
          }
        }
        ctx.restore();
      });

      // F. Draw Particles
      s.particles.forEach(p => {
        ctx.fillStyle = p.color;
        const opacity = p.life / p.maxLife;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      frameId = requestAnimationFrame(gameLoop);
    };

    frameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, isGameOver, hasWonLevel, particleColor]);

  // Spark explosions
  const createExplosion = (x: number, y: number, color: string) => {
    const s = stateRef.current;
    for (let i = 0; i < 15; i++) {
      s.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color,
        life: 20,
        maxLife: 20,
        radius: Math.random() * 2 + 1
      });
    }
  };

  const triggerGameOver = () => {
    const s = stateRef.current;
    s.isGameOver = true;
    s.isPlaying = false;
    setIsGameOver(true);
    setIsPlaying(false);

    audio.playCrash();
    createExplosion(s.arrow.x, s.arrow.y, '#e11d48');
    createExplosion(s.arrow.x, s.arrow.y, particleColor);

    // Save outputs
    addCoins(s.coinsCollected);
    if (!selectedLevel) {
      updateHighScore('Wave Dash', s.score);
    }
  };

  const triggerLevelWin = () => {
    const s = stateRef.current;
    s.hasWonLevel = true;
    s.isPlaying = false;
    setHasWonLevel(true);
    setIsPlaying(false);

    audio.playVictory();
    createExplosion(s.arrow.x, s.arrow.y, '#fbbf24');
    createExplosion(s.arrow.x, s.arrow.y, '#10b981');

    // Credit coins
    const levelCompletionBonus = selectedLevel ? (levelProgress === 100 ? 55 : 0) : 0;
    addCoins(s.coinsCollected + levelCompletionBonus);
  };

  return (
    <div className="fixed inset-0 z-40 bg-zinc-950 flex flex-col font-sans select-none overflow-hidden safe-area-padding">
      
      {/* Game Head Panel */}
      <div className="bg-zinc-900 border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40">
            <span className="text-cyan-400 font-mono text-xs">WD</span>
          </div>
          <div>
            <h2 className="text-white text-xs font-bold font-mono tracking-widest uppercase sm:text-sm">
              WAVE DASH: {selectedLevel ? selectedLevel.name : 'ENDLESS CORE'}
            </h2>
            <p className="text-[9px] text-zinc-500 font-mono tracking-tighter">GRID_AGENT://VECTOR_WAVE_V1.10</p>
          </div>
        </div>

        {/* Level Percentage Indicator bar */}
        {isPlaying && selectedLevel && (
          <div className="hidden sm:flex items-center gap-3 w-48 font-mono text-xs">
            <span className="text-zinc-500">GRID_COMP:</span>
            <div className="flex-1 h-2 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${levelProgress}%` }} />
            </div>
            <span className="text-cyan-400 font-bold">{levelProgress}%</span>
          </div>
        )}

        {/* Live scores */}
        {isPlaying && (
          <div className="flex gap-4 font-mono text-xs text-right">
            <div>
              <span className="block text-[8px] text-zinc-500">POINTS</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">{score}</span>
            </div>
            <div>
              <span className="block text-[8px] text-zinc-500 font-bold text-green-400">COINS</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{coinsCollected}</span>
            </div>
          </div>
        )}

        <button
          id="close-wave-game"
          onClick={onClose}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-zinc-400 hover:text-white hover:border-emerald-500/50 transition font-mono text-xs flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Play Workspace Host Canvas */}
      <div
        className="flex-1 relative bg-[#050508]"
        onMouseDown={() => {
          if (isPlaying) stateRef.current.isMouseDown = true;
        }}
        onMouseUp={() => {
          if (isPlaying) stateRef.current.isMouseDown = false;
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          if (isPlaying) stateRef.current.isMouseDown = true;
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (isPlaying) stateRef.current.isMouseDown = false;
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block w-full h-full cursor-pointer"
        />

        {/* Progress percent layer overlay for mobile */}
        {isPlaying && selectedLevel && (
          <div className="absolute top-4 left-4 z-10 flex gap-2 sm:hidden items-center text-xs font-mono text-cyan-400 bg-zinc-950/80 border border-zinc-800 px-2 py-1 rounded-md">
            <span>COMP: {levelProgress}%</span>
          </div>
        )}

        {/* 1. LOBBY OPTIONS SELECTION */}
        {!isPlaying && !isGameOver && !hasWonLevel && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
            <div className="max-w-xl w-full space-y-6 container py-4">
              <div className="relative inline-block">
                <div className="absolute -inset-2 bg-cyan-500/25 blur-xl animate-pulse rounded-full" />
                <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase font-mono relative">
                  WAVE <span className="text-cyan-400">DASH</span>
                </h1>
              </div>

              <p className="text-xs text-zinc-450 leading-relaxed max-w-sm mx-auto font-mono">
                Click-and-hold/Tap-and-hold to scale up diagonally. Release to plunge downward. Dodge neon laser triangles, collect core data coins inside ceiling bounds!
              </p>

              {/* Levels / Maps chooser container */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                {PRESET_LEVELS.map(level => (
                  <button
                    key={level.id}
                    id={`wave-level-${level.id}`}
                    onClick={() => startNewRun(level)}
                    className="relative bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-left hover:border-cyan-500/60 hover:bg-cyan-950/10 transition-all font-mono space-y-2 group flex flex-col justify-between h-[120px] cursor-pointer"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <Map className="w-5 h-5 text-cyan-500" />
                        <span className="text-[8px] px-1 bg-zinc-900 border border-zinc-800 font-bold group-hover:text-cyan-400 text-zinc-400">
                          {level.difficulty}
                        </span>
                      </div>
                      <h3 className="text-white text-xs font-bold uppercase mt-2 group-hover:text-cyan-400 truncate w-full">
                        {level.name}
                      </h3>
                    </div>
                    <span className="text-[9px] text-zinc-500 block">GOAL: {level.length} POINTS</span>
                  </button>
                ))}
              </div>

              {/* Endless select trigger */}
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  id="wave-start-endless"
                  onClick={() => startNewRun(null)}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-extrabold py-3.5 px-6 rounded-lg font-mono text-xs tracking-widest uppercase transition shadow-[0_0_15px_rgba(34,211,238,0.3)] cursor-pointer"
                >
                  <Play className="w-4 h-4 inline-block mr-1 text-zinc-920" />
                  INITIATE ENDLESS RANGE
                </button>

                {highScore > 0 && (
                  <div className="flex justify-center items-center gap-2 text-xs font-mono text-zinc-500 mt-1">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>INDIVIDUAL SECURE HIGHSCORE: <b>{highScore}</b></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. LEVEL COMPLETED SUCCESS SCREEN */}
        {hasWonLevel && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="max-w-sm w-full space-y-6">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-pulse" />
              <div className="text-emerald-400 font-mono text-4xl font-extrabold tracking-widest uppercase">
                GRID_SUCCESS
              </div>
              
              <div className="bg-zinc-900/50 border-2 border-emerald-500/20 p-5 rounded-2xl font-mono text-xs text-left space-y-3.5 bg-zinc-950">
                <p className="text-[10px] text-zinc-400 leading-normal text-center mb-2 font-mono">
                  Vector sector bypassed securely. Level completed entirely! Core coins added to shared ledger.
                </p>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">LEVEL COMPLETED:</span>
                  <span className="text-white font-bold">{selectedLevel?.name}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">LEVEL BONUS GAIN:</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Coins className="w-3.5 h-3.5" />
                    <span>+55 Coins</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">CURRENCY IN RUN:</span>
                  <span className="text-emerald-400 font-bold">+{coinsCollected} Coins</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  id="win-restart-btn"
                  onClick={() => startNewRun(selectedLevel)}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-extrabold py-3.5 px-4 rounded-lg font-mono text-xs tracking-widest uppercase transition cursor-pointer"
                >
                  Replay
                </button>
                <button
                  id="win-exit-btn"
                  onClick={() => setHasWonLevel(false)}
                  className="flex-1 border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white font-extrabold py-3.5 px-4 rounded-lg font-mono text-xs tracking-widest uppercase transition cursor-pointer"
                >
                  Exit Maps
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. GAME OVER OVERLAY */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="max-w-sm w-full space-y-6">
              <div className="text-rose-500 font-mono text-4xl font-extrabold tracking-widest uppercase blink">
                WAVE_DISSOLVED
              </div>

              <div className="bg-zinc-900/50 border-2 border-red-500/20 p-5 rounded-2xl font-mono text-xs text-left space-y-3.5 bg-zinc-950">
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">VECTORS PROGRESS:</span>
                  <span className="text-white font-bold">{score} pts</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">COINS RECOVERED:</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold animate-pulse">
                    <Coins className="w-3.5 h-3.5" />
                    <span>+{coinsCollected} Coins</span>
                  </div>
                </div>
                {!selectedLevel && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">ENDLESS HIGHSCORE:</span>
                    <span className="text-cyan-400 font-bold">{Math.max(score, highScore)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  id="fail-restart-btn"
                  onClick={() => startNewRun(selectedLevel)}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-extrabold py-3.5 px-4 rounded-lg font-mono text-xs tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  Try Again
                </button>
                <button
                  id="fail-exit-btn"
                  onClick={() => {
                    setIsGameOver(false);
                    setSelectedLevel(null);
                  }}
                  className="flex-1 border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white font-extrabold py-3.5 px-4 rounded-lg font-mono text-xs tracking-widest uppercase transition cursor-pointer"
                >
                  Lobby Menu
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
