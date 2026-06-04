/**
 * NURMD GAME HUB - Core Data Model & Types
 */

export interface UserSettings {
  musicVolume: number; // 0 to 1
  sfxVolume: number;   // 0 to 1
  fullscreen: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
  language: 'en' | 'es' | 'jp' | 'de';
  accessibility: {
    highContrast: boolean;
    screenShake: boolean;
    largerFonts: boolean;
  };
}

export type SkinType = 'arrow' | 'runner' | 'avatar';

export interface Skin {
  id: string;
  name: string;
  type: SkinType;
  cost: number;
  unlocked: boolean;
  equipped: boolean;
  color: string; // TailWind color or hex
  glowColor: string; // Glow color value for Canvas / CSS shadows
  renderSymbol?: string; // Optional character or icon symbol to draw
}

export interface PlayerStats {
  loveRunnerHighScore: number;
  loveRunnerCoins: number;
  loveRunnerPlays: number;
  
  chessWinsVsAI: number;
  chessLossesVsAI: number;
  chessWinsVsPlayer: number;
  chessLossesVsPlayer: number;
  chessDraws: number;
  chessPlays: number;
  
  waveDashHighScore: number;
  waveDashCoins: number;
  waveDashPlays: number;

  totalCoinsEarned: number;
  totalGamesPlayed: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string; // Lucide icon name
  reward: number; // Coin reward
  progressMax?: number; // Optional progress tracking
  progressCurrent?: number;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  game: 'Love Runner' | 'Chess (AI)' | 'Wave Dash';
  date: string;
  avatarId: string;
}

export interface PlayerProfile {
  username: string;
  avatarId: string; // Matches Equipped avatar skin id
  coins: number;
  totalScore: number;
  stats: PlayerStats;
  skins: Skin[];
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
}
