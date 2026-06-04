/**
 * Custom Cyberpunk Cosmetic Skin Customizer Shop
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, X, Coins, Sparkles, Check, Lock } from 'lucide-react';
import { useGameStore } from '../services/store';
import { Skin } from '../types';

interface ShopModalProps {
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ onClose }) => {
  const { profile, buySkin, equipSkin } = useGameStore();
  const [activeTab, setActiveTab] = useState<'arrow' | 'runner' | 'avatar'>('arrow');

  const filteredSkins = profile.skins.filter(s => s.type === activeTab);

  const handleAction = (skin: Skin) => {
    if (!skin.unlocked) {
      buySkin(skin.id);
    } else {
      equipSkin(skin.id);
    }
  };

  const getSkinIconSymbol = (skin: Skin) => {
    if (skin.type === 'avatar') {
      return skin.renderSymbol || '👾';
    } else if (skin.type === 'arrow') {
      return '▲';
    } else {
      return '■';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-emerald-500 bg-zinc-950 p-6 shadow-[0_0_30px_rgba(16,185,129,0.25)] flex flex-col max-h-[85vh]"
      >
        {/* Glow corner elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tl from-emerald-500/10 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/50">
              <ShoppingBag className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-widest text-white uppercase font-sans sm:text-lg">
                BLACK_MARKET_SHOP
              </h2>
              <p className="text-[10px] font-mono text-zinc-400 tracking-wider">UPGRADE RECTILINEAR SKINS</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Currency Tracker */}
            <div className="flex items-center gap-1.5 bg-amber-950/20 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-500 font-mono text-sm font-bold shadow-[0_0_10px_rgba(245,158,11,0.1)]">
              <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{profile.coins}</span>
              <span className="text-[9px] text-zinc-500 font-normal">S_COINS</span>
            </div>

            <button
              id="close-shop"
              onClick={onClose}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-1.5 text-zinc-400 hover:text-white hover:border-emerald-500/40 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grid Tabs */}
        <div className="flex gap-2 border-b border-zinc-900 pb-3 mb-5 font-mono text-xs">
          <button
            onClick={() => setActiveTab('arrow')}
            className={`flex-1 py-2 rounded-lg border text-center font-bold tracking-widest uppercase transition-all ${
              activeTab === 'arrow'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            Wave skins
          </button>
          <button
            onClick={() => setActiveTab('runner')}
            className={`flex-1 py-2 rounded-lg border text-center font-bold tracking-widest uppercase transition-all ${
              activeTab === 'runner'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            Runner skins
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex-1 py-2 rounded-lg border text-center font-bold tracking-widest uppercase transition-all ${
              activeTab === 'avatar'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            Avatars
          </button>
        </div>

        {/* Cosmetics Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 pr-1 custom-scrollbar">
          {filteredSkins.map(skin => (
            <div
              key={skin.id}
              className={`relative rounded-xl border-2 p-4 flex flex-col justify-between gap-4 transition-all bg-zinc-900/10 ${
                skin.equipped
                  ? 'border-emerald-500 bg-emerald-950/5'
                  : 'border-zinc-900 hover:border-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  {/* Visual Render Box */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-sans font-bold border-2 shrink-0 select-none bg-zinc-950"
                    style={{
                      borderColor: skin.glowColor,
                      textShadow: `0 0 10px ${skin.glowColor}`,
                      color: skin.glowColor,
                      boxShadow: `inset 0 0 10px ${skin.glowColor}22`
                    }}
                  >
                    <span className="text-xl">{getSkinIconSymbol(skin)}</span>
                  </div>

                  <div>
                    <h3 className="font-mono font-bold text-sm text-white tracking-widest uppercase">
                      {skin.name}
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      {skin.type === 'arrow' && 'geometry wave particle'}
                      {skin.type === 'runner' && 'endless physical athlete'}
                      {skin.type === 'avatar' && 'grid matrix avatar identification'}
                    </p>
                  </div>
                </div>

                {/* Equipped Tag */}
                {skin.equipped && (
                  <span className="px-1.5 py-0.5 text-[9px] bg-emerald-950 border border-emerald-500/40 text-emerald-400 rounded uppercase font-bold tracking-widest font-mono">
                    active
                  </span>
                )}
              </div>

              {/* Lower Section controls */}
              <div className="flex items-center justify-between mt-2 border-t border-zinc-900 pt-3">
                {/* Cost or Info status */}
                <div>
                  {!skin.unlocked ? (
                    <div className="flex items-center gap-1.5 text-amber-500 font-mono text-xs font-bold">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{skin.cost}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      unlocked
                    </span>
                  )}
                </div>

                {/* Purchase or Equip Button */}
                <button
                  id={`skin-action-${skin.id}`}
                  onClick={() => handleAction(skin)}
                  disabled={!skin.unlocked && profile.coins < skin.cost}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold uppercase transition ${
                    skin.equipped
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 cursor-not-allowed'
                      : skin.unlocked
                      ? 'bg-zinc-900 border-zinc-800 text-white hover:border-emerald-500/50 hover:text-emerald-400'
                      : profile.coins >= skin.cost
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 hover:bg-amber-400 cursor-pointer'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {skin.equipped ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Equipped
                    </>
                  ) : skin.unlocked ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Equip
                    </>
                  ) : profile.coins >= skin.cost ? (
                    <>
                      Buy Skin
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Locked
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="border-t border-zinc-800 pt-4 mt-4 flex justify-between text-[11px] text-zinc-500 font-mono">
          <span>SECURE PROTOCOL ENCRYPTED</span>
          <span>NURMD MERCHANT CORP.®</span>
        </div>
      </motion.div>
    </div>
  );
};
