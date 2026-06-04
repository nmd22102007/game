/**
 * Custom Settings Preferences Modal
 */

import React from 'react';
import { motion } from 'motion/react';
import { Settings, X, Volume2, Music, ToggleLeft, ToggleRight, Trash2, ShieldAlert } from 'lucide-react';
import { useGameStore } from '../services/store';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, resetAllData } = useGameStore();

  const toggleScreenShake = () => {
    updateSettings({
      accessibility: {
        ...settings.accessibility,
        screenShake: !settings.accessibility.screenShake
      }
    });
  };

  const toggleHighContrast = () => {
    updateSettings({
      accessibility: {
        ...settings.accessibility,
        highContrast: !settings.accessibility.highContrast
      }
    });
  };

  const toggleLargerFonts = () => {
    updateSettings({
      accessibility: {
        ...settings.accessibility,
        largerFonts: !settings.accessibility.largerFonts
      }
    });
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to purge all game stats, achievements, equipped skins and currency? This is permanent!")) {
      resetAllData();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border-2 border-zinc-800 bg-zinc-950 p-6 shadow-[0_0_25px_rgba(255,255,255,0.05)] flex flex-col max-h-[85vh]"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-zinc-700/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-800 p-2 rounded-lg border border-zinc-700">
              <Settings className="w-6 h-6 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-widest text-white uppercase font-sans sm:text-lg">
                SYSTEM_SETTINGS
              </h2>
              <p className="text-[10px] font-mono text-zinc-400 tracking-wider">CALIBRATE PREFERENCES</p>
            </div>
          </div>
          <button
            id="close-settings"
            onClick={onClose}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-1.5 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form preferences */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar scroll-smooth">
          
          {/* Audio Adjustments */}
          <div className="space-y-4">
            <h3 className="font-mono text-xs font-bold text-emerald-400 tracking-widest uppercase">
              // AUDIO_CONTROLS
            </h3>

            {/* BGM Volume */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Music className="w-4 h-4 text-emerald-400" />
                  Background Music
                </span>
                <span className="text-emerald-400 font-bold">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                id="music-volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => updateSettings({ musicVolume: parseFloat(e.target.value) })}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* SFX Volume */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-medium">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  Game Sound Effects
                </span>
                <span className="text-emerald-400 font-bold">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                id="sfx-volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => updateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>

          {/* Video & Localization */}
          <div className="space-y-4 border-t border-zinc-900 pt-5">
            <h3 className="font-mono text-xs font-bold text-emerald-400 tracking-widest uppercase">
              // INTERFACE_COMPILATION
            </h3>

            {/* Graphics configuration */}
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-300">Target Graphics Quality</span>
              <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-900">
                {(['low', 'medium', 'high'] as const).map(quality => (
                  <button
                    key={quality}
                    onClick={() => updateSettings({ graphicsQuality: quality })}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition ${
                      settings.graphicsQuality === quality
                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                        : 'text-zinc-550 hover:text-white'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selection */}
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-300">System Code Region (Lang)</span>
              <select
                id="lang-select"
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value as any })}
                className="bg-zinc-950 text-white border border-zinc-900 rounded-lg p-1 px-2.5 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
              >
                <option value="en">US-EN (English)</option>
                <option value="es">ES-ES (Spanish)</option>
                <option value="jp">JA-JP (Japanese)</option>
                <option value="de">DE-DE (German)</option>
              </select>
            </div>
          </div>

          {/* Accessibility Option Toggles */}
          <div className="space-y-4 border-t border-zinc-900 pt-5">
            <h3 className="font-mono text-xs font-bold text-emerald-400 tracking-widest uppercase">
              // ACCESSIBILITY_GUIDES
            </h3>

            {/* Screen Shake Toggle */}
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-200">Active Game Screen Shake</span>
              <button onClick={toggleScreenShake} className="text-zinc-400 hover:text-white transition">
                {settings.accessibility.screenShake ? (
                  <ToggleRight className="w-8 h-8 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-zinc-650" />
                )}
              </button>
            </div>

            {/* High Contrast Toggle */}
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-200 font-medium">Increased Grid Contrast</span>
              <button onClick={toggleHighContrast} className="text-zinc-400 hover:text-white transition">
                {settings.accessibility.highContrast ? (
                  <ToggleRight className="w-8 h-8 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-zinc-650" />
                )}
              </button>
            </div>

            {/* Larger fonts toggle */}
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-200">Enlarged HUD Typography</span>
              <button onClick={toggleLargerFonts} className="text-zinc-400 hover:text-white transition">
                {settings.accessibility.largerFonts ? (
                  <ToggleRight className="w-8 h-8 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-zinc-650" />
                )}
              </button>
            </div>
          </div>

          {/* Danger zone diagnostics */}
          <div className="space-y-3 border-t border-red-500/10 pt-5 bg-red-950/5 p-4 rounded-xl border border-red-950/20">
            <h3 className="font-mono text-xs font-bold text-red-400 tracking-widest uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              CRITICAL_DANGER_ALERTS
            </h3>
            <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
              Triggers a complete wipeout. This clears memory stacks, resets your high scores, exhausts unlocked cosmetics, and zeroes your core currency ledger.
            </p>
            <button
              id="reset-grid-btn"
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 border border-red-500/40 hover:border-red-500 bg-red-950/15 text-red-400 text-xs font-mono font-bold uppercase rounded-lg hover:bg-red-950/30 transition w-full justify-center"
            >
              <Trash2 className="w-4 h-4" />
              PURGE_STATE_LEDGER
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-zinc-800 pt-4 mt-4 text-[11px] text-zinc-500 font-mono text-center">
          SYSTEM PREFERENCE MATRIX TERMINATED SECURELY
        </div>
      </motion.div>
    </div>
  );
};
