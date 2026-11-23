import React, { useState } from 'react';
import { Coffee, DoorOpen, Sparkles, Utensils } from 'lucide-react';
import { ASSETS, ITEMS, formatGameTime, formatRupiah } from '../data/gameData';
import { GameState } from '../types/game';
import { useUiGamepadAction } from '../hooks/useGamepad';
import { PortraitBadge } from './CharacterAvatar';

interface WarungAsihViewProps {
  gameState: GameState;
  onConsumeMenu: (itemId: string) => void;
  onExitWarungAsih: () => void;
}

export const WarungAsihView: React.FC<WarungAsihViewProps> = ({
  gameState,
  onConsumeMenu,
  onExitWarungAsih,
}) => {
  const menuItems = ITEMS.filter((i) => i.category === 'ngopi');
  const [focusedIdx, setFocusedIdx] = useState(0);

  useUiGamepadAction((btn) => {
    if (menuItems.length === 0) return;
    if (btn === 'DPAD_RIGHT' || btn === 'DPAD_DOWN') {
      setFocusedIdx((i) => (i + 1) % menuItems.length);
    } else if (btn === 'DPAD_LEFT' || btn === 'DPAD_UP') {
      setFocusedIdx((i) => (i + menuItems.length - 1) % menuItems.length);
    } else if (btn === 'A') {
      const target = menuItems[focusedIdx];
      if (target && gameState.money >= target.retailPrice && gameState.energy < 100) {
        onConsumeMenu(target.id);
      }
    }
  });

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col justify-between">
      {/* Authentic Sundanese Saung Ngopi & Makan Backdrop */}
      <img
        src={ASSETS.warung_asih}
        alt="Warung Asih — Tempat Ngopi & Makan Sunda"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/35 to-slate-950/65" />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start sm:justify-center px-3 sm:px-4 pt-14 sm:pt-20 pb-3 sm:pb-6 overflow-y-auto">
        <div className="w-full max-w-4xl bg-slate-950/90 border-2 border-amber-400/75 rounded-2xl p-3.5 sm:p-5 shadow-2xl space-y-3 sm:space-y-4">
          {/* Teh Asih Welcome Header with Sundanese & Indonesian Translation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <PortraitBadge
                name="Teh Asih"
                shirtColor="#0f766e"
                accentColor="#fde68a"
                hatType="kerudung"
                size="md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-amber-200 flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-amber-400" />
                    Warung Asih · Tempat Ngopi &amp; Makan
                  </h2>
                </div>
                <p className="text-xs italic text-amber-100 mt-1">
                  "Mangga linggih Arga! Kopi hideung, surabi haneut, sareng sangu tutug oncomna tos sayogi."
                </p>
                <p className="text-[11px] text-emerald-300 mt-0.5">
                  Terjemahan: "Silakan duduk Arga! Kopi hitam, surabi hangat, dan nasi tutug oncomnya sudah tersedia."
                </p>
              </div>
            </div>

            <div className="shrink-0 bg-slate-900 border border-emerald-400/50 rounded-xl px-4 py-2 text-right">
              <div className="text-[11px] text-slate-400">Energi Arga Sekarang</div>
              <div className="font-mono-num text-lg font-extrabold text-emerald-300">
                {Math.round(gameState.energy)}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono-num">
                {formatGameTime(gameState.minutesOfDay)} WIB
              </div>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {menuItems.map((menu, idx) => {
              const disabled = gameState.money < menu.retailPrice || gameState.energy >= 100;
              const isFocused = focusedIdx === idx;
              return (
                <div
                  key={menu.id}
                  onMouseEnter={() => setFocusedIdx(idx)}
                  className={`bg-slate-900/95 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                    isFocused ? 'border-amber-300 ring-2 ring-amber-400/40' : 'border-amber-400/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-2xl sm:text-3xl">{menu.emojiIcon}</span>
                      <span className="text-[11px] font-mono-num font-bold text-emerald-300">
                        +{menu.energyRestore}% Energi
                      </span>
                    </div>
                    <div className="font-bold text-amber-100 text-xs sm:text-sm leading-snug">{menu.name}</div>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      <span className="text-[11px] text-amber-300/80 font-medium">{menu.sundaName}</span>
                      {menu.seasonTag === gameState.season && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/50 text-amber-200 text-[9px] font-bold">
                          {menu.seasonTag === 'hujan' ? '☔ Cocok Hujan' : '☀️ Segar Terik'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{menu.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono-num mb-2">
                      <span className="text-slate-400">Harga</span>
                      <span className="text-amber-300 font-bold">{formatRupiah(menu.retailPrice)}</span>
                    </div>
                    <button
                      disabled={disabled}
                      onClick={() => onConsumeMenu(menu.id)}
                      className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>
                        {gameState.energy >= 100
                          ? 'Energi Penuh'
                          : gameState.money < menu.retailPrice
                          ? 'Uang Kurang'
                          : isFocused
                          ? 'Pesan & Makan [A]'
                          : 'Pesan & Makan'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Makan &amp; ngopi di Warung Asih menambah energi Arga serta poin keaktifan (+4 poin).
            </span>
            <span className="font-mono-num text-emerald-300 font-bold">
              Saldo: {formatRupiah(gameState.money)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Dock */}
      <div className="relative z-20 bg-slate-950/90 border-t border-amber-400/40 px-4 py-2.5 flex justify-center">
        <button
          onClick={onExitWarungAsih}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg hover:brightness-105"
        >
          <DoorOpen className="w-4 h-4" />
          <span>Keluar dari Warung Asih [B]</span>
        </button>
      </div>
    </div>
  );
};
