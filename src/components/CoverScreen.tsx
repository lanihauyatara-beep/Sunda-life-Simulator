import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Gamepad2, Sparkles } from 'lucide-react';
import { ASSETS, formatRupiah } from '../data/gameData';
import { SaveSlotSummary } from '../types/game';
import { PWAInstallButton } from './PWAAndOrientationUI';

interface CoverScreenProps {
  latestSlot: SaveSlotSummary | null;
  focusedIndex: number;
  gamepadConnected: boolean;
  onContinueOrStart: () => void;
  onOpenLoadSave: () => void;
  onOpenSettings: () => void;
  onOpenChangelog: () => void;
}

export const CoverScreen: React.FC<CoverScreenProps> = ({
  latestSlot,
  focusedIndex,
  gamepadConnected,
  onContinueOrStart,
  onOpenLoadSave,
  onOpenSettings,
  onOpenChangelog,
}) => {
  const [guideOpen, setGuideOpen] = useState(true);

  return (
    <div className="relative w-screen h-[100dvh] overflow-y-auto overflow-x-hidden bg-slate-950 select-none">
      {/* Cover Artwork Matching Reference Layout with Pak GuruAI Mascot & Sunda Village */}
      <img
        src={ASSETS.cover}
        alt="Sunda Life Simulator bersama Arga dan Pak GuruAI"
        referrerPolicy="no-referrer"
        className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Subtle left & bottom contrast gradient for clean UI readability */}
      <div className="fixed inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/20 to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/25 pointer-events-none" />

      {/* LEFT COLUMN: Carved 3D Logo & Stacked Reference Menu Buttons */}
      <div className="relative z-10 min-h-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-3 sm:py-6 [@media(max-height:520px)]:py-2 flex flex-col justify-between gap-2">
        <div className="flex flex-row items-center justify-between flex-1 gap-4 sm:gap-8">
          <div className="w-[54%] max-w-[360px] sm:max-w-[410px] [@media(max-height:520px)]:max-w-[300px] flex flex-col items-stretch">
            {/* Aesthetic 3D Cartoon Wood + Gold Game Logo SVG (matching reference emblem) */}
            <div className="mb-2 sm:mb-3 [@media(max-height:520px)]:mb-1.5 flex flex-col items-start">
              <svg
                viewBox="0 0 460 278"
                className="w-[210px] sm:w-[290px] lg:w-[345px] [@media(max-height:520px)]:w-[165px] h-auto drop-shadow-[0_14px_24px_rgba(0,0,0,0.65)] overflow-visible"
                role="img"
                aria-label="Sunda Life Simulator"
              >
                <defs>
                  <linearGradient id="sundaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fffef7" />
                    <stop offset="48%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#fb923c" />
                  </linearGradient>
                  <linearGradient id="lifeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fef9c3" />
                    <stop offset="42%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                  <linearGradient id="leafLight" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#86efac" />
                    <stop offset="55%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                  <linearGradient id="leafDark" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#14532d" />
                  </linearGradient>
                  <linearGradient id="plankWood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c2641a" />
                    <stop offset="50%" stopColor="#9a4412" />
                    <stop offset="100%" stopColor="#6c2a09" />
                  </linearGradient>
                  <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#facc15" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                  </radialGradient>
                  <path id="sundaArcPath" d="M 48,110 Q 230,72 412,110" />
                </defs>

                {/* Fresh green Sunda leaves behind LIFE & above wooden banner */}
                {/* Left leaves */}
                <g>
                  <path
                    d="M 102,190 C 66,184 44,158 46,134 C 72,138 96,156 108,184 Z"
                    fill="url(#leafDark)"
                    stroke="#14532d"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 116,198 C 72,202 36,186 28,158 C 60,152 94,166 118,192 Z"
                    fill="url(#leafLight)"
                    stroke="#14532d"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  <path d="M 42,163 Q 78,176 110,192" fill="none" stroke="#dcfce7" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
                </g>

                {/* Right leaves */}
                <g>
                  <path
                    d="M 358,190 C 394,184 416,158 414,134 C 388,138 364,156 352,184 Z"
                    fill="url(#leafDark)"
                    stroke="#14532d"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 344,198 C 388,202 424,186 432,158 C 400,152 366,166 342,192 Z"
                    fill="url(#leafLight)"
                    stroke="#14532d"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  <path d="M 418,163 Q 382,176 350,192" fill="none" stroke="#dcfce7" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
                </g>

                {/* Cartoon golden spark rays on left and right of SUNDA */}
                <g stroke="#5c2009" strokeWidth="3.5" strokeLinejoin="round" fill="#fde047">
                  <polygon points="18,62 42,74 37,82 14,70" />
                  <polygon points="10,92 38,93 38,101 10,101" />
                  <polygon points="24,118 46,108 49,116 28,126" />
                  <polygon points="442,62 418,74 423,82 446,70" />
                  <polygon points="450,92 422,93 422,101 450,101" />
                  <polygon points="436,118 414,108 411,116 432,126" />
                </g>

                {/* Wooden plank for SIMULATOR (behind bottom edge of LIFE) */}
                <g transform="translate(0, 6)">
                  {/* 3D depth shadow */}
                  <rect
                    x="74"
                    y="194"
                    width="312"
                    height="56"
                    rx="14"
                    fill="#3e1505"
                  />
                  {/* Main plank */}
                  <rect
                    x="74"
                    y="187"
                    width="312"
                    height="54"
                    rx="13"
                    fill="url(#plankWood)"
                    stroke="#451a03"
                    strokeWidth="4.5"
                  />
                  {/* Subtle wood grain highlights */}
                  <path
                    d="M 96,200 Q 170,195 245,201 M 280,199 Q 330,196 362,201 M 104,228 Q 200,233 356,227"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                  {/* Silver nail rivets */}
                  <circle cx="96" cy="214" r="5" fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
                  <circle cx="364" cy="214" r="5" fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
                  {/* SIMULATOR crisp text */}
                  <text
                    x="230"
                    y="224"
                    textAnchor="middle"
                    fontFamily="'Fredoka', sans-serif"
                    fontWeight="700"
                    fontSize="29"
                    letterSpacing="4.5"
                    fill="#3b1404"
                    transform="translate(0, 2)"
                  >
                    SIMULATOR
                  </text>
                  <text
                    x="230"
                    y="224"
                    textAnchor="middle"
                    fontFamily="'Fredoka', sans-serif"
                    fontWeight="700"
                    fontSize="29"
                    letterSpacing="4.5"
                    fill="#fffbeb"
                  >
                    SIMULATOR
                  </text>
                </g>

                {/* LIFE - bold 3D golden letters */}
                <g fontFamily="'Fredoka', sans-serif" fontWeight="700" fontSize="82" letterSpacing="3">
                  {/* Extruded shadow */}
                  <text
                    x="230"
                    y="186"
                    textAnchor="middle"
                    fill="#451605"
                    stroke="#451605"
                    strokeWidth="14"
                    strokeLinejoin="round"
                    transform="translate(0, 7)"
                  >
                    LIFE
                  </text>
                  {/* Dark brown cartoon outline */}
                  <text
                    x="230"
                    y="186"
                    textAnchor="middle"
                    fill="#6b270b"
                    stroke="#6b270b"
                    strokeWidth="14"
                    strokeLinejoin="round"
                  >
                    LIFE
                  </text>
                  {/* Golden gradient fill */}
                  <text x="230" y="186" textAnchor="middle" fill="url(#lifeFill)">
                    LIFE
                  </text>
                </g>

                {/* SUNDA - slightly curved top title */}
                <g fontFamily="'Fredoka', sans-serif" fontWeight="700" fontSize="86" letterSpacing="2">
                  {/* Extruded shadow */}
                  <text
                    textAnchor="middle"
                    fill="#451605"
                    stroke="#451605"
                    strokeWidth="15"
                    strokeLinejoin="round"
                    transform="translate(0, 7)"
                  >
                    <textPath href="#sundaArcPath" startOffset="50%">
                      SUNDA
                    </textPath>
                  </text>
                  {/* Dark brown cartoon outline */}
                  <text
                    textAnchor="middle"
                    fill="#6b270b"
                    stroke="#6b270b"
                    strokeWidth="15"
                    strokeLinejoin="round"
                  >
                    <textPath href="#sundaArcPath" startOffset="50%">
                      SUNDA
                    </textPath>
                  </text>
                  {/* Warm cream-gold gradient fill */}
                  <text textAnchor="middle" fill="url(#sundaFill)">
                    <textPath href="#sundaArcPath" startOffset="50%">
                      SUNDA
                    </textPath>
                  </text>
                </g>

                {/* Cute hanging warm warung lightbulb on right edge */}
                <g transform="translate(388, 134)">
                  <line x1="0" y1="0" x2="0" y2="54" stroke="#1e293b" strokeWidth="2.5" />
                  <circle cx="0" cy="65" r="24" fill="url(#bulbGlow)" />
                  <rect x="-4" y="51" width="8" height="6" rx="1.5" fill="#475569" />
                  <circle cx="0" cy="65" r="8.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
                  <circle cx="-2.5" cy="62.5" r="2.5" fill="#ffffff" opacity="0.85" />
                </g>
              </svg>
              <div className="mt-1 text-[10px] sm:text-xs font-bold text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] [@media(max-height:460px)]:hidden">
                Petualangan Arga Mengelola Warung Arga &amp; Kampung Sunda
              </div>
            </div>

            {/* Stacked Action Buttons matching Reference Proportions */}
            <div className="flex flex-col gap-2 [@media(max-height:520px)]:gap-1.5">
              <button
                onClick={onContinueOrStart}
                className={`w-full px-4 sm:px-6 py-2.5 sm:py-3.5 [@media(max-height:520px)]:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-slate-950 border-2 border-amber-200 shadow-[0_4px_0_#92400e,0_10px_22px_rgba(0,0,0,0.55)] active:translate-y-0.5 transition-all text-center ${
                  focusedIndex === 0 ? 'ally-focus scale-[1.02]' : 'hover:brightness-105'
                }`}
              >
                <div className="font-display text-lg sm:text-2xl lg:text-3xl [@media(max-height:520px)]:text-base font-extrabold tracking-wide leading-tight">
                  {latestSlot && !latestSlot.empty ? 'LANJUTKAN' : 'MULAI BERMAIN'}
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-amber-950 mt-0.5 tabular-nums truncate">
                  {latestSlot && !latestSlot.empty
                    ? `${latestSlot.warungName} · Hari ${latestSlot.day} · ${formatRupiah(latestSlot.money ?? 0)} · ${latestSlot.rankLabel ?? 'Warrior III'}`
                    : 'Warung Arga · Hari 1 · Rp 350.000 · Warrior III'}
                </div>
              </button>

              <button
                onClick={onOpenLoadSave}
                className={`w-full px-4 sm:px-6 py-2.5 sm:py-3.5 [@media(max-height:520px)]:py-1.5 rounded-xl sm:rounded-2xl bg-slate-900/95 border-2 border-amber-400/75 text-amber-50 shadow-[0_4px_0_#020617,0_8px_16px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all text-center ${
                  focusedIndex === 1 ? 'ally-focus bg-slate-800' : 'hover:bg-slate-800/95'
                }`}
              >
                <span className="font-display text-base sm:text-xl lg:text-2xl [@media(max-height:520px)]:text-sm font-bold tracking-wider">
                  LOAD SAVE
                </span>
              </button>

              <button
                onClick={onOpenSettings}
                className={`w-full px-4 sm:px-6 py-2.5 sm:py-3.5 [@media(max-height:520px)]:py-1.5 rounded-xl sm:rounded-2xl bg-slate-900/95 border-2 border-amber-400/75 text-amber-50 shadow-[0_4px_0_#020617,0_8px_16px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all text-center ${
                  focusedIndex === 2 ? 'ally-focus bg-slate-800' : 'hover:bg-slate-800/95'
                }`}
              >
                <span className="font-display text-base sm:text-xl lg:text-2xl [@media(max-height:520px)]:text-sm font-bold tracking-wider">
                  PENGATURAN
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT FOREGROUND OVERLAY: Petunjuk Permainan + Pak GuruAI STUDIO Brand Lockup */}
          <div className="w-[44%] max-w-[390px] self-stretch flex flex-col items-end justify-between gap-2 py-1">
            {/* Petunjuk Permainan Sebelum Mulai */}
            <div className="w-full rounded-xl sm:rounded-2xl bg-slate-950/85 backdrop-blur-md border-2 border-amber-400/60 shadow-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setGuideOpen((v) => !v)}
                className="w-full px-3 sm:px-4 py-2 flex items-center justify-between bg-slate-900/90 border-b border-amber-400/25 text-left"
              >
                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Petunjuk Permainan</span>
                </span>
                {guideOpen ? (
                  <ChevronUp className="w-4 h-4 text-amber-300 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-amber-300 shrink-0" />
                )}
              </button>

              {guideOpen && (
                <ul className="px-3 sm:px-4 py-2 sm:py-2.5 space-y-1.5 text-[10px] sm:text-[11px] text-slate-200 leading-snug max-h-[180px] sm:max-h-none overflow-y-auto">
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-300 shrink-0">1.</span>
                    <span>
                      <strong className="text-white">Gerak &amp; Aksi:</strong> Pakai{' '}
                      <span className="text-amber-200 font-semibold">WASD / Panah / Klik Tanah / Analog</span>. Dekati tempat atau warga lalu tekan{' '}
                      <span className="text-amber-200 font-semibold">[A]</span>.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-300 shrink-0">2.</span>
                    <span>
                      <strong className="text-white">Warung (09.00–17.00):</strong> Buka warung, layani warga, kulakan di Pasar (naik Angkot/Ojek/Delman), &amp;{' '}
                      <span className="text-emerald-300 font-semibold">Renovasi Warung</span> untuk buka slot barang baru!
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-300 shrink-0">3.</span>
                    <span>
                      <strong className="text-white">Tata Krama Sunda &amp; Sholat:</strong> Pilih{' '}
                      <span className="text-emerald-300 font-semibold">salam Basa Sunda sopan</span> saat menyapa warga untuk bonus poin, dan sholat saat Adzan tiba.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-300 shrink-0">4.</span>
                    <span>
                      <strong className="text-white">Kerja &amp; Misi Harian:</strong> Ambil kerja sampingan pagi/malam (bersihkan masjid, ronda, dll.) &amp; pantau cuaca 3 hari di HP{' '}
                      <span className="text-amber-200 font-semibold">[X]</span>.
                    </span>
                  </li>
                </ul>
              )}
            </div>

            <div className="flex flex-col items-center sm:items-end text-center sm:text-right mb-1 sm:mb-2 lg:mr-4 [@media(max-height:520px)]:mb-0">
              <div className="drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]">
                <div className="font-display text-2xl sm:text-4xl lg:text-5xl [@media(max-height:520px)]:text-2xl font-black tracking-tight leading-none">
                  <span className="text-white">Pak </span>
                  <span className="text-amber-400">GuruAI</span>
                </div>
                <div className="text-[10px] sm:text-xs lg:text-sm font-extrabold tracking-[0.36em] sm:tracking-[0.42em] text-amber-100 uppercase mt-1">
                  S T U D I O
                </div>
              </div>

              <div className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs font-bold text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                Versi 2.2 · Edisi Sunda Priangan
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5">
                <button
                  onClick={onOpenChangelog}
                  className={`px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-slate-900/90 border-2 border-amber-400/80 text-amber-200 text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2 transition-all ${
                    focusedIndex === 3 ? 'ally-focus bg-slate-800 scale-105' : 'hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Yang Baru &amp; Panduan</span>
                </button>

                <PWAInstallButton compact />
              </div>
            </div>
          </div>
        </div>

        {/* Clean Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 pt-1.5 sm:pt-2 border-t border-white/15 text-[11px] sm:text-xs text-slate-200">
          <div className="font-bold text-amber-300 drop-shadow">@copyright Pak GuruAI</div>
          <div className="flex items-center gap-2 text-slate-200 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-amber-400/35">
            <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="truncate max-w-[260px] sm:max-w-none">
              Controller &amp; Touch: {gamepadConnected ? 'Controller Terhubung' : 'Siap Pakai'} · Offline Ready
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
