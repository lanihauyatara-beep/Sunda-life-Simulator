import React from 'react';
import { Gamepad2, Sparkles } from 'lucide-react';
import { ASSETS, formatRupiah } from '../data/gameData';
import { SaveSlotSummary } from '../types/game';

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
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Cover Artwork Matching Reference Layout with Pak GuruAI Mascot & Sunda Village */}
      <img
        src={ASSETS.cover}
        alt="Sunda Life Simulator bersama Arga dan Pak GuruAI"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Subtle left & bottom contrast gradient for clean UI readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/25" />

      {/* LEFT COLUMN: Carved 3D Logo & Stacked Reference Menu Buttons */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col justify-between">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between flex-1 gap-8">
          <div className="w-full max-w-[360px] sm:max-w-[410px] flex flex-col items-stretch">
            {/* Aesthetic 3D Cartoon Wood + Gold Game Logo SVG (matching reference emblem) */}
            <div className="mb-3 flex flex-col items-center sm:items-start">
              <svg
                viewBox="0 0 460 278"
                className="w-[300px] sm:w-[350px] h-auto drop-shadow-[0_14px_24px_rgba(0,0,0,0.65)] overflow-visible"
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
              <div className="mt-1 text-xs font-bold text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                Petualangan Arga Mengelola Warung Arga &amp; Kampung Sunda
              </div>
            </div>

            {/* Stacked Action Buttons matching Reference Proportions */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={onContinueOrStart}
                className={`w-full px-6 py-3.5 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-slate-950 border-2 border-amber-200 shadow-[0_5px_0_#92400e,0_10px_22px_rgba(0,0,0,0.55)] active:translate-y-0.5 transition-all text-center ${
                  focusedIndex === 0 ? 'ally-focus scale-[1.02]' : 'hover:brightness-105'
                }`}
              >
                <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-wide leading-tight">
                  {latestSlot && !latestSlot.empty ? 'LANJUTKAN' : 'MULAI BERMAIN'}
                </div>
                <div className="text-[11px] font-bold text-amber-950 mt-0.5 tabular-nums truncate">
                  {latestSlot && !latestSlot.empty
                    ? `${latestSlot.warungName} · Hari ${latestSlot.day} · ${formatRupiah(latestSlot.money ?? 0)} · ${latestSlot.rankLabel ?? 'Warrior III'}`
                    : 'Warung Arga · Hari 1 · Rp 350.000 · Warrior III'}
                </div>
              </button>

              <button
                onClick={onOpenLoadSave}
                className={`w-full px-6 py-3.5 rounded-2xl bg-slate-900/95 border-2 border-amber-400/75 text-amber-50 shadow-[0_4px_0_#020617,0_8px_16px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all text-center ${
                  focusedIndex === 1 ? 'ally-focus bg-slate-800' : 'hover:bg-slate-800/95'
                }`}
              >
                <span className="font-display text-xl sm:text-2xl font-bold tracking-wider">
                  LOAD SAVE
                </span>
              </button>

              <button
                onClick={onOpenSettings}
                className={`w-full px-6 py-3.5 rounded-2xl bg-slate-900/95 border-2 border-amber-400/75 text-amber-50 shadow-[0_4px_0_#020617,0_8px_16px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all text-center ${
                  focusedIndex === 2 ? 'ally-focus bg-slate-800' : 'hover:bg-slate-800/95'
                }`}
              >
                <span className="font-display text-xl sm:text-2xl font-bold tracking-wider">
                  PENGATURAN
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT FOREGROUND OVERLAY: Pak GuruAI STUDIO Brand Lockup + Version + Yang Baru */}
          <div className="self-end lg:self-end flex flex-col items-center text-center mb-4 lg:mb-10 lg:mr-10">
            <div className="drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]">
              <div className="font-display text-4xl sm:text-5xl font-black tracking-tight leading-none">
                <span className="text-white">Pak </span>
                <span className="text-amber-400">GuruAI</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold tracking-[0.42em] text-amber-100 uppercase mt-1">
                S T U D I O
              </div>
            </div>

            <div className="mt-2 text-xs font-bold text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
              Versi 2.2 · Edisi Sunda Priangan
            </div>

            <button
              onClick={onOpenChangelog}
              className={`mt-2 px-6 py-2 rounded-full bg-slate-900/90 border-2 border-amber-400/80 text-amber-200 text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2 transition-all ${
                focusedIndex === 3 ? 'ally-focus bg-slate-800 scale-105' : 'hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Yang Baru &amp; Panduan</span>
            </button>
          </div>
        </div>

        {/* Clean Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/15 text-xs text-slate-200">
          <div className="font-bold text-amber-300 drop-shadow">@copyright Pak GuruAI</div>
          <div className="flex items-center gap-2 text-slate-200 bg-slate-950/70 px-3 py-1 rounded-lg border border-amber-400/35">
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            <span>
              ASUS ROG Ally: {gamepadConnected ? 'Kontroler Terhubung' : 'Siap Pakai'} · [A] Pilih · [B] Kembali
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
