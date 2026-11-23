import React from 'react';

import type { ArgaOutfitMode } from '../types/game';
import type { NpcDirection, NpcMotionState } from '../utils/npcController';

interface CharacterSpriteProps {
  name: string;
  shirtColor: string;
  accentColor?: string;
  hatType?: 'peci' | 'iket' | 'kerudung' | 'topi' | 'none';
  outfitMode?: ArgaOutfitMode;
  isArga?: boolean;
  isInjured?: boolean;
  facing?: 'left' | 'right';
  moveDir?: NpcDirection;
  motionState?: NpcMotionState;
  walkCadenceSec?: number;
  isMoving?: boolean;
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  name,
  shirtColor,
  accentColor = '#fef3c7',
  hatType = 'none',
  outfitMode = 'default',
  isArga = false,
  isInjured = false,
  facing = 'right',
  moveDir,
  motionState,
  walkCadenceSec = 0.52,
  isMoving = false,
}) => {
  const uid = React.useId().replace(/:/g, '');
  const skinGradId = `skin_${uid}`;
  const shirtGradId = `shirt_${uid}`;
  const isSarungOutfit = outfitMode === 'sarung';
  const isWarmOutfit = outfitMode === 'warm';
  const effectiveShirtColor = isSarungOutfit ? '#f8fafc' : isWarmOutfit ? '#1e3a8a' : shirtColor;
  const effectiveAccentColor = isSarungOutfit ? '#0f766e' : isWarmOutfit ? '#f59e0b' : accentColor;
  const effectiveHatType = isSarungOutfit ? 'peci' : hatType;
  const isVerticalWalk = isMoving && (moveDir === 'up' || moveDir === 'down');
  const isTransitionWalk = isMoving && motionState === 'transitioning';
  const bodyMotionClass = !isMoving
    ? 'sunda-idle-breath'
    : isVerticalWalk
    ? 'sunda-walk-vertical'
    : 'sunda-walk-bob';

  return (
    <div className="flex flex-col items-center pointer-events-none select-none">
      {/* Overhead name plate */}
      <div
        className={`mb-0.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight whitespace-nowrap shadow-md ${
          isArga
            ? 'bg-amber-400 text-slate-950 border border-amber-200'
            : 'bg-slate-950/90 text-amber-100 border border-amber-400/50'
        }`}
      >
        {name}
      </div>

      <svg
        viewBox="0 0 64 96"
        style={{ '--walk-cadence': `${walkCadenceSec}s` } as React.CSSProperties}
        className={`w-13 h-20 drop-shadow-[0_7px_6px_rgba(0,0,0,0.55)] transition-transform duration-150 ${
          facing === 'left' ? 'scale-x-[-1]' : ''
        } ${isTransitionWalk ? 'brightness-105' : ''}`}
      >
        <defs>
          <linearGradient id={skinGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f2c4a2" />
            <stop offset="65%" stopColor="#dfa47d" />
            <stop offset="100%" stopColor="#c5845d" />
          </linearGradient>
          <linearGradient id={shirtGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={effectiveShirtColor} />
            <stop offset="100%" stopColor="#0f172a" stopOpacity={isSarungOutfit ? '0.12' : '0.28'} />
          </linearGradient>
        </defs>

        {/* Ground contact shadow */}
        <ellipse
          cx="32"
          cy="89"
          rx="15"
          ry="4.5"
          fill="rgba(0,0,0,0.45)"
          className={isMoving ? 'sunda-walk-shadow' : ''}
        />

        {/* Back/Left Leg + Sandal (wrapped in Kain Sarung when Master prayer outfit active) */}
        <g className={isMoving ? 'sunda-walk-leg-l' : ''}>
          {isSarungOutfit ? (
            <rect x="22" y="75" width="6" height="9" rx="2" fill={`url(#${skinGradId})`} stroke="#3b2214" strokeWidth="0.9" />
          ) : (
            <>
              <path
                d="M21 57 L29 57 L28 84 L21 84 Z"
                fill={effectiveHatType === 'kerudung' ? '#3f2e21' : isWarmOutfit ? '#1e293b' : '#334155'}
                stroke="#0f172a"
                strokeWidth="1.2"
              />
              <line x1="24" y1="60" x2="23.5" y2="80" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
            </>
          )}
          <ellipse cx="24.5" cy="86" rx="5.5" ry="2.8" fill="#5c2d16" stroke="#1c0d06" strokeWidth="1" />
          <path d="M20 85 Q24.5 83 29 85" stroke="#b45309" strokeWidth="1.3" fill="none" />
        </g>

        {/* Front/Right Leg + Bandage + Sandal */}
        <g className={isMoving ? 'sunda-walk-leg-r' : ''}>
          {isSarungOutfit ? (
            <rect x="36" y="75" width="6" height="9" rx="2" fill={`url(#${skinGradId})`} stroke="#3b2214" strokeWidth="0.9" />
          ) : (
            <>
              <path
                d="M35 57 L43 57 L43 84 L36 84 Z"
                fill={effectiveHatType === 'kerudung' ? '#2e2117' : isWarmOutfit ? '#0f172a' : '#1e293b'}
                stroke="#0f172a"
                strokeWidth="1.2"
              />
              <line x1="39" y1="60" x2="39.5" y2="80" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
            </>
          )}
          {isInjured && (
            <g>
              <rect x="34.5" y="66" width="9.5" height="9" rx="2" fill="#f8fafc" stroke="#ef4444" strokeWidth="1.2" />
              <line x1="35" y1="70.5" x2="44" y2="70.5" stroke="#ef4444" strokeWidth="1.2" />
            </g>
          )}
          <ellipse cx="39.5" cy="86" rx="5.5" ry="2.8" fill="#451a03" stroke="#1c0d06" strokeWidth="1" />
          <path d="M35 85 Q39.5 83 44 85" stroke="#b45309" strokeWidth="1.3" fill="none" />
        </g>

        {/* Kain Sarung (Master+ Prayer Outfit) wrapped gracefully over lower body */}
        {isSarungOutfit && (
          <g>
            {/* Main woven emerald-teal sarung */}
            <path
              d="M19 56 Q32 54 45 56 L47 80 Q32 82.5 17 80 Z"
              fill="#0f766e"
              stroke="#042f2e"
              strokeWidth="1.2"
            />
            {/* Horizontal woven stripes */}
            <path d="M18.5 62 Q32 60.5 45.5 62" stroke="#14b8a6" strokeWidth="1.5" fill="none" opacity="0.65" />
            <path d="M18 68 Q32 66.5 46 68" stroke="#f59e0b" strokeWidth="1.3" fill="none" opacity="0.7" />
            <path d="M17.5 74 Q32 72.5 46.5 74" stroke="#134e4a" strokeWidth="1.8" fill="none" opacity="0.85" />
            <path d="M17.2 78.2 Q32 80 46.8 78.2" stroke="#fde68a" strokeWidth="1.1" fill="none" opacity="0.75" />
            {/* Vertical woven plaid bands & central sarung lipatan fold */}
            <line x1="25" y1="56" x2="24" y2="80.5" stroke="#134e4a" strokeWidth="1.5" opacity="0.65" />
            <line x1="39" y1="56" x2="40" y2="80.5" stroke="#134e4a" strokeWidth="1.5" opacity="0.65" />
            <path d="M31.5 55.5 L32 81" stroke="#042f2e" strokeWidth="1.6" opacity="0.85" />
            <path d="M32.8 55.8 L33.2 81" stroke="#fde68a" strokeWidth="0.9" opacity="0.6" />
            {/* Waistband fold (gulungan sarung) */}
            <path
              d="M19 54 Q32 52 45 54 L45.5 58 Q32 56.5 18.5 58 Z"
              fill="#115e59"
              stroke="#042f2e"
              strokeWidth="1"
            />
          </g>
        )}

        {/* Upper body stride bob / vertical walk / idle breathing */}
        <g className={bodyMotionClass}>
          {/* Back Arm */}
          <g className={isMoving ? 'sunda-walk-arm-l' : ''}>
            <path
              d="M17 33 Q12 41 13 53 Q15 56 18 54 L20 39 Z"
              fill={`url(#${skinGradId})`}
              stroke="#3b2214"
              strokeWidth="1"
            />
            {isWarmOutfit || isSarungOutfit ? (
              <path
                d="M16 30 Q11.5 34 12 49 L18.5 49 L21 30 Z"
                fill={effectiveShirtColor}
                stroke="#0f172a"
                strokeWidth="1.2"
              />
            ) : (
              <path d="M16 30 Q12 33 12 40 L20 40 L21 30 Z" fill={effectiveShirtColor} stroke="#0f172a" strokeWidth="1.2" />
            )}
          </g>

          {/* Torso / Shirt / Warm Jacket / Baju Koko */}
          <path
            d="M19 30 Q32 27 45 30 L47 40 L44 58 Q32 60 20 58 L17 40 Z"
            fill={effectiveShirtColor}
            stroke="#0f172a"
            strokeWidth="1.3"
          />
          <path
            d="M19 30 Q32 27 45 30 L47 40 L44 58 Q32 60 20 58 L17 40 Z"
            fill={`url(#${shirtGradId})`}
          />

          {isWarmOutfit ? (
            <g>
              {/* Quilted warm jacket seams & front amber zipper */}
              <path d="M18.5 39 Q32 40.5 45.5 39" stroke="#0f172a" strokeWidth="0.9" fill="none" opacity="0.55" />
              <path d="M19 47 Q32 48.5 45 47" stroke="#0f172a" strokeWidth="0.9" fill="none" opacity="0.55" />
              <line x1="32" y1="33" x2="32" y2="58" stroke="#f59e0b" strokeWidth="2" />
              {/* Warm jacket pockets */}
              <rect x="21" y="49" width="6.5" height="5" rx="1.2" fill="#172554" stroke="#60a5fa" strokeWidth="0.7" opacity="0.8" />
              <rect x="36.5" y="49" width="6.5" height="5" rx="1.2" fill="#172554" stroke="#60a5fa" strokeWidth="0.7" opacity="0.8" />
              {/* Cozy knit scarf around neck with hanging tail */}
              <path
                d="M23 28 Q32 34 41 28 L42 34 Q32 38.5 22 34 Z"
                fill="#f59e0b"
                stroke="#78350f"
                strokeWidth="1"
              />
              <path
                d="M34 33 L38 45 L33.5 46 L31 35 Z"
                fill="#d97706"
                stroke="#78350f"
                strokeWidth="0.9"
              />
              <line x1="25" y1="31" x2="39" y2="31" stroke="#fef3c7" strokeWidth="1" opacity="0.7" />
            </g>
          ) : isSarungOutfit ? (
            <g>
              {/* Baju Koko standing collar & subtle teal/gold embroidery */}
              <path d="M26 28 Q32 32 38 28 L37 32 Q32 35 27 32 Z" fill="#0f766e" stroke="#042f2e" strokeWidth="0.9" />
              <line x1="32" y1="33" x2="32" y2="55" stroke="#0f766e" strokeWidth="1.6" opacity="0.75" />
              <circle cx="32" cy="37" r="0.9" fill="#f59e0b" />
              <circle cx="32" cy="42" r="0.9" fill="#f59e0b" />
              <circle cx="32" cy="47" r="0.9" fill="#f59e0b" />
            </g>
          ) : (
            <>
              {/* Shirt Collar & Placket */}
              <path d="M25 29 L32 39 L39 29 L36 28 L32 33 L28 28 Z" fill={effectiveAccentColor} stroke="#1e293b" strokeWidth="0.9" />
              <line x1="32" y1="39" x2="32" y2="58" stroke="rgba(15,23,42,0.35)" strokeWidth="1.2" />
            </>
          )}

          {/* Arga's Signature Sling Bag Strap (hidden while wearing prayer outfit) */}
          {isArga && !isSarungOutfit && (
            <path d="M22 30 L42 57" stroke="#78350f" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
          )}

          {/* Front Arm */}
          <g className={isMoving ? 'sunda-walk-arm-r' : ''}>
            <path
              d="M44 33 Q51 42 50 54 Q48 57 45 55 L43 39 Z"
              fill={`url(#${skinGradId})`}
              stroke="#3b2214"
              strokeWidth="1"
            />
            {isWarmOutfit || isSarungOutfit ? (
              <path
                d="M43 30 Q49.5 34 50 50 L43.5 50 L42 30 Z"
                fill={effectiveShirtColor}
                stroke="#0f172a"
                strokeWidth="1.2"
              />
            ) : (
              <path d="M43 30 Q49 33 50 40 L43 40 L42 30 Z" fill={effectiveShirtColor} stroke="#0f172a" strokeWidth="1.2" />
            )}
          </g>

          {/* Neck & Chin Shadow */}
          <rect x="28.5" y="24" width="7" height="7" rx="2" fill="#c98b63" />

        {/* Realistic Shaped Head */}
        <path
          d="M22 14 Q22 6 32 6 Q42 6 42 14 Q42 25 32 27 Q22 25 22 14 Z"
          fill={`url(#${skinGradId})`}
          stroke="#3b2214"
          strokeWidth="1.1"
        />
        {/* Ears */}
        <ellipse cx="21.5" cy="17" rx="1.8" ry="2.8" fill="#d99a73" />
        <ellipse cx="42.5" cy="17" rx="1.8" ry="2.8" fill="#d99a73" />

        {/* Expressive Eyes, Brows, Nose & Smile */}
        <path d="M25.5 14 Q27.5 13 29.5 14" stroke="#1e293b" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M34.5 14 Q36.5 13 38.5 14" stroke="#1e293b" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <ellipse cx="27.8" cy="16.5" rx="1.6" ry="1.8" fill="#ffffff" />
        <ellipse cx="36.8" cy="16.5" rx="1.6" ry="1.8" fill="#ffffff" />
        <circle cx="28.1" cy="16.6" r="1.1" fill="#1e293b" />
        <circle cx="37.1" cy="16.6" r="1.1" fill="#1e293b" />
        <path d="M32 17.5 L31.5 20.5 L33 20.8" stroke="#a66844" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M29 22.8 Q32 24.8 35.5 22.6" stroke="#7c2d12" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Hair & Traditional Sundanese Headgear */}
        {effectiveHatType === 'none' && isWarmOutfit && (
          <g>
            {/* Cozy knit beanie / kupluk hangat for Elite rainy season */}
            <path d="M21 12 Q21.5 3.5 32 3.5 Q42.5 3.5 43 12 Z" fill="#b45309" stroke="#451a03" strokeWidth="1" />
            <rect x="20.5" y="9.5" width="23" height="3.8" rx="1.8" fill="#f59e0b" stroke="#78350f" strokeWidth="0.9" />
            <circle cx="32" cy="3.2" r="2.1" fill="#fde68a" stroke="#78350f" strokeWidth="0.7" />
          </g>
        )}
        {effectiveHatType === 'none' && !isWarmOutfit && (
          <g>
            <path
              d="M21.5 14 Q21 5 32 4.5 Q43 5 42.5 14 Q38 9.5 32 10 Q25 10 21.5 14 Z"
              fill="#1e293b"
            />
            <path d="M25 8 Q32 6 39 8.5" stroke="#475569" strokeWidth="1.2" fill="none" opacity="0.6" />
          </g>
        )}
        {effectiveHatType === 'peci' && (
          <g>
            <path d="M21 12 L22 4.5 Q32 3 42 4.5 L43 12 Q32 10.5 21 12 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <line x1="23" y1="7" x2="41" y2="7" stroke={isSarungOutfit ? '#f59e0b' : '#334155'} strokeWidth="0.9" opacity="0.7" />
          </g>
        )}
        {effectiveHatType === 'iket' && (
          <g>
            <path d="M21 13 Q32 3 43 13 L41.5 6 Q32 2.5 22.5 6 Z" fill="#291d14" stroke="#0f172a" strokeWidth="0.9" />
            <path d="M21 10.5 Q32 9 43 10.5" stroke="#d97706" strokeWidth="2.8" fill="none" />
            <path d="M36 7 L43 11" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        {effectiveHatType === 'kerudung' && (
          <g>
            <path
              d="M20 15 Q20 4 32 4 Q44 4 44 15 L46 31 Q32 34 18 31 Z"
              fill={effectiveAccentColor}
              stroke="#475569"
              strokeWidth="1"
              opacity="0.96"
            />
            <path
              d="M22.5 15 Q22.5 7.5 32 7.5 Q41.5 7.5 41.5 15 Q41.5 24.5 32 26.5 Q22.5 24.5 22.5 15 Z"
              fill={`url(#${skinGradId})`}
            />
            <path d="M25.5 14 Q27.5 13 29.5 14" stroke="#1e293b" strokeWidth="1" fill="none" />
            <path d="M34.5 14 Q36.5 13 38.5 14" stroke="#1e293b" strokeWidth="1" fill="none" />
            <circle cx="28" cy="16.5" r="1.2" fill="#1e293b" />
            <circle cx="37" cy="16.5" r="1.2" fill="#1e293b" />
            <path d="M29 22.5 Q32 24.2 35 22.4" stroke="#7c2d12" strokeWidth="1.1" fill="none" />
          </g>
        )}
        {effectiveHatType === 'topi' && (
          <g>
            <path d="M21 11.5 Q32 3.5 43 11.5 Z" fill="#92400e" stroke="#451a03" strokeWidth="1" />
            <path d="M21 11 L47 12.2 L44 14 L21 12.5 Z" fill="#78350f" />
          </g>
        )}
        </g>
      </svg>
    </div>
  );
};

interface PortraitBadgeProps {
  name: string;
  shirtColor: string;
  accentColor?: string;
  hatType?: 'peci' | 'iket' | 'kerudung' | 'topi' | 'none';
  size?: 'md' | 'lg';
}

export const PortraitBadge: React.FC<PortraitBadgeProps> = ({
  shirtColor,
  accentColor = '#fef3c7',
  hatType = 'none',
  size = 'md',
}) => {
  const uid = React.useId().replace(/:/g, '');
  const skinGradId = `pskin_${uid}`;
  const dim = size === 'lg' ? 'w-20 h-20' : 'w-14 h-14';

  return (
    <div
      className={`${dim} rounded-2xl bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 border-2 border-amber-400 shadow-lg overflow-hidden flex items-end justify-center shrink-0`}
    >
      <svg viewBox="0 0 64 68" className="w-full h-full">
        <defs>
          <linearGradient id={skinGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f2c4a2" />
            <stop offset="65%" stopColor="#dfa47d" />
            <stop offset="100%" stopColor="#c5845d" />
          </linearGradient>
        </defs>
        {/* Shoulders & Shirt */}
        <path d="M10 68 L14 44 Q18 37 32 37 Q46 37 50 44 L54 68 Z" fill={shirtColor} stroke="#0f172a" strokeWidth="1.2" />
        <path d="M23 37 L32 49 L41 37 Z" fill={accentColor} />
        {/* Neck */}
        <rect x="27" y="30" width="10" height="9" rx="3" fill="#c98b63" />
        {/* Realistic Head */}
        <path
          d="M20 20 Q20 9 32 9 Q44 9 44 20 Q44 33 32 35 Q20 33 20 20 Z"
          fill={`url(#${skinGradId})`}
          stroke="#3b2214"
          strokeWidth="1.2"
        />
        <ellipse cx="19.5" cy="22" rx="2.2" ry="3.5" fill="#d99a73" />
        <ellipse cx="44.5" cy="22" rx="2.2" ry="3.5" fill="#d99a73" />

        {/* Eyes, Brows, Nose & Warm Smile */}
        <path d="M23.5 18 Q26 16.5 28.5 18" stroke="#1e293b" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M35.5 18 Q38 16.5 40.5 18" stroke="#1e293b" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <ellipse cx="26.3" cy="21" rx="2.1" ry="2.2" fill="#ffffff" />
        <ellipse cx="37.7" cy="21" rx="2.1" ry="2.2" fill="#ffffff" />
        <circle cx="26.5" cy="21.2" r="1.4" fill="#1e293b" />
        <circle cx="37.9" cy="21.2" r="1.4" fill="#1e293b" />
        <circle cx="27" cy="20.6" r="0.5" fill="#ffffff" />
        <circle cx="38.4" cy="20.6" r="0.5" fill="#ffffff" />
        <path d="M32 22 L31.2 25.8 L33.2 26.2" stroke="#a66844" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M27.5 28.8 Q32 31.8 36.5 28.8" stroke="#7c2d12" strokeWidth="1.6" fill="none" strokeLinecap="round" />

        {hatType === 'none' && (
          <path d="M19.5 18 Q19.5 7 32 7 Q44.5 7 44.5 18 Q39 12 32 13 Q24 13 19.5 18 Z" fill="#1e293b" />
        )}
        {hatType === 'peci' && (
          <path d="M19 16 L20.5 7 Q32 5 43.5 7 L45 16 Q32 14 19 16 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        )}
        {hatType === 'iket' && (
          <>
            <path d="M19 17 Q32 5 45 17 L43 9 Q32 4 21 9 Z" fill="#291d14" />
            <path d="M19 14 Q32 12 45 14" stroke="#d97706" strokeWidth="3.5" fill="none" />
          </>
        )}
        {hatType === 'kerudung' && (
          <>
            <path d="M16 21 Q16 6 32 6 Q48 6 48 21 L51 48 Q32 52 13 48 Z" fill={accentColor} opacity="0.96" />
            <path
              d="M20.5 20 Q20.5 10.5 32 10.5 Q43.5 10.5 43.5 20 Q43.5 32 32 34.5 Q20.5 32 20.5 20 Z"
              fill={`url(#${skinGradId})`}
            />
            <path d="M23.5 18 Q26 16.5 28.5 18" stroke="#1e293b" strokeWidth="1.3" fill="none" />
            <path d="M35.5 18 Q38 16.5 40.5 18" stroke="#1e293b" strokeWidth="1.3" fill="none" />
            <circle cx="26.5" cy="21" r="1.4" fill="#1e293b" />
            <circle cx="37.7" cy="21" r="1.4" fill="#1e293b" />
            <path d="M28 28.5 Q32 31 36 28.5" stroke="#7c2d12" strokeWidth="1.4" fill="none" />
          </>
        )}
        {hatType === 'topi' && (
          <>
            <path d="M19 15 Q32 5 45 15 Z" fill="#92400e" />
            <path d="M19 14 L49 16 L46 18 L19 16 Z" fill="#78350f" />
          </>
        )}
      </svg>
    </div>
  );
};
