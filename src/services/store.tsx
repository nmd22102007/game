/**
 * React Context State Management Store for NURMD GAME HUB.
 * Implements real-time synchronization, achievements triggers, coin mechanics,
 * and high-performance LocalStorage persistence.
 * Fully backed up with Firebase Auth and Firestore Cloud Sync.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlayerProfile, UserSettings, Skin, Achievement, LeaderboardEntry, PlayerStats } from '../types';
import { audio } from './audio';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';

interface GameStoreType {
  profile: PlayerProfile;
  settings: UserSettings;
  loadingScreen: boolean;
  setLoadingScreen: (show: boolean) => void;
  updateUsername: (name: string) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  updateHighScore: (game: 'Love Runner' | 'Chess (AI)' | 'Wave Dash', score: number) => void;
  recordChessMatch: (result: 'win' | 'loss' | 'draw', mode: 'ai' | 'player', aiLevel?: 'easy' | 'medium' | 'hard') => void;
  incrementPlayCount: (game: 'loveRunner' | 'chess' | 'waveDash') => void;
  buySkin: (skinId: string) => boolean;
  equipSkin: (skinId: string) => void;
  addLeaderboardEntry: (score: number, game: 'Love Runner' | 'Chess (AI)' | 'Wave Dash') => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  triggerAchievement: (achievementId: string) => void;
  resetAllData: () => void;
  activeToast: { title: string; reward: number } | null;
  resetToast: () => void;
  // Firebase Auth variables
  user: User | null;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.6,
  fullscreen: false,
  graphicsQuality: 'high',
  language: 'en',
  accessibility: {
    highContrast: false,
    screenShake: true,
    largerFonts: false
  }
};

const DEFAULT_SKINS: Skin[] = [
  // Arrows
  { id: 'neon_arrow', name: 'Obsidian Gold Arrow', type: 'arrow', cost: 0, unlocked: true, equipped: true, color: 'text-emerald-400 bg-emerald-400', glowColor: '#ffb800' },
  { id: 'cyber_chevron', name: 'Cyber Chevron', type: 'arrow', cost: 100, unlocked: false, equipped: false, color: 'text-indigo-400 bg-indigo-400', glowColor: '#6366f1' },
  { id: 'pulse_pointer', name: 'Pulse Pointer', type: 'arrow', cost: 250, unlocked: false, equipped: false, color: 'text-pink-500 bg-pink-500', glowColor: '#ec4899' },
  { id: 'phoenix_glider', name: 'Phoenix Glider', type: 'arrow', cost: 500, unlocked: false, equipped: false, color: 'text-amber-500 bg-amber-500', glowColor: '#f59e0b' },
  
  // Runners
  { id: 'cyber_runner', name: 'Lux Gold Runner', type: 'runner', cost: 0, unlocked: true, equipped: true, color: 'text-emerald-400 bg-emerald-400', glowColor: '#ffb800' },
  { id: 'shadow_ninja', name: 'Shadow Ninja', type: 'runner', cost: 150, unlocked: false, equipped: false, color: 'text-purple-400 bg-purple-400', glowColor: '#a855f7' },
  { id: 'plasma_mech', name: 'Plasma Mech', type: 'runner', cost: 300, unlocked: false, equipped: false, color: 'text-red-500 bg-red-500', glowColor: '#ef4444' },
  { id: 'aurora_glider', name: 'Aurora Glider', type: 'runner', cost: 600, unlocked: false, equipped: false, color: 'text-cyan-400 bg-cyan-400', glowColor: '#22d3ee' },
  
  // Avatars
  { id: 'cyber_avatar_1', name: 'Vanguard Crown', type: 'avatar', cost: 0, unlocked: true, equipped: true, color: 'text-emerald-400 border-emerald-400/50', glowColor: '#ffb800', renderSymbol: '♛' },
  { id: 'cyber_avatar_2', name: 'Synth Hacker', type: 'avatar', cost: 120, unlocked: false, equipped: false, color: 'text-fuchsia-400 border-fuchsia-400/50', glowColor: '#e879f9', renderSymbol: '👾' },
  { id: 'cyber_avatar_3', name: 'Retro Mech', type: 'avatar', cost: 200, unlocked: false, equipped: false, color: 'text-cyan-400 border-cyan-400/50', glowColor: '#06b6d4', renderSymbol: '🤖' },
  { id: 'cyber_avatar_4', name: 'Holo Queen', type: 'avatar', cost: 400, unlocked: false, equipped: false, color: 'text-pink-400 border-pink-400/50', glowColor: '#f43f5e', renderSymbol: '👑' }
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game', title: 'First Drop', description: 'Enter the grid and play any game.', unlocked: false, icon: 'Gamepad2', reward: 50 },
  { id: 'first_win', title: 'Grid Champion', description: 'Outplay the AI in Chess or score above 100 points in Wave / Runner.', unlocked: false, icon: 'Trophy', reward: 100 },
  { id: 'score_100', title: 'Centurion', description: 'Reach a score of 100 points in any endless game.', unlocked: false, icon: 'Gauge', reward: 150 },
  { id: 'score_1000', title: 'Cyber Legend', description: 'Reach a score of 1000 points in Love Runner or Wave Dash.', unlocked: false, icon: 'Flame', reward: 500 },
  { id: 'collect_100', title: 'Wealth Matrix', description: 'Accumulate a total of 100 shared coins.', unlocked: false, icon: 'Coins', reward: 120, progressMax: 100, progressCurrent: 0 },
  { id: 'unlock_skin', title: 'Cosmetic Upgrade', description: 'Purchase and equip any custom skin from the Shop.', unlocked: false, icon: 'Sparkles', reward: 100 },
  { id: 'chess_master', title: 'Grandmaster AI', description: 'Defeat the computer in a chess match on Hard difficulty.', unlocked: false, icon: 'Crown', reward: 300 }
];

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', username: 'Kaelen_X', score: 1250, game: 'Love Runner', date: '2026-06-01', avatarId: 'cyber_avatar_3' },
  { id: '2', username: 'Hax0r_Joe', score: 980, game: 'Wave Dash', date: '2026-06-02', avatarId: 'cyber_avatar_2' },
  { id: '3', username: 'Scythe_AI', score: 450, game: 'Love Runner', date: '2026-06-03', avatarId: 'cyber_avatar_4' },
  { id: '4', username: 'ChessBot_Hard', score: 1, game: 'Chess (AI)', date: '2026-06-04', avatarId: 'cyber_avatar_3' },
  { id: '5', username: 'Synth_Rider', score: 320, game: 'Wave Dash', date: '2026-06-04', avatarId: 'cyber_avatar_1' }
];

const DEFAULT_PROFILE: PlayerProfile = {
  username: 'Gamer_99',
  avatarId: 'cyber_avatar_1',
  coins: 50, // Starting bonus
  totalScore: 0,
  stats: {
    loveRunnerHighScore: 0,
    loveRunnerCoins: 0,
    loveRunnerPlays: 0,
    
    chessWinsVsAI: 0,
    chessLossesVsAI: 0,
    chessWinsVsPlayer: 0,
    chessLossesVsPlayer: 0,
    chessDraws: 0,
    chessPlays: 0,
    
    waveDashHighScore: 0,
    waveDashCoins: 0,
    waveDashPlays: 0,
    
    totalCoinsEarned: 50,
    totalGamesPlayed: 0
  },
  skins: DEFAULT_SKINS,
  achievements: DEFAULT_ACHIEVEMENTS,
  leaderboard: DEFAULT_LEADERBOARD
};

const GameStoreContext = createContext<GameStoreType | undefined>(undefined);

export const GameStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const data = localStorage.getItem('nurmd_profile');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (!parsed.skins || parsed.skins.length === 0) {
          parsed.skins = DEFAULT_SKINS;
        } else {
          parsed.skins = parsed.skins.map((s: Skin) => {
            if (s.glowColor === '#10b981') {
              let updatedName = s.name;
              let symbol = s.renderSymbol;
              if (s.id === 'neon_arrow') updatedName = 'Obsidian Gold Arrow';
              if (s.id === 'cyber_runner') updatedName = 'Lux Gold Runner';
              if (s.id === 'cyber_avatar_1') {
                updatedName = 'Vanguard Crown';
                symbol = '♛';
              }
              return { ...s, glowColor: '#ffb800', name: updatedName, renderSymbol: symbol };
            }
            return s;
          });
        }
        if (!parsed.achievements || parsed.achievements.length === 0) parsed.achievements = DEFAULT_ACHIEVEMENTS;
        if (!parsed.leaderboard) parsed.leaderboard = DEFAULT_LEADERBOARD;
        return parsed;
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const data = localStorage.getItem('nurmd_settings');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [loadingScreen, setLoadingScreenState] = useState(true);
  const [activeToast, setActiveToast] = useState<{ title: string; reward: number } | null>(null);

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (srvUser) => {
      setUser(srvUser);
      setIsAuthLoading(true);

      if (srvUser) {
        try {
          const docRef = doc(db, 'profiles', srvUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.username) {
              setProfile({
                username: data.username,
                avatarId: data.avatarId || 'cyber_avatar_1',
                coins: typeof data.coins === 'number' ? data.coins : 50,
                totalScore: typeof data.totalScore === 'number' ? data.totalScore : 0,
                stats: data.stats || DEFAULT_PROFILE.stats,
                skins: data.skins || DEFAULT_PROFILE.skins,
                achievements: data.achievements || DEFAULT_PROFILE.achievements,
                leaderboard: profile.leaderboard // keep state local as fallback
              });
            }
          } else {
            // Unify local accomplishments on first load
            await setDoc(docRef, {
              username: profile.username,
              avatarId: profile.avatarId,
              coins: profile.coins,
              totalScore: profile.totalScore,
              stats: profile.stats,
              skins: profile.skins,
              achievements: profile.achievements
            });
          }
        } catch (error) {
          console.error("Authenticated profile fetch failed: ", error);
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync to local storage and Debounce sync to cloud
  useEffect(() => {
    localStorage.setItem('nurmd_profile', JSON.stringify(profile));

    if (user) {
      const syncProfile = async () => {
        try {
          const profileRef = doc(db, 'profiles', user.uid);
          await setDoc(profileRef, {
            username: profile.username,
            avatarId: profile.avatarId,
            coins: profile.coins,
            totalScore: profile.totalScore,
            stats: profile.stats,
            skins: profile.skins,
            achievements: profile.achievements
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `profiles/${user.uid}`);
        }
      };

      const timer = setTimeout(syncProfile, 1500);
      return () => clearTimeout(timer);
    }
  }, [profile, user]);

  // Real-time Leaderboard Synchronizer via onSnapshot
  useEffect(() => {
    if (!user) return; // public secure reading requires any signed in credentials

    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef, orderBy('score', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => {
        const item = doc.data();
        if (item) {
          records.push({
            id: doc.id,
            username: item.username || 'Gamer_99',
            score: typeof item.score === 'number' ? item.score : 0,
            game: item.game || 'Love Runner',
            date: item.date || '',
            avatarId: item.avatarId || 'cyber_avatar_1'
          });
        }
      });
      if (records.length > 0) {
        setProfile(prev => ({
          ...prev,
          leaderboard: records
        }));
      }
    }, (error) => {
      console.warn("Leaderboard onSnapshot failed (or awaiting index creation): ", error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('nurmd_settings', JSON.stringify(settings));
    audio.setVolumes(settings.musicVolume, settings.sfxVolume);
  }, [settings]);

  // Google Login popup
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login popup failed: ", error);
    }
  };

  // Logout routine
  const logout = async () => {
    try {
      await signOut(auth);
      setProfile(DEFAULT_PROFILE); // Reset profile details back to default
    } catch (error) {
      console.error("Sign out command failed: ", error);
    }
  };

  const updateUsername = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length > 0) {
      setProfile(prev => ({
        ...prev,
        username: trimmed.substring(0, 16)
      }));
    }
  };

  const addCoins = (amount: number) => {
    setProfile(prev => {
      const newCoins = prev.coins + amount;
      const newEarned = prev.stats.totalCoinsEarned + amount;
      
      let updatedAchievements = [...prev.achievements];
      const wealthIdx = updatedAchievements.findIndex(a => a.id === 'collect_100');
      if (wealthIdx !== -1 && !updatedAchievements[wealthIdx].unlocked) {
        const progress = Math.min(100, newEarned);
        updatedAchievements[wealthIdx] = {
          ...updatedAchievements[wealthIdx],
          progressCurrent: progress,
        };
      }

      return {
        ...prev,
        coins: newCoins,
        stats: {
          ...prev.stats,
          totalCoinsEarned: newEarned
        },
        achievements: updatedAchievements
      };
    });

    setTimeout(() => {
      setProfile(prev => {
        const index = prev.achievements.findIndex(a => a.id === 'collect_100');
        if (index !== -1 && !prev.achievements[index].unlocked && prev.stats.totalCoinsEarned >= 100) {
          audio.playUnlock();
          const achievementsCopy = [...prev.achievements];
          achievementsCopy[index] = {
            ...achievementsCopy[index],
            unlocked: true,
            unlockedAt: new Date().toISOString().split('T')[0]
          };
          setActiveToast({ title: achievementsCopy[index].title, reward: achievementsCopy[index].reward });
          return {
            ...prev,
            coins: prev.coins + achievementsCopy[index].reward,
            achievements: achievementsCopy
          };
        }
        return prev;
      });
    }, 100);
  };

  const spendCoins = (amount: number): boolean => {
    let success = false;
    setProfile(prev => {
      if (prev.coins >= amount) {
        success = true;
        return {
          ...prev,
          coins: prev.coins - amount
        };
      }
      return prev;
    });
    return success;
  };

  const triggerAchievement = (id: string) => {
    setProfile(prev => {
      const index = prev.achievements.findIndex(a => a.id === id);
      if (index !== -1 && !prev.achievements[index].unlocked) {
        audio.playUnlock();
        const achievementsCopy = [...prev.achievements];
        achievementsCopy[index] = {
          ...achievementsCopy[index],
          unlocked: true,
          unlockedAt: new Date().toISOString().split('T')[0]
        };
        setActiveToast({ title: achievementsCopy[index].title, reward: achievementsCopy[index].reward });
        return {
          ...prev,
          coins: prev.coins + achievementsCopy[index].reward,
          achievements: achievementsCopy
        };
      }
      return prev;
    });
  };

  const updateHighScore = (game: 'Love Runner' | 'Chess (AI)' | 'Wave Dash', score: number) => {
    setProfile(prev => {
      const updatedStats = { ...prev.stats };

      if (game === 'Love Runner') {
        if (score > prev.stats.loveRunnerHighScore) updatedStats.loveRunnerHighScore = score;
      } else if (game === 'Wave Dash') {
        if (score > prev.stats.waveDashHighScore) updatedStats.waveDashHighScore = score;
      }

      const totalScoreSum = updatedStats.loveRunnerHighScore + updatedStats.waveDashHighScore + (updatedStats.chessWinsVsAI * 100);

      return {
        ...prev,
        totalScore: totalScoreSum,
        stats: updatedStats
      };
    });

    if (score >= 100) {
      triggerAchievement('score_100');
      triggerAchievement('first_win');
    }
    if (score >= 1000) {
      triggerAchievement('score_1000');
    }

    addLeaderboardEntry(score, game);
  };

  const recordChessMatch = (result: 'win' | 'loss' | 'draw', mode: 'ai' | 'player', aiLevel?: 'easy' | 'medium' | 'hard') => {
    setProfile(prev => {
      const updatedStats = { ...prev.stats };
      
      if (mode === 'ai') {
        if (result === 'win') {
          updatedStats.chessWinsVsAI += 1;
        } else if (result === 'loss') {
          updatedStats.chessLossesVsAI += 1;
        } else {
          updatedStats.chessDraws += 1;
        }
      } else {
        if (result === 'win') {
          updatedStats.chessWinsVsPlayer += 1;
        } else if (result === 'loss') {
          updatedStats.chessLossesVsPlayer += 1;
        } else {
          updatedStats.chessDraws += 1;
        }
      }

      const totalScoreSum = updatedStats.loveRunnerHighScore + updatedStats.waveDashHighScore + (updatedStats.chessWinsVsAI * 100);

      return {
        ...prev,
        totalScore: totalScoreSum,
        stats: updatedStats
      };
    });

    if (result === 'win') {
      triggerAchievement('first_win');
      if (mode === 'ai' && aiLevel === 'hard') {
        triggerAchievement('chess_master');
      }
      addLeaderboardEntry(250, 'Chess (AI)');
    }
  };

  const incrementPlayCount = (game: 'loveRunner' | 'chess' | 'waveDash') => {
    setProfile(prev => {
      const updatedStats = { ...prev.stats };
      if (game === 'loveRunner') updatedStats.loveRunnerPlays += 1;
      if (game === 'chess') updatedStats.chessPlays += 1;
      if (game === 'waveDash') updatedStats.waveDashPlays += 1;

      updatedStats.totalGamesPlayed += 1;

      return {
        ...prev,
        stats: updatedStats
      };
    });

    triggerAchievement('first_game');
  };

  const buySkin = (skinId: string): boolean => {
    let success = false;
    setProfile(prev => {
      const skinIdx = prev.skins.findIndex(s => s.id === skinId);
      if (skinIdx !== -1) {
        const s = prev.skins[skinIdx];
        if (!s.unlocked && prev.coins >= s.cost) {
          success = true;
          const updatedSkins = [...prev.skins];
          updatedSkins[skinIdx] = { ...s, unlocked: true };
          return {
            ...prev,
            coins: prev.coins - s.cost,
            skins: updatedSkins
          };
        }
      }
      return prev;
    });

    if (success) {
      triggerAchievement('unlock_skin');
      audio.playUnlock();
    }
    return success;
  };

  const equipSkin = (skinId: string) => {
    setProfile(prev => {
      const targetSkin = prev.skins.find(s => s.id === skinId);
      if (!targetSkin || !targetSkin.unlocked) return prev;

      const updatedSkins = prev.skins.map(s => {
        if (s.type === targetSkin.type) {
          return { ...s, equipped: s.id === skinId };
        }
        return s;
      });

      const updatedAvatarId = targetSkin.type === 'avatar' ? skinId : prev.avatarId;

      return {
        ...prev,
        avatarId: updatedAvatarId,
        skins: updatedSkins
      };
    });
  };

  const addLeaderboardEntry = async (score: number, game: 'Love Runner' | 'Chess (AI)' | 'Wave Dash') => {
    if (score <= 0) return;
    
    // Always persist to local state copy as baseline
    setProfile(prev => {
      const newEntry: LeaderboardEntry = {
        id: 'local_' + Math.random().toString(),
        username: prev.username,
        score,
        game,
        date: new Date().toISOString().split('T')[0],
        avatarId: prev.avatarId
      };

      const nextLeaderboard = [newEntry, ...prev.leaderboard]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      return {
        ...prev,
        leaderboard: nextLeaderboard
      };
    });

    // Write to Firestore if connected and logged in
    if (auth.currentUser) {
      try {
        const idPath = 'entry_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        await setDoc(doc(db, 'leaderboard', idPath), {
          username: profile.username,
          score,
          game,
          date: new Date().toISOString().split('T')[0],
          avatarId: profile.avatarId,
          userId: auth.currentUser.uid
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'leaderboard');
      }
    }
  };

  const updateSettings = (partialSettings: Partial<UserSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...partialSettings,
      accessibility: {
        ...prev.accessibility,
        ...(partialSettings.accessibility || {})
      }
    }));
  };

  const resetAllData = () => {
    localStorage.removeItem('nurmd_profile');
    localStorage.removeItem('nurmd_settings');
    setProfile(DEFAULT_PROFILE);
    setSettings(DEFAULT_SETTINGS);
    if (auth.currentUser) {
      logout();
    }
  };

  const resetToast = () => setActiveToast(null);

  const setLoadingScreen = (show: boolean) => {
    setLoadingScreenState(show);
  };

  return (
    <GameStoreContext.Provider value={{
      profile,
      settings,
      loadingScreen,
      setLoadingScreen,
      updateUsername,
      addCoins,
      spendCoins,
      updateHighScore,
      recordChessMatch,
      incrementPlayCount,
      buySkin,
      equipSkin,
      addLeaderboardEntry,
      updateSettings,
      triggerAchievement,
      resetAllData,
      activeToast,
      resetToast,
      user,
      isAuthLoading,
      loginWithGoogle,
      logout
    }}>
      {children}
    </GameStoreContext.Provider>
  );
};

export const useGameStore = () => {
  const context = useContext(GameStoreContext);
  if (!context) {
    throw new Error('useGameStore must be used within a GameStoreProvider');
  }
  return context;
};
