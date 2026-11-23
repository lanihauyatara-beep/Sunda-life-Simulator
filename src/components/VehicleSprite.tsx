import React from 'react';
import { VehicleType } from '../types/game';

interface VehicleSpriteProps {
  type: VehicleType;
  direction: 1 | -1;
  angleDeg?: number;
}

export const VehicleSprite: React.FC<VehicleSpriteProps> = ({ type, direction, angleDeg = 0 }) => {
  const flipClass = direction === -1 ? 'scale-x-[-1]' : '';
  const uid = React.useId().replace(/:/g, '');

  const renderSvg = () => {
    if (type === 'angkot') {
      return (
        <svg viewBox="0 0 132 76" className={`w-28 h-16 drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] ${flipClass}`}>
          <defs>
            <linearGradient id={`ag_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="55%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#052e16" />
            </linearGradient>
            <linearGradient id={`glass_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="55%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          {/* Ground shadow */}
          <ellipse cx="66" cy="67" rx="52" ry="7" fill="rgba(0,0,0,0.42)" />
          {/* Roof luggage rack */}
          <rect x="28" y="10" width="60" height="6" rx="2" fill="#92400e" stroke="#451a03" strokeWidth="1.2" />
          <rect x="33" y="6" width="20" height="6" rx="1.5" fill="#d97706" />
          <rect x="57" y="5" width="24" height="7" rx="1.5" fill="#fde68a" />
          {/* Green Priangan Angkot Body */}
          <path
            d="M14 55 L14 23 Q14 15 26 15 L92 15 Q104 15 113 28 L120 40 L120 55 Q120 60 112 60 L20 60 Q14 60 14 55 Z"
            fill={`url(#ag_${uid})`}
            stroke="#052e16"
            strokeWidth="2"
          />
          {/* Iconic West Java Yellow-White Route Stripe */}
          <rect x="15" y="42" width="104" height="5" fill="#facc15" />
          <rect x="15" y="47" width="104" height="4" fill="#f8fafc" />
          {/* Glossy Windows with passenger silhouettes */}
          <rect x="21" y="20" width="20" height="17" rx="2.5" fill={`url(#glass_${uid})`} stroke="#0c4a6e" strokeWidth="1.5" />
          <rect x="46" y="20" width="26" height="17" rx="2.5" fill={`url(#glass_${uid})`} stroke="#0c4a6e" strokeWidth="1.5" />
          <path d="M77 20 L94 20 L106 37 L77 37 Z" fill={`url(#glass_${uid})`} stroke="#0c4a6e" strokeWidth="1.5" />
          {/* Side Mirror */}
          <rect x="103" y="33" width="4" height="6" rx="1" fill="#1e293b" />
          {/* Bumpers & Headlight/Taillight */}
          <rect x="114" y="40" width="7" height="6" rx="1.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
          <rect x="12" y="42" width="4" height="7" rx="1" fill="#ef4444" />
          <rect x="10" y="53" width="113" height="5" rx="2" fill="#334155" />
          {/* Realistic Tires & Rims */}
          <circle cx="35" cy="60" r="10.5" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <circle cx="35" cy="60" r="5.5" fill="#cbd5e1" />
          <circle cx="35" cy="60" r="2" fill="#475569" />
          <circle cx="96" cy="60" r="10.5" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <circle cx="96" cy="60" r="5.5" fill="#cbd5e1" />
          <circle cx="96" cy="60" r="2" fill="#475569" />
        </svg>
      );
    }

    if (type === 'mobil') {
      return (
        <svg viewBox="0 0 136 74" className={`w-28 h-16 drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] ${flipClass}`}>
          <defs>
            <linearGradient id={`car_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id={`cglass_${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <ellipse cx="68" cy="65" rx="54" ry="7" fill="rgba(0,0,0,0.42)" />
          {/* Realistic Indonesian MPV Silhouette */}
          <path
            d="M12 52 L14 35 L33 17 L85 17 L107 31 L122 36 L124 52 Q124 57 117 57 L18 57 Q12 57 12 52 Z"
            fill={`url(#car_${uid})`}
            stroke="#334155"
            strokeWidth="1.8"
          />
          {/* Body crease line */}
          <line x1="16" y1="43" x2="120" y2="43" stroke="#94a3b8" strokeWidth="1.3" />
          {/* Cabin Glass */}
          <path d="M36 20 L60 20 L60 33 L27 33 Z" fill={`url(#cglass_${uid})`} stroke="#1e293b" strokeWidth="1.2" />
          <path d="M64 20 L83 20 L99 33 L64 33 Z" fill={`url(#cglass_${uid})`} stroke="#1e293b" strokeWidth="1.2" />
          {/* Side mirror & door handles */}
          <rect x="86" y="32" width="5" height="4" rx="1" fill="#475569" />
          <rect x="48" y="38" width="6" height="2" rx="1" fill="#475569" />
          <rect x="74" y="38" width="6" height="2" rx="1" fill="#475569" />
          {/* Lights & Bumper */}
          <path d="M117 38 L124 39 L124 45 L116 45 Z" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
          <rect x="12" y="39" width="5" height="7" rx="1" fill="#ef4444" />
          {/* Alloy Wheels */}
          <circle cx="36" cy="57" r="10.5" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx="36" cy="57" r="6" fill="#e2e8f0" />
          <circle cx="36" cy="57" r="2.2" fill="#334155" />
          <circle cx="100" cy="57" r="10.5" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx="100" cy="57" r="6" fill="#e2e8f0" />
          <circle cx="100" cy="57" r="2.2" fill="#334155" />
        </svg>
      );
    }

    if (type === 'motor') {
      return (
        <svg viewBox="0 0 96 72" className={`w-20 h-15 drop-shadow-[0_6px_6px_rgba(0,0,0,0.48)] ${flipClass}`}>
          <ellipse cx="48" cy="64" rx="34" ry="5.5" fill="rgba(0,0,0,0.42)" />
          {/* Wheels */}
          <circle cx="22" cy="55" r="10" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="22" cy="55" r="5" fill="#cbd5e1" />
          <circle cx="74" cy="55" r="10" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="74" cy="55" r="5" fill="#cbd5e1" />
          {/* Exhaust & Engine */}
          <path d="M18 52 L44 52 L48 44" stroke="#64748b" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Frame & Body */}
          <path d="M20 46 L40 36 L62 34 L72 52" stroke="#b91c1c" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M58 24 L67 48" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
          {/* Seat */}
          <path d="M27 36 Q38 33 48 37 L44 41 L28 40 Z" fill="#1e293b" />
          {/* Realistic Rider with Jacket & Visor Helmet */}
          <path d="M36 22 Q45 20 50 28 L46 39 L35 38 Z" fill="#14532d" stroke="#052e16" strokeWidth="1.2" />
          <path d="M47 26 L59 27" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="44" cy="14" r="7.5" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
          <path d="M44 10 L51 12 L50 17 L44 17 Z" fill="#38bdf8" />
          {/* Headlight */}
          <circle cx="67" cy="29" r="3.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
        </svg>
      );
    }

    if (type === 'delman') {
      return (
        <svg viewBox="0 0 156 84" className={`w-36 h-19 drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] ${flipClass}`}>
          <ellipse cx="78" cy="75" rx="64" ry="7" fill="rgba(0,0,0,0.42)" />
          {/* Ornate Sundanese Delman Carriage */}
          <path d="M12 22 Q36 10 60 22 L60 52 L12 52 Z" fill="#7c2d12" stroke="#431407" strokeWidth="2" />
          <rect x="16" y="25" width="38" height="14" rx="2.5" fill="#fef3c7" stroke="#92400e" strokeWidth="1" />
          {/* Decorative Brass Trim */}
          <path d="M12 50 L60 50" stroke="#f59e0b" strokeWidth="2.5" />
          {/* Kusir (Coachman) with Sunda Iket */}
          <circle cx="66" cy="24" r="5.5" fill="#e5a77e" />
          <path d="M60 21 Q66 15 72 21 Z" fill="#291d14" />
          <path d="M60 20 L72 20" stroke="#d97706" strokeWidth="2" />
          <path d="M59 30 Q66 28 73 30 L74 47 L59 47 Z" fill="#1e3a8a" stroke="#0f172a" strokeWidth="1" />
          {/* Spoked Carriage Wheel */}
          <circle cx="38" cy="60" r="15.5" fill="none" stroke="#78350f" strokeWidth="4" />
          <circle cx="38" cy="60" r="13" fill="none" stroke="#b45309" strokeWidth="1.2" />
          <circle cx="38" cy="60" r="3.5" fill="#451a03" />
          <line x1="38" y1="45" x2="38" y2="75" stroke="#78350f" strokeWidth="2" />
          <line x1="23" y1="60" x2="53" y2="60" stroke="#78350f" strokeWidth="2" />
          <line x1="27" y1="49" x2="49" y2="71" stroke="#78350f" strokeWidth="1.6" />
          <line x1="49" y1="49" x2="27" y2="71" stroke="#78350f" strokeWidth="1.6" />
          {/* Shaft & Reins */}
          <line x1="58" y1="49" x2="104" y2="41" stroke="#78350f" strokeWidth="3.2" />
          <path d="M72 36 Q95 36 125 27" stroke="#451a03" strokeWidth="1.2" fill="none" />
          {/* Anatomical Shaded Horse */}
          <path d="M90 36 Q108 32 126 36 Q130 45 124 51 L92 50 Q87 44 90 36 Z" fill="#7c2d12" stroke="#431407" strokeWidth="1.5" />
          <path d="M118 37 L132 19 L142 25 L139 30 L130 28 L125 44 Z" fill="#7c2d12" stroke="#431407" strokeWidth="1.5" />
          {/* Horse Mane & Tail */}
          <path d="M116 35 L128 19" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
          <path d="M90 38 Q80 44 82 56" stroke="#1c1917" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          {/* Horse Legs */}
          <line x1="94" y1="50" x2="91" y2="71" stroke="#5c210e" strokeWidth="4" strokeLinecap="round" />
          <line x1="102" y1="50" x2="105" y2="71" stroke="#431407" strokeWidth="3.8" strokeLinecap="round" />
          <line x1="118" y1="50" x2="115" y2="71" stroke="#5c210e" strokeWidth="4" strokeLinecap="round" />
          <line x1="124" y1="50" x2="128" y2="71" stroke="#431407" strokeWidth="3.8" strokeLinecap="round" />
        </svg>
      );
    }

    if (type === 'pedati') {
      return (
        <svg viewBox="0 0 156 84" className={`w-36 h-19 drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] ${flipClass}`}>
          <ellipse cx="78" cy="75" rx="64" ry="7" fill="rgba(0,0,0,0.42)" />
          {/* Wooden Cart Body */}
          <path d="M12 27 L62 27 L66 51 L14 51 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          <line x1="14" y1="38" x2="64" y2="38" stroke="#451a03" strokeWidth="1.5" />
          {/* Rice Sacks Cargo */}
          <ellipse cx="29" cy="25" rx="11" ry="7.5" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" />
          <ellipse cx="47" cy="25" rx="11" ry="7.5" fill="#fde68a" stroke="#b45309" strokeWidth="1.5" />
          {/* Spoked Wooden Wheel */}
          <circle cx="39" cy="59" r="15.5" fill="none" stroke="#451a03" strokeWidth="4.2" />
          <circle cx="39" cy="59" r="3.5" fill="#451a03" />
          <line x1="39" y1="44" x2="39" y2="74" stroke="#451a03" strokeWidth="2" />
          <line x1="24" y1="59" x2="54" y2="59" stroke="#451a03" strokeWidth="2" />
          {/* Yoke & Water Buffalo (Kerbau Sunda) */}
          <line x1="64" y1="43" x2="104" y2="38" stroke="#78350f" strokeWidth="3.8" />
          <path d="M90 34 Q112 29 128 35 Q133 44 127 52 L92 52 Q87 43 90 34 Z" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          <ellipse cx="131" cy="39" rx="9" ry="7.5" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          {/* Curved Buffalo Horns */}
          <path d="M126 33 Q120 22 129 20" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M134 33 Q141 22 135 20" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeLinecap="round" />
          <line x1="94" y1="52" x2="93" y2="71" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="103" y1="52" x2="105" y2="71" stroke="#334155" strokeWidth="4.2" strokeLinecap="round" />
          <line x1="119" y1="52" x2="117" y2="71" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="126" y1="52" x2="128" y2="71" stroke="#334155" strokeWidth="4.2" strokeLinecap="round" />
        </svg>
      );
    }

    // Becak Kampung
    return (
      <svg viewBox="0 0 120 76" className={`w-24 h-15 drop-shadow-[0_6px_6px_rgba(0,0,0,0.48)] ${flipClass}`}>
        <ellipse cx="60" cy="67" rx="44" ry="6" fill="rgba(0,0,0,0.4)" />
        {/* Canopy & Passenger Hood */}
        <path d="M56 17 L94 13 L97 35 L56 35 Z" fill="#0369a1" stroke="#0c4a6e" strokeWidth="1.8" />
        <path d="M56 35 L97 35 L92 52 L58 52 Z" fill="#38bdf8" stroke="#0c4a6e" strokeWidth="1.8" />
        <rect x="61" y="38" width="24" height="10" rx="2" fill="#e0f2fe" />
        {/* Rider Pedaling Behind */}
        <circle cx="34" cy="19" r="6" fill="#e5a77e" />
        <path d="M27 16 L41 16 L38 11 L30 11 Z" fill="#92400e" />
        <path d="M27 26 L40 26 L43 45 L27 45 Z" fill="#1e293b" />
        <line x1="34" y1="44" x2="57" y2="51" stroke="#334155" strokeWidth="3.2" />
        {/* Spoked Wheels */}
        <circle cx="28" cy="57" r="11" fill="none" stroke="#0f172a" strokeWidth="3.2" />
        <circle cx="28" cy="57" r="2.5" fill="#475569" />
        <circle cx="84" cy="57" r="11" fill="none" stroke="#0f172a" strokeWidth="3.2" />
        <circle cx="84" cy="57" r="2.5" fill="#475569" />
      </svg>
    );
  };

  return (
    <div style={{ transform: `rotate(${angleDeg}deg)` }} className="origin-center">
      {renderSvg()}
    </div>
  );
};
