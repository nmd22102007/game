/**
 * LOVE RUNNER - Endless Cyberpunk Cybercity Runner
 * Implemented with HTML5 Canvas, high-performance particle animation loop,
 * dynamic audio synthesizer sync, double jumps, and sliding mechanics.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../../services/store';
import { audio } from '../../services/audio';
import { Play, RotateCcw, X, Award, Shield, Zap, Sparkles, Volume2, Coins } from 'lucide-react';

interface LoveRunnerGameProps {
  onClose: () => void;
}

export const LoveRunnerGame: React.FC<LoveRunnerGameProps> = ({ onClose }) => {
  const { addCoins, updateHighScore, incrementPlayCount, profile } = useGameStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Game states managed in React UI
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [highScore, setHighScore] = useState(profile.stats.loveRunnerHighScore);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);

  // Core configuration states (synced to Ref for the high speed loop)
  const stateRef = useRef({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    coinsCollected: 0,
    runner: {
      x: 80,
      y: 0,
      width: 32,
      height: 48,
      vy: 0,
      gravity: 0.65,
      isGrounded: false,
      jumpForce: -11,
      jumpCount: 0,
      isSliding: false,
      slideTimer: 0,
    },
    obstacles: [] as Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      type: 'low' | 'high' | 'laser';
      passed: boolean;
    }>,
    coins: [] as Array<{
      x: number;
      y: number;
      radius: number;
      collected: boolean;
    }>,
    powerups: [] as Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      type: 'shield' | 'booster' | 'multiplier';
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
    bgStars: [] as Array<{ x: number; y: number; speed: number; speedScale?: number; radius: number }>,
    gameSpeed: 7,
    distanceSinceLastObstacle: 0,
    distanceSinceLastCoin: 0,
    distanceSinceLastPowerup: 0,
    hasShield: false,
    hasMultiplier: false,
    hasBooster: false,
    boosterTimer: 0,
    multiplierTimer: 0,
    shieldTimer: 0,
    viewportWidth: 800,
    viewportHeight: 400,
  });

  // Equip check for customized cosmetics in Shop Binders
  const equippedRunner = profile.skins.find(s => s.type === 'runner' && s.equipped) || { glowColor: '#10b981' };
  const playerColor = equippedRunner.glowColor;

  useEffect(() => {
    // Increment play count
    incrementPlayCount('loveRunner');

    // Create starry synth space BGM backing stars
    const stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 320,
        speed: Math.random() * 0.4 + 0.1,
        radius: Math.random() * 1.5 + 0.5,
      });
    }
    stateRef.current.bgStars = stars;
  }, []);

  // Keyboard handler triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current.isPlaying || stateRef.current.isGameOver) return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        triggerJump();
      }
      if (e.code === 'ArrowDown' || e.key === 's' || e.code === 'ShiftLeft') {
        e.preventDefault();
        triggerSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Jump Command Trigger
  const triggerJump = () => {
    const s = stateRef.current;
    if (s.runner.isGrounded) {
      s.runner.vy = s.runner.jumpForce;
      s.runner.isGrounded = false;
      s.runner.jumpCount = 1;
      s.runner.isSliding = false;
      audio.playJump();
      createJumpDust(s.runner.x + 16, s.runner.y + 48);
    } else if (s.runner.jumpCount < 2) {
      // Double jump
      s.runner.vy = s.runner.jumpForce * 0.85;
      s.runner.jumpCount = 2;
      audio.playJump();
      createDoubleJumpEffect(s.runner.x + 16, s.runner.y + 24);
    }
  };

  // Slide Command Trigger
  const triggerSlide = () => {
    const s = stateRef.current;
    if (s.runner.isGrounded && !s.runner.isSliding) {
      s.runner.isSliding = true;
      s.runner.slideTimer = 35; // Frames count
      s.runner.height = 24; // Shrink hitbox height
      s.runner.y += 24; // Push down to stay grounded
      audio.playClick();
      createSlideDust(s.runner.x, s.runner.y + 24);
    }
  };

  const createJumpDust = (x: number, y: number) => {
    const s = stateRef.current;
    for (let i = 0; i < 8; i++) {
      s.particles.push({
        x,
        y: y - 5,
        vx: (Math.random() - 0.5) * 3 - 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: '#ffffff30',
        life: 15,
        maxLife: 15,
        radius: Math.random() * 2 + 1,
      });
    }
  };

  const createDoubleJumpEffect = (x: number, y: number) => {
    const s = stateRef.current;
    for (let i = 0; i < 12; i++) {
      s.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * 2 + 2,
        color: `${playerColor}99`,
        life: 20,
        maxLife: 20,
        radius: Math.random() * 3 + 1,
      });
    }
  };

  const createSlideDust = (x: number, y: number) => {
    const s = stateRef.current;
    for (let i = 0; i < 5; i++) {
      s.particles.push({
        x,
        y,
        vx: -Math.random() * 3 - 2,
        vy: -Math.random() * 1.5,
        color: `${playerColor}55`,
        life: 12,
        maxLife: 12,
        radius: Math.random() * 2 + 1,
      });
    }
  };

  // Main Canvas Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      const s = stateRef.current;
      
      // Auto adjust size
      if (canvas.width !== canvas.parentElement?.clientWidth) {
        canvas.width = canvas.parentElement?.clientWidth || 800;
        canvas.height = canvas.parentElement?.clientHeight || 400;
        s.viewportWidth = canvas.width;
        s.viewportHeight = canvas.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const groundY = canvas.height - 70;

      // 1. UPDATE GAME VARIABLES IF RUNNING
      if (s.isPlaying && !s.isGameOver) {
        // Speed scaling gradually over score progress
        s.gameSpeed = 6.5 + Math.floor(s.score / 180) * 0.5;
        if (s.hasBooster) s.gameSpeed += 5; // Hyper boost velocity!

        s.score += 1;
        setScore(s.score);

        // Power-ups countdown timers
        if (s.hasBooster) {
          s.boosterTimer--;
          if (s.boosterTimer <= 0) {
            s.hasBooster = false;
            setActivePowerUp(null);
          }
        }
        if (s.hasMultiplier) {
          s.multiplierTimer--;
          if (s.multiplierTimer <= 0) {
            s.hasMultiplier = false;
            setActivePowerUp(null);
          }
        }
        if (s.hasShield) {
          s.shieldTimer--;
          if (s.shieldTimer <= 0) {
            s.hasShield = false;
            setActivePowerUp(null);
          }
        }

        // Runner physics equations
        s.runner.y += s.runner.vy;
        s.runner.vy += s.runner.gravity;

        // Ground collision
        if (s.runner.y + s.runner.height >= groundY) {
          s.runner.y = groundY - s.runner.height;
          s.runner.vy = 0;
          s.runner.isGrounded = true;
          s.runner.jumpCount = 0;
        }

        // Sliding countdown
        if (s.runner.isSliding) {
          s.runner.slideTimer--;
          if (s.runner.slideTimer <= 0) {
            s.runner.isSliding = false;
            s.runner.height = 48; // Restore normal height
            s.runner.y -= 24; // Restore height position safely
          }
        }

        // Spawn obstacles
        s.distanceSinceLastObstacle += s.gameSpeed;
        if (s.distanceSinceLastObstacle > Math.random() * 150 + 220) {
          const typeRand = Math.random();
          let type: 'low' | 'high' | 'laser' = 'low';
          let height = 30;
          let width = 24;
          let y = groundY - height;

          if (typeRand > 0.65) {
            type = 'high'; // slide under obstacle!
            height = 36;
            width = 30;
            y = groundY - 62;
          } else if (typeRand > 0.45) {
            type = 'laser'; // flying laser!
            height = 15;
            width = 40;
            y = groundY - 50; 
          }

          s.obstacles.push({
            x: canvas.width + 10,
            y,
            width,
            height,
            type,
            passed: false,
          });
          s.distanceSinceLastObstacle = 0;
        }

        // Spawn Coins
        s.distanceSinceLastCoin += s.gameSpeed;
        if (s.distanceSinceLastCoin > Math.random() * 80 + 100) {
          const rY = groundY - (Math.random() * 90 + 35);
          s.coins.push({
            x: canvas.width + 10,
            y: rY,
            radius: 7,
            collected: false,
          });
          s.distanceSinceLastCoin = 0;
        }

        // Spawn Powerups (Rarely)
        s.distanceSinceLastPowerup += s.gameSpeed;
        if (s.distanceSinceLastPowerup > Math.random() * 1200 + 1400) {
          const rY = groundY - (Math.random() * 60 + 30);
          const types: Array<'shield' | 'booster' | 'multiplier'> = ['shield', 'booster', 'multiplier'];
          const pickedType = types[Math.floor(Math.random() * types.length)];
          
          s.powerups.push({
            x: canvas.width + 10,
            y: rY,
            width: 20,
            height: 20,
            type: pickedType,
            collected: false,
          });
          s.distanceSinceLastPowerup = 0;
        }

        // Move and update obstacles and handle collision physics
        s.obstacles.forEach(obs => {
          obs.x -= s.gameSpeed;
          
          // Collision check
          const hBuffer = 4; // safe padding
          if (
            s.runner.x < obs.x + obs.width - hBuffer &&
            s.runner.x + s.runner.width > obs.x + hBuffer &&
            s.runner.y < obs.y + obs.height - hBuffer &&
            s.runner.y + s.runner.height > obs.y + hBuffer
          ) {
            if (s.hasBooster) {
              // Destroy obstacle instead!
              obs.x = -500;
              createExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, '#fff');
              audio.playClick();
            } else if (s.hasShield) {
              // Shield absorbed!
              s.hasShield = false;
              setActivePowerUp(null);
              obs.x = -500; // destroy obstacle
              audio.playClick();
              createExplosion(s.runner.x + 16, s.runner.y + 24, '#38bdf8');
            } else {
              // CRASH!
              triggerGameOver();
            }
          }
        });

        // Filter out past obstacles
        s.obstacles = s.obstacles.filter(obs => obs.x + obs.width > -10);

        // Update coins & collections
        s.coins.forEach(coin => {
          coin.x -= s.gameSpeed;

          // Mega Magnetic pulling if Shield active
          if (s.hasShield) {
            const dx = s.runner.x + 16 - coin.x;
            const dy = s.runner.y + 24 - coin.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 130) {
              coin.x += (dx / dist) * 7;
              coin.y += (dy / dist) * 7;
            }
          }

          // Trigger boundaries
          const dx = s.runner.x + 16 - coin.x;
          const dy = s.runner.y + (s.runner.isSliding ? 12 : 24) - coin.y;
          const coinDist = Math.hypot(dx, dy);
          
          if (coinDist < (coin.radius + 18) && !coin.collected) {
            coin.collected = true;
            const earnedAmount = s.hasMultiplier ? 2 : 1;
            s.coinsCollected += earnedAmount;
            setCoinsCollected(s.coinsCollected);
            audio.playCoin();
            createExplosion(coin.x, coin.y, '#fbbf24');
          }
        });
        s.coins = s.coins.filter(c => !c.collected && c.x + c.radius > -10);

        // Update powerups collect blocks
        s.powerups.forEach(pu => {
          pu.x -= s.gameSpeed;

          const dx = s.runner.x + 16 - (pu.x + 10);
          const dy = s.runner.y + 24 - (pu.y + 10);
          const puDist = Math.hypot(dx, dy);

          if (puDist < 25 && !pu.collected) {
            pu.collected = true;
            audio.playUnlock();
            createExplosion(pu.x + 10, pu.y + 10, '#ec4899');
            
            // apply power up
            if (pu.type === 'shield') {
              s.hasShield = true;
              s.shieldTimer = 350; // frames
              setActivePowerUp('SHIELD PROTECTION');
            } else if (pu.type === 'booster') {
              s.hasBooster = true;
              s.boosterTimer = 180;
              setActivePowerUp('CORE METRIC SPEED BOOSTER');
            } else if (pu.type === 'multiplier') {
              s.hasMultiplier = true;
              s.multiplierTimer = 450;
              setActivePowerUp('COINS X2 DOUBLE MULTIPLIER');
            }
          }
        });
        s.powerups = s.powerups.filter(pu => !pu.collected && pu.x + pu.width > -10);
      }

      // Update background stars scrolling
      s.bgStars.forEach(star => {
        // Star moves at scroll speed proportional to distance
        star.x -= star.speed * (s.isPlaying && !s.isGameOver ? s.gameSpeed * 0.3 : 0.8);
        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * (canvas.height - 80);
        }
      });

      // Update particles
      s.particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) s.particles.splice(index, 1);
      });

      // 2. CANVAS DRAWING ROUTINES (GRAPHICS RENDER ENGINE)
      
      // A. Starry outer space background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#09090b'); // very dark zinc
      bgGrad.addColorStop(0.7, '#021e13'); // very deep neon glow transition
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw starry ambient nodes
      ctx.fillStyle = '#ffffff';
      s.bgStars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Distant neon skyscrapers lines
      ctx.strokeStyle = '#10b98115';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY - 120);
      ctx.lineTo(150, groundY - 120);
      ctx.lineTo(180, groundY - 210);
      ctx.lineTo(240, groundY - 210);
      ctx.lineTo(270, groundY - 120);
      ctx.lineTo(400, groundY - 120);
      ctx.lineTo(430, groundY - 250);
      ctx.lineTo(510, groundY - 250);
      ctx.lineTo(540, groundY - 120);
      ctx.lineTo(800, groundY - 120);
      ctx.stroke();

      // B. Ground/Tracks Cyberpunk Grid overlay
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

      // Neon ground edge trace
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#10b981';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();
      ctx.shadowBlur = 0; // stop styling global shadow instantly

      // Isometric neon grid perspective lines
      ctx.strokeStyle = '#10b98125';
      ctx.lineWidth = 1.5;
      const numGridLines = 15;
      for (let i = 0; i <= numGridLines; i++) {
        const lx = (canvas.width / numGridLines) * i;
        ctx.beginPath();
        ctx.moveTo(lx, groundY);
        // Warp outwards slightly on base edge
        ctx.lineTo(lx + (lx - canvas.width / 2) * 0.4, canvas.height);
        ctx.stroke();
      }

      // Horizontal pulsing traces
      const lineYOffset = (Date.now() / 33) % 25;
      for (let gy = groundY; gy < canvas.height; gy += 20) {
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.05 + ((gy - groundY) / 100) * 0.15})`;
        ctx.beginPath();
        ctx.moveTo(0, gy + (lineYOffset % 20));
        ctx.lineTo(canvas.width, gy + (lineYOffset % 20));
        ctx.stroke();
      }

      // C. Draw Coins item spheres
      s.coins.forEach(coin => {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fbbf24';
        
        // Spin scale effect inside
        const angle = (Date.now() / 150) % (Math.PI * 2);
        ctx.translate(coin.x, coin.y);
        ctx.rotate(angle);
        
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // D. Draw Power up blocks
      s.powerups.forEach(pu => {
        ctx.save();
        ctx.shadowBlur = 12;
        let pColor = '#ec4899'; // pink zip
        if (pu.type === 'shield') pColor = '#38bdf8'; // blue shield
        if (pu.type === 'multiplier') pColor = '#fbbf24'; // double gold

        ctx.shadowColor = pColor;
        ctx.fillStyle = '#0c0a09';
        ctx.strokeStyle = pColor;
        ctx.lineWidth = 2;

        // Oscillate height trace slightly
        const yOsc = Math.sin(Date.now() / 80) * 3;
        ctx.translate(pu.x, pu.y + yOsc);

        ctx.beginPath();
        ctx.rect(0, 0, pu.width, pu.height);
        ctx.fill();
        ctx.stroke();

        // Inner glyph
        ctx.fillStyle = pColor;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let innerText = '★';
        if (pu.type === 'shield') innerText = '🛡';
        if (pu.type === 'booster') innerText = '⚡';
        if (pu.type === 'multiplier') innerText = 'x2';
        ctx.fillText(innerText, pu.width / 2, pu.height / 2);

        ctx.restore();
      });

      // E. Draw Obstacles (with animated neon warns!)
      s.obstacles.forEach(obs => {
        ctx.save();
        if (obs.type === 'high') {
          // Slide bar neon arch
          ctx.strokeStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 3.5;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';

          ctx.beginPath();
          ctx.rect(obs.x, obs.y, obs.width, obs.height);
          ctx.fill();
          ctx.stroke();

          // Bar strip warnings
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('CRITICAL', obs.x + obs.width / 2, obs.y + 12);
        } else if (obs.type === 'laser') {
          // Floating high velocity laser beam
          ctx.fillStyle = '#f43f5e';
          ctx.strokeStyle = '#fda4af';
          ctx.lineWidth = 1;
          ctx.save();
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 15;

          ctx.beginPath();
          ctx.rect(obs.x, obs.y, obs.width, obs.height);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Spark particle trails
          if (Math.random() > 0.4) {
            s.particles.push({
              x: obs.x + obs.width,
              y: obs.y + obs.height / 2,
              vx: s.gameSpeed * 0.4,
              vy: (Math.random() - 0.5) * 2,
              color: '#f43f5e',
              life: 10,
              maxLife: 10,
              radius: 1,
            });
          }
        } else {
          // Low spikes / cyber barrier
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + obs.height);
          ctx.lineTo(obs.x + obs.width / 2, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });

      // F. Draw Runner (The player sprite)
      ctx.save();
      ctx.shadowColor = playerColor;
      ctx.shadowBlur = 15;
      ctx.fillStyle = playerColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      // Draw custom glowing block runner outline
      ctx.beginPath();
      ctx.roundRect(s.runner.x, s.runner.y, s.runner.width, s.runner.height, 6);
      ctx.fill();
      ctx.stroke();

      // Glowing visor hacker line
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      const visorY = s.runner.y + (s.runner.isSliding ? 6 : 12);
      ctx.moveTo(s.runner.x + 10, visorY);
      ctx.lineTo(s.runner.x + s.runner.width - 2, visorY);
      ctx.stroke();

      // Dynamic shield visual bubble if Shield active
      if (s.hasShield) {
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(s.runner.x + 16, s.runner.y + s.runner.height / 2, 34, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Speed booster trail effects
      if (s.hasBooster) {
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.runner.x - 12, s.runner.y + 12);
        ctx.lineTo(s.runner.x, s.runner.y + 12);
        ctx.moveTo(s.runner.x - 18, s.runner.y + 24);
        ctx.lineTo(s.runner.x, s.runner.y + 24);
        ctx.stroke();
      }

      ctx.restore();

      // G. Draw Active Particles
      s.particles.forEach(p => {
        ctx.fillStyle = p.color;
        const opacity = p.life / p.maxLife;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, isGameOver, playerColor]);

  // Handle crash particles
  const createExplosion = (x: number, y: number, color: string) => {
    const s = stateRef.current;
    for (let i = 0; i < 20; i++) {
      s.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color,
        life: 25,
        maxLife: 25,
        radius: Math.random() * 3.5 + 1,
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
    createExplosion(s.runner.x + 16, s.runner.y + 24, '#ef4444');
    createExplosion(s.runner.x + 16, s.runner.y + 24, playerColor);

    // Save Coins & Score progress
    addCoins(s.coinsCollected);
    updateHighScore('Love Runner', s.score);
  };

  const startNewRun = () => {
    audio.playClick();
    
    // reset local states
    const s = stateRef.current;
    s.isPlaying = true;
    s.isGameOver = false;
    s.score = 0;
    s.coinsCollected = 0;
    s.gameSpeed = 7;
    s.obstacles = [];
    s.coins = [];
    s.powerups = [];
    s.particles = [];
    s.runner.y = 100;
    s.runner.vy = 0;
    s.runner.isGrounded = false;
    s.runner.jumpCount = 0;
    s.runner.isSliding = false;
    s.hasShield = false;
    s.hasBooster = false;
    s.hasMultiplier = false;

    setScore(0);
    setCoinsCollected(0);
    setActivePowerUp(null);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-40 bg-zinc-950 flex flex-col font-sans select-none overflow-hidden safe-area-padding">
      
      {/* Game Head Panel */}
      <div className="bg-zinc-900 border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
            <span className="text-emerald-400 font-mono text-xs">LR</span>
          </div>
          <div>
            <h2 className="text-white text-xs font-bold font-mono tracking-widest uppercase sm:text-sm">
              LOVE RUNNER: endless
            </h2>
            <p className="text-[9px] text-zinc-500 font-mono tracking-tighter">GRID_AGENT://RUN_OR_CRASH_V1.0</p>
          </div>
        </div>

        {/* Live score overlay */}
        {isPlaying && (
          <div className="flex gap-4 font-mono text-xs text-right">
            <div>
              <span className="block text-[8px] text-zinc-500">DIST_M</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{score}m</span>
            </div>
            <div>
              <span className="block text-[8px] text-zinc-500">COINS</span>
              <span className="text-sm font-bold text-amber-400 font-mono">{coinsCollected}</span>
            </div>
          </div>
        )}

        <button
          id="close-runner-game"
          onClick={onClose}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-zinc-400 hover:text-white hover:border-emerald-500/50 transition font-mono text-xs flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Main Canvas Host Wrapper */}
      <div ref={containerRef} className="flex-1 relative bg-[#09090b] overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block w-full h-full cursor-pointer"
          onClick={() => {
            if (isPlaying && !isGameOver) {
              triggerJump();
            }
          }}
        />

        {/* Floating Active Power-up Toast notifier */}
        {activePowerUp && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-zinc-950/90 border border-emerald-500 px-3 py-1.5 rounded-lg shadow-lg font-mono text-xs text-emerald-400 blink">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>{activePowerUp}</span>
          </div>
        )}

        {/* Play Dialog overlays */}

        {/* 1. LOBBY SCREEN OVERLAY */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-6">
              <div className="relative inline-block">
                <div className="absolute -inset-2 bg-emerald-500/20 blur-xl animate-pulse rounded-full" />
                <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase font-mono relative">
                  LOVE <span className="text-emerald-400">RUNNER</span>
                </h1>
              </div>
              
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto font-mono">
                Dash down the neon-grid vectors. Avoid spiked energy barriers and laser arrays. Collect coins to buy custom-glowing skins!
              </p>

              {/* Controls guide */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl font-mono text-xs text-left max-w-xs mx-auto">
                <div className="space-y-1.5">
                  <span className="block text-[9px] text-zinc-500">JUMP / DOUBLE JUMP</span>
                  <span className="bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-white text-[11px] font-bold">SPACE / UP</span>
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[9px] text-zinc-500">SLIDE UNDER</span>
                  <span className="bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-white text-[11px] font-bold">DOWN / SHIFT</span>
                </div>
              </div>

              {highScore > 0 && (
                <div className="flex justify-center items-center gap-2 text-xs font-mono text-zinc-500">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>PERSONAL HIGHEST: <b>{highScore}m</b></span>
                </div>
              )}

              <button
                id="start-runner-btn"
                onClick={startNewRun}
                className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold py-3.5 px-6 rounded-lg font-mono text-sm tracking-widest uppercase hover:scale-105 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                <Play className="w-4 h-4 inline-block mr-2 text-zinc-950" />
                Initialize Run
              </button>
            </div>
          </div>
        )}

        {/* 2. GAME OVER OVERLAY */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="max-w-sm w-full space-y-6">
              <div className="text-red-500 font-mono text-4xl font-extrabold tracking-widest uppercase blink">
                RUN_TERMINATED
              </div>

              <div className="bg-zinc-900/50 border-2 border-red-500/20 p-5 rounded-2xl font-mono text-xs text-left space-y-3.5 bg-zinc-950">
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">DISTANCE GAINED:</span>
                  <span className="text-white font-bold">{score}m</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500">CURRENCY ACQUIRED:</span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>+{coinsCollected} Coins</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">RECORD HIGHLIGHT:</span>
                  <span className="text-emerald-400 font-bold">{Math.max(score, highScore)}m</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  id="restart-runner-btn"
                  onClick={startNewRun}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold py-3.5 px-4 rounded-lg font-mono text-xs tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  Run Again
                </button>
                <button
                  id="exit-runner-btn"
                  onClick={onClose}
                  className="flex-1 border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 font-extrabold py-3.5 px-4 rounded-lg font-mono text-xs tracking-widest uppercase transition-all cursor-pointer"
                >
                  Return to Hub
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Mobile Touch Visual Buttons */}
        {isPlaying && !isGameOver && (
          <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-4 md:hidden">
            <button
              id="mobile-slide-btn"
              onTouchStart={(e) => {
                e.preventDefault();
                triggerSlide();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                triggerSlide();
              }}
              className="flex-1 bg-zinc-950/80 border border-zinc-700/80 py-5 rounded-xl font-mono text-sm uppercase text-zinc-400 active:bg-zinc-900 active:text-white"
            >
              ↙ SLIDE
            </button>
            <button
              id="mobile-jump-btn"
              onTouchStart={(e) => {
                e.preventDefault();
                triggerJump();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                triggerJump();
              }}
              className="flex-1 bg-emerald-500/20 border-2 border-emerald-500 py-5 rounded-xl font-mono text-sm font-bold uppercase text-emerald-400 active:bg-emerald-500/40"
            >
              ▲ JUMP
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
