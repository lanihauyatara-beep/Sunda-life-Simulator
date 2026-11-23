import React from 'react';
import { BedDouble, Utensils, Sofa, DoorOpen, BookOpen, MoonStar } from 'lucide-react';
import { ASSETS, formatGameDate, formatGameTime, formatRupiah, getArgaOutfitState } from '../data/gameData';
import { GameState, SceneId } from '../types/game';
import { useUiGamepadAction } from '../hooks/useGamepad';
import { CharacterSprite } from './CharacterAvatar';

interface HomeInteriorViewProps {
  gameState: GameState;
  onChangeRoom: (room: SceneId) => void;
  onSleep: (mode?: 'auto' | 'nap' | 'next_day') => void;
  onCookMeal: (mealType: 'kopi' | 'liwet') => void;
  onPrayAtHome: () => void;
  onOpenDebtBook: () => void;
  onExitHouse: () => void;
}

export const HomeInteriorView: React.FC<HomeInteriorViewProps> = ({
  gameState,
  onChangeRoom,
  onSleep,
  onCookMeal,
  onPrayAtHome,
  onOpenDebtBook,
  onExitHouse,
}) => {
  const hour = gameState.minutesOfDay / 60;
  const isSleepTime = hour >= 18 || hour < 4.5;
  const nextWakeDay = hour >= 4.5 ? gameState.day + 1 : gameState.day;
  const currentRoom = gameState.scene;
  const outfitInfo = getArgaOutfitState(gameState);

  const rooms: SceneId[] = ['rumah_ruang_tamu', 'rumah_dapur', 'rumah_kamar'];
  useUiGamepadAction((btn) => {
    if (btn === 'LB' || btn === 'DPAD_LEFT') {
      const idx = rooms.indexOf(currentRoom);
      const nextRoom = rooms[(idx + rooms.length - 1) % rooms.length];
      onChangeRoom(nextRoom);
    } else if (btn === 'RB' || btn === 'DPAD_RIGHT') {
      const idx = rooms.indexOf(currentRoom);
      const nextRoom = rooms[(idx + 1) % rooms.length];
      onChangeRoom(nextRoom);
    } else if (btn === 'A') {
      if (currentRoom === 'rumah_kamar') {
        onSleep();
      } else if (currentRoom === 'rumah_dapur') {
        onCookMeal('liwet');
      } else {
        onChangeRoom('rumah_kamar');
      }
    } else if (btn === 'Y' && currentRoom === 'rumah_kamar') {
      onPrayAtHome();
    }
  });

  const bgPosition =
    currentRoom === 'rumah_kamar'
      ? '12% 55%'
      : currentRoom === 'rumah_dapur'
      ? '88% 55%'
      : '50% 45%';

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col justify-between">
      {/* Cutaway Interior Image focused per room */}
      <img
        src={ASSETS.rumah_interior}
        alt="Bagian Dalam Rumah Arga"
        referrerPolicy="no-referrer"
        style={{ objectPosition: bgPosition }}
        className="absolute inset-0 w-full h-full object-cover scale-110 transition-all duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-slate-950/60" />

      {/* Center Room Panel */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start sm:justify-center px-3 sm:px-4 pt-14 sm:pt-20 pb-3 sm:pb-6 overflow-y-auto">
        {/* Room Navigation Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5 bg-slate-950/85 p-1.5 rounded-xl border border-amber-400/50">
          <button
            onClick={() => onChangeRoom('rumah_ruang_tamu')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
              currentRoom === 'rumah_ruang_tamu'
                ? 'bg-amber-400 text-slate-950'
                : 'text-amber-100 hover:bg-slate-800'
            }`}
          >
            <Sofa className="w-4 h-4" />
            <span>Ruang Tamu</span>
          </button>

          <button
            onClick={() => onChangeRoom('rumah_dapur')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
              currentRoom === 'rumah_dapur'
                ? 'bg-amber-400 text-slate-950'
                : 'text-amber-100 hover:bg-slate-800'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Dapur</span>
          </button>

          <button
            onClick={() => onChangeRoom('rumah_kamar')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
              currentRoom === 'rumah_kamar'
                ? 'bg-amber-400 text-slate-950'
                : 'text-amber-100 hover:bg-slate-800'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            <span>Kamar Istirahat</span>
          </button>
        </div>

        {/* Arga Character Standing in Room */}
        <div className="mb-4 flex flex-col items-center gap-1.5">
          <CharacterSprite
            name="Arga"
            shirtColor="#dc2626"
            accentColor="#f8fafc"
            outfitMode={outfitInfo.mode}
            isArga
            isInjured={gameState.isInjured}
          />
          {outfitInfo.mode !== 'default' && (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-amber-400/60 text-[10px] font-bold text-amber-200 shadow">
              {outfitInfo.mode === 'sarung' ? '🕌 ' : '🧥 '}
              {outfitInfo.label}
            </span>
          )}
        </div>

        {/* Room Interactive Card */}
        <div className="w-full max-w-2xl bg-slate-950/90 border-2 border-amber-400/70 rounded-2xl p-5 shadow-2xl">
          {currentRoom === 'rumah_ruang_tamu' && (
            <div>
              <h2 className="font-display text-xl font-bold text-amber-200 mb-1">Ruang Tamu Rumah Arga</h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Ruang tamu sederhana berdinding anyaman bilik bambu yang sejuk. Di dinding tergantung foto keluarga dan
                catatan keuangan Warung Arga.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-slate-400">Saldo Tunai</div>
                  <div className="font-mono-num text-base font-bold text-emerald-300 mt-0.5">
                    {formatRupiah(gameState.money)}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-slate-400">Catatan Hutang</div>
                  <div className="font-mono-num text-base font-bold text-rose-300 mt-0.5">
                    {formatRupiah(gameState.debt)}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-slate-400">Kepuasan Warga</div>
                  <div className="font-mono-num text-base font-bold text-amber-300 mt-0.5">
                    {gameState.wargaSatisfaction}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentRoom === 'rumah_dapur' && (
            <div>
              <h2 className="font-display text-xl font-bold text-amber-200 mb-1">Dapur Tradisional Sunda</h2>
              <p className="text-xs text-slate-300 mb-4">
                Masak hidangan hangat sendiri di rumah untuk memulihkan energi Arga lebih hemat!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => onCookMeal('kopi')}
                  className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/50 text-left transition-colors"
                >
                  <div className="font-bold text-amber-200 text-sm">Seduh Kopi & Ubi Rebus</div>
                  <div className="text-xs text-slate-400 mt-1">Biaya bahan Rp 2.500 · +20% Energi</div>
                </button>
                <button
                  onClick={() => onCookMeal('liwet')}
                  className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/50 text-left transition-colors"
                >
                  <div className="font-bold text-amber-200 text-sm">Masak Nasi Liwet & Ikan Asin</div>
                  <div className="text-xs text-slate-400 mt-1">Biaya bahan Rp 7.500 · +50% Energi</div>
                </button>
              </div>
            </div>
          )}

          {currentRoom === 'rumah_kamar' && (
            <div>
              <h2 className="font-display text-xl font-bold text-amber-200 mb-1">Kamar Istirahat &amp; Sajadah</h2>
              <p className="text-xs text-slate-300 mb-4">
                Sekarang <strong>{formatGameDate(gameState.day)}</strong> pukul{' '}
                <strong>{formatGameTime(gameState.minutesOfDay)} WIB</strong>. Tidur malam mulai{' '}
                <strong>18.00 – 04.30 WIB</strong> (bangun jam 04.30 dengan Energi 100%).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {isSleepTime || gameState.isInjured ? (
                  <button
                    onClick={() => onSleep('next_day')}
                    className="p-3.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 border transition-colors bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200"
                  >
                    <BedDouble className="w-5 h-5" />
                    <span>Tidur Malam (→ {formatGameDate(nextWakeDay)} · 04.30)</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onSleep('nap')}
                      className="p-3.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 border transition-colors bg-slate-900 hover:bg-slate-800 text-amber-100 border-amber-400/40"
                    >
                      <BedDouble className="w-5 h-5" />
                      <span>Istirahat Sebentar (+1.5 Jam · +30% Energi)</span>
                    </button>
                    <button
                      onClick={() => onSleep('next_day')}
                      className="p-3.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 border transition-colors bg-amber-400/90 hover:bg-amber-300 text-slate-950 border-amber-200"
                    >
                      <MoonStar className="w-5 h-5" />
                      <span>Tidur Sampai Besok (→ {formatGameDate(nextWakeDay)} · 04.30)</span>
                    </button>
                  </>
                )}

                <button
                  onClick={onPrayAtHome}
                  className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-emerald-300 transition-colors"
                >
                  <MoonStar className="w-5 h-5" />
                  <span>Sholat di Sajadah</span>
                </button>

                <button
                  onClick={onOpenDebtBook}
                  className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-100 font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>Lihat Catatan Hutang</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-20 bg-slate-950/90 border-t border-amber-400/40 px-4 py-2.5 flex justify-center">
        <button
          onClick={onExitHouse}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg hover:brightness-105"
        >
          <DoorOpen className="w-4 h-4" />
          <span>Keluar Rumah [B]</span>
        </button>
      </div>
    </div>
  );
};
