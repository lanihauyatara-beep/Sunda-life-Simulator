import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Footprints,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { useUiGamepadAction } from '../hooks/useGamepad';

export type KaulinanGameId = 'congklak' | 'egrang' | 'sondah';

export interface KaulinanRewardPayload {
  gameId: KaulinanGameId;
  gameTitle: string;
  resultLabel: string;
  points: number;
  bonusMoney: number;
}

interface KaulinanModalProps {
  minutesOfDay: number;
  totalActivityPoints: number;
  onAwardPoints: (payload: KaulinanRewardPayload) => void;
  onClose: () => void;
}

// ============================================================================
// 1. CONGKLAK SUNDA (7 Lubang x 2 + 2 Lumbung, 3 Biji Awal -> Cepat & Taktis)
// Indexing counter-clockwise:
//   0..6   = Lubang Arga (bawah, kiri -> kanan)
//   7      = Lumbung Arga (kanan)
//   8..14  = Lubang Teh Sari (atas, kanan -> kiri; tampil kiri->kanan: 14..8)
//   15     = Lumbung Teh Sari (kiri)
// ============================================================================
const INITIAL_CONGKLAK = (): number[] => [
  3, 3, 3, 3, 3, 3, 3, 0,
  3, 3, 3, 3, 3, 3, 3, 0,
];

interface CongklakGameProps {
  onComplete: (payload: KaulinanRewardPayload) => void;
}

const CongklakGame: React.FC<CongklakGameProps> = ({ onComplete }) => {
  const [board, setBoard] = useState<number[]>(() => INITIAL_CONGKLAK());
  const [turn, setTurn] = useState<'arga' | 'rival'>('arga');
  const [isAnimating, setIsAnimating] = useState(false);
  const [activePit, setActivePit] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState('Giliran Arga: pilih salah satu lubang bawah (1–7) untuk menebar biji.');
  const [finished, setFinished] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const checkAndFinishIfEmpty = useCallback(
    (curr: number[]): { over: boolean; finalBoard: number[] } => {
      const argaSum = curr.slice(0, 7).reduce((a, b) => a + b, 0);
      const rivalSum = curr.slice(8, 15).reduce((a, b) => a + b, 0);
      if (argaSum === 0 || rivalSum === 0) {
        const next = [...curr];
        next[7] += argaSum;
        next[15] += rivalSum;
        for (let i = 0; i < 7; i++) next[i] = 0;
        for (let i = 8; i < 15; i++) next[i] = 0;
        return { over: true, finalBoard: next };
      }
      return { over: false, finalBoard: curr };
    },
    []
  );

  const finishMatch = useCallback(
    (finalBoard: number[]) => {
      setBoard(finalBoard);
      setFinished(true);
      setIsAnimating(false);
      setActivePit(null);
      const argaScore = finalBoard[7];
      const rivalScore = finalBoard[15];
      let resultLabel = 'Seri';
      let points = 20;
      let bonusMoney = 4000;
      if (argaScore > rivalScore) {
        resultLabel = `Arga Menang (${argaScore} vs ${rivalScore})`;
        points = 26;
        bonusMoney = 7500;
      } else if (argaScore < rivalScore) {
        resultLabel = `Partisipasi Selesai (${argaScore} vs ${rivalScore})`;
        points = 16;
        bonusMoney = 2500;
      } else {
        resultLabel = `Imbang (${argaScore} vs ${rivalScore})`;
      }
      setStatusMsg(`${resultLabel}! Lumbung terisi penuh dan poin berhasil diraih.`);
      if (!rewarded) {
        setRewarded(true);
        onComplete({
          gameId: 'congklak',
          gameTitle: 'Congklak Sunda',
          resultLabel,
          points,
          bonusMoney,
        });
      }
    },
    [onComplete, rewarded]
  );

  const runSowMove = useCallback(
    (startPit: number, actor: 'arga' | 'rival', currentBoard: number[]) => {
      const seeds = currentBoard[startPit];
      if (seeds <= 0) return;

      setIsAnimating(true);
      const working = [...currentBoard];
      working[startPit] = 0;
      setBoard([...working]);
      setActivePit(startPit);
      soundEngine.click();

      const steps: number[] = [];
      let pos = startPit;
      for (let s = 0; s < seeds; s++) {
        pos = (pos + 1) % 16;
        if (actor === 'arga' && pos === 15) pos = 0;
        if (actor === 'rival' && pos === 7) pos = 8;
        steps.push(pos);
      }

      let stepIdx = 0;
      const stepTick = () => {
        if (!mountedRef.current) return;
        if (stepIdx < steps.length) {
          const target = steps[stepIdx];
          working[target] += 1;
          setBoard([...working]);
          setActivePit(target);
          soundEngine.click();
          stepIdx += 1;
          timerRef.current = window.setTimeout(stepTick, 130);
          return;
        }

        const lastPit = steps[steps.length - 1];
        const ownHome = actor === 'arga' ? 7 : 15;
        const isOwnSide = actor === 'arga' ? lastPit >= 0 && lastPit <= 6 : lastPit >= 8 && lastPit <= 14;

        let nextTurn: 'arga' | 'rival' = actor === 'arga' ? 'rival' : 'arga';
        let note = '';

        // 1. Landed in own Lumbung -> Bonus turn!
        if (lastPit === ownHome) {
          nextTurn = actor;
          soundEngine.confirm();
          note =
            actor === 'arga'
              ? 'Pas di Lumbung Arga! Arga dapat giliran jalan lagi.'
              : 'Biji Teh Sari masuk Lumbung, Teh Sari jalan lagi...';
        } else if (isOwnSide && working[lastPit] === 1) {
          // 2. Némbak (capture opposite pit if non-empty)
          const oppositePit = 14 - lastPit;
          if (working[oppositePit] > 0) {
            const captured = working[oppositePit] + working[lastPit];
            working[oppositePit] = 0;
            working[lastPit] = 0;
            working[ownHome] += captured;
            soundEngine.confirm();
            note =
              actor === 'arga'
                ? `Némbak jitu! Arga merebut ${captured} biji ke Lumbung.`
                : `Teh Sari némbak ${captured} biji ke Lumbungnya.`;
          }
        }

        const check = checkAndFinishIfEmpty(working);
        if (check.over) {
          finishMatch(check.finalBoard);
          return;
        }

        setBoard([...working]);
        setActivePit(null);
        setIsAnimating(false);
        setTurn(nextTurn);
        if (note) {
          setStatusMsg(note);
        } else {
          setStatusMsg(
            nextTurn === 'arga'
              ? 'Giliran Arga: pilih lubang bawah (1–7).'
              : 'Giliran Teh Sari sedang menebar biji...'
          );
        }
      };

      timerRef.current = window.setTimeout(stepTick, 140);
    },
    [checkAndFinishIfEmpty, finishMatch]
  );

  // Rival AI turn scheduler
  useEffect(() => {
    if (finished || isAnimating || turn !== 'rival') return;

    const validPits: number[] = [];
    for (let i = 8; i <= 14; i++) {
      if (board[i] > 0) validPits.push(i);
    }
    if (validPits.length === 0) {
      const check = checkAndFinishIfEmpty(board);
      if (check.over) finishMatch(check.finalBoard);
      return;
    }

    // Smart AI choice: landing on 15 > némbak > largest pit
    let chosen = validPits[0];
    const freeTurnPit = validPits.find((p) => p + board[p] === 15);
    if (freeTurnPit !== undefined) {
      chosen = freeTurnPit;
    } else {
      chosen = validPits.reduce((best, p) => (board[p] > board[best] ? p : best), validPits[0]);
    }

    timerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      runSowMove(chosen, 'rival', board);
    }, 520);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [board, checkAndFinishIfEmpty, finishMatch, finished, isAnimating, runSowMove, turn]);

  const handlePlayerPick = (pitIdx: number) => {
    if (finished || isAnimating || turn !== 'arga') return;
    if (board[pitIdx] <= 0) return;
    runSowMove(pitIdx, 'arga', board);
  };

  const handleReset = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    soundEngine.click();
    setBoard(INITIAL_CONGKLAK());
    setTurn('arga');
    setIsAnimating(false);
    setActivePit(null);
    setFinished(false);
    setRewarded(false);
    setStatusMsg('Permainan Congklak baru dimulai! Pilih lubang bawah (1–7).');
  };

  // Keyboard 1-7 shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '7') {
        handlePlayerPick(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useUiGamepadAction((btn) => {
    if (btn === 'A' && turn === 'arga' && !isAnimating && !finished) {
      const firstNonEmpty = [0, 1, 2, 3, 4, 5, 6].find((i) => board[i] > 0);
      if (firstNonEmpty !== undefined) handlePlayerPick(firstNonEmpty);
    }
  });

  const rivalPitsOrder = [14, 13, 12, 11, 10, 9, 8];
  const argaPitsOrder = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <span>
          Lawan: <strong className="text-amber-200">Teh Sari</strong> · Klik lubang bawah atau tekan angka{' '}
          <strong className="text-amber-200">1–7</strong>
        </span>
        <span className="font-mono-num font-bold text-emerald-300">
          Menang: +26 Poin · Selesai: +16 Poin
        </span>
      </div>

      {/* Wooden Congklak Board */}
      <div className="rounded-2xl bg-gradient-to-b from-amber-900/80 via-amber-950/90 to-stone-950 border-2 border-amber-500/60 p-3 sm:p-4 shadow-xl">
        <div className="grid grid-cols-9 gap-1.5 sm:gap-2 items-center">
          {/* Rival Lumbung (Left, idx 15) */}
          <div
            className={`row-span-2 h-full min-h-[116px] rounded-2xl border-2 flex flex-col items-center justify-center p-1.5 transition-all ${
              activePit === 15
                ? 'bg-rose-500/30 border-rose-300 scale-105'
                : 'bg-stone-950/85 border-amber-700/60'
            }`}
          >
            <div className="text-[10px] font-bold text-slate-400 text-center">Lumbung Sari</div>
            <div className="font-mono-num text-2xl font-extrabold text-amber-200 my-1">{board[15]}</div>
            <div className="flex flex-wrap justify-center gap-0.5 max-w-[44px]">
              {Array.from({ length: Math.min(board[15], 12) }).map((_, idx) => (
                <span key={idx} className="w-1.5 h-1.5 rounded-full bg-amber-300/85" />
              ))}
            </div>
          </div>

          {/* Top Row: Rival Pits 14..8 */}
          {rivalPitsOrder.map((pit) => (
            <div
              key={pit}
              className={`h-14 sm:h-16 rounded-xl border flex flex-col items-center justify-center transition-all ${
                activePit === pit
                  ? 'bg-rose-500/30 border-rose-300 scale-105'
                  : 'bg-stone-950/70 border-amber-800/60'
              }`}
            >
              <div className="font-mono-num text-base font-extrabold text-amber-100">{board[pit]}</div>
              <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 max-w-[34px]">
                {Array.from({ length: Math.min(board[pit], 6) }).map((_, idx) => (
                  <span key={idx} className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                ))}
              </div>
            </div>
          ))}

          {/* Arga Lumbung (Right, idx 7) */}
          <div
            className={`row-span-2 h-full min-h-[116px] rounded-2xl border-2 flex flex-col items-center justify-center p-1.5 transition-all ${
              activePit === 7
                ? 'bg-emerald-500/35 border-emerald-300 scale-105'
                : 'bg-emerald-950/60 border-emerald-500/60'
            }`}
          >
            <div className="text-[10px] font-bold text-emerald-300 text-center">Lumbung Arga</div>
            <div className="font-mono-num text-2xl font-extrabold text-emerald-300 my-1">{board[7]}</div>
            <div className="flex flex-wrap justify-center gap-0.5 max-w-[44px]">
              {Array.from({ length: Math.min(board[7], 12) }).map((_, idx) => (
                <span key={idx} className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              ))}
            </div>
          </div>

          {/* Bottom Row: Arga Pits 0..6 */}
          {argaPitsOrder.map((pit, idx) => {
            const canPick = !finished && !isAnimating && turn === 'arga' && board[pit] > 0;
            return (
              <button
                key={pit}
                type="button"
                disabled={!canPick}
                onClick={() => handlePlayerPick(pit)}
                className={`h-14 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                  activePit === pit
                    ? 'bg-amber-400/35 border-amber-200 scale-105'
                    : canPick
                    ? 'bg-slate-900/90 hover:bg-amber-400/20 border-amber-400/75 cursor-pointer'
                    : 'bg-slate-950/60 border-slate-800 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="font-mono-num text-base font-extrabold text-white">{board[pit]}</div>
                <div className="text-[9px] font-mono-num text-amber-300 font-bold">[{idx + 1}]</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status & Restart */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs">
        <span className={finished ? 'text-emerald-300 font-bold' : 'text-amber-100 font-semibold'}>
          {statusMsg}
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Main Ulang</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 2. EGRANG BAMBU (Balap Keseimbangan Bambu 100m)
// ============================================================================
interface EgrangGameProps {
  onComplete: (payload: KaulinanRewardPayload) => void;
}

const EgrangGame: React.FC<EgrangGameProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [distance, setDistance] = useState(0);
  const [balance, setBalance] = useState(0); // -100 .. +100
  const [timeLeft, setTimeLeft] = useState(30.0);
  const [falls, setFalls] = useState(0);
  const [stumbleMs, setStumbleMs] = useState(0);
  const [strideToggle, setStrideToggle] = useState(false);

  const stateRef = useRef({
    phase: 'ready' as 'ready' | 'playing' | 'finished',
    distance: 0,
    balance: 0,
    timeLeft: 30.0,
    falls: 0,
    stumbleMs: 0,
    driftBias: 1,
    rewardSent: false,
  });

  const finishEgrang = useCallback(
    (finalDist: number, finalFalls: number) => {
      if (stateRef.current.rewardSent) return;
      stateRef.current.rewardSent = true;
      stateRef.current.phase = 'finished';
      setPhase('finished');

      const distRounded = Math.min(100, Math.round(finalDist));
      let points = 12;
      let bonusMoney = 2000;
      let resultLabel = `Jarak ${distRounded}m (${finalFalls}x goyah)`;
      if (distRounded >= 100) {
        points = 28;
        bonusMoney = 8000;
        resultLabel = `Finis 100m Sempurna!`;
      } else if (distRounded >= 50) {
        points = 18;
        bonusMoney = 4500;
        resultLabel = `Berhasil menempuh ${distRounded}m`;
      }

      onComplete({
        gameId: 'egrang',
        gameTitle: 'Balap Egrang Bambu',
        resultLabel,
        points,
        bonusMoney,
      });
    },
    [onComplete]
  );

  const startEgrang = () => {
    soundEngine.confirm();
    stateRef.current = {
      phase: 'playing',
      distance: 0,
      balance: 0,
      timeLeft: 30.0,
      falls: 0,
      stumbleMs: 0,
      driftBias: Math.random() < 0.5 ? -1 : 1,
      rewardSent: false,
    };
    setPhase('playing');
    setDistance(0);
    setBalance(0);
    setTimeLeft(30.0);
    setFalls(0);
    setStumbleMs(0);
  };

  // Physics loop (60ms)
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = window.setInterval(() => {
      const s = stateRef.current;
      if (s.phase !== 'playing') return;

      s.timeLeft = Math.max(0, s.timeLeft - 0.06);
      if (s.stumbleMs > 0) {
        s.stumbleMs = Math.max(0, s.stumbleMs - 60);
      } else {
        if (Math.random() < 0.05) s.driftBias *= -1;
        const speedFactor = 1 + (s.distance / 100) * 0.45;
        const wind = (s.driftBias * 1.45 + (Math.random() - 0.5) * 2.2) * speedFactor;
        s.balance = Math.max(-100, Math.min(100, s.balance + wind));

        if (Math.abs(s.balance) >= 95) {
          soundEngine.error();
          s.falls += 1;
          s.balance = 0;
          s.stumbleMs = 850;
        }
      }

      setDistance(s.distance);
      setBalance(s.balance);
      setTimeLeft(s.timeLeft);
      setFalls(s.falls);
      setStumbleMs(s.stumbleMs);

      if (s.timeLeft <= 0) {
        finishEgrang(s.distance, s.falls);
      }
    }, 60);
    return () => window.clearInterval(id);
  }, [finishEgrang, phase]);

  const nudgeBalance = useCallback((dir: -1 | 1) => {
    const s = stateRef.current;
    if (s.phase !== 'playing' || s.stumbleMs > 0) return;
    soundEngine.click();
    s.balance = Math.max(-94, Math.min(94, s.balance + dir * 20));
    setBalance(s.balance);
  }, []);

  const stepForward = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'ready') {
      startEgrang();
      return;
    }
    if (s.phase !== 'playing' || s.stumbleMs > 0) return;

    if (Math.abs(s.balance) > 68) {
      soundEngine.error();
      s.balance += (s.balance >= 0 ? 1 : -1) * 14;
      setBalance(s.balance);
      return;
    }

    soundEngine.click();
    s.distance = Math.min(100, s.distance + 7.5);
    s.balance = Math.max(-94, Math.min(94, s.balance + (Math.random() - 0.5) * 18));
    setDistance(s.distance);
    setBalance(s.balance);
    setStrideToggle((v) => !v);

    if (s.distance >= 100) {
      finishEgrang(100, s.falls);
    }
  }, [finishEgrang]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        nudgeBalance(-1);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        nudgeBalance(1);
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        e.preventDefault();
        stepForward();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nudgeBalance, stepForward]);

  useUiGamepadAction((btn) => {
    if (btn === 'LB' || btn === 'DPAD_LEFT') nudgeBalance(-1);
    else if (btn === 'RB' || btn === 'DPAD_RIGHT') nudgeBalance(1);
    else if (btn === 'A') stepForward();
  });

  const inSafeZone = Math.abs(balance) <= 58;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <span>
          Jaga keseimbangan di zona hijau lalu klik <strong className="text-amber-200">Melangkah [Spasi]</strong> hingga 100m!
        </span>
        <span className="font-mono-num font-bold text-emerald-300">
          Finis 100m: +28 Poin · ≥50m: +18 Poin
        </span>
      </div>

      {/* Field Visual Arena */}
      <div className="relative rounded-2xl border-2 border-amber-400/50 bg-gradient-to-b from-sky-500/25 via-emerald-900/40 to-emerald-950/90 p-4 overflow-hidden">
        {/* Top Metrics */}
        <div className="flex items-center justify-between text-xs font-mono-num mb-3">
          <div className="text-amber-200 font-bold">
            Jarak: <span className="text-base text-white">{Math.round(distance)}m</span> / 100m
          </div>
          <div className="text-slate-300">Goyah: {falls}x</div>
          <div className={`font-bold ${timeLeft <= 6 ? 'text-rose-300' : 'text-emerald-300'}`}>
            Waktu: {timeLeft.toFixed(1)}s
          </div>
        </div>

        {/* Track + Arga on Bamboo Stilts */}
        <div className="relative h-28 rounded-xl bg-gradient-to-b from-sky-900/40 to-emerald-950 border border-emerald-500/30 flex items-end px-4 pb-2 overflow-hidden">
          <div className="absolute right-4 top-2 bottom-2 w-1 border-r-2 border-dashed border-amber-300/70" />
          <div className="absolute right-5 top-1 text-[10px] font-bold text-amber-300">FINIS</div>

          <div
            style={{
              left: `${Math.min(86, 6 + (distance / 100) * 78)}%`,
              transform: `rotate(${(balance / 100) * 26}deg)`,
            }}
            className="relative transition-[left] duration-100 origin-bottom flex flex-col items-center"
          >
            {/* Arga on stilts */}
            <svg viewBox="0 0 48 64" className="w-12 h-16">
              {/* Twin bamboo poles */}
              <line x1="16" y1="24" x2={strideToggle ? '12' : '15'} y2="62" stroke="#ca8a04" strokeWidth="3.2" strokeLinecap="round" />
              <line x1="32" y1="24" x2={strideToggle ? '33' : '36'} y2="62" stroke="#eab308" strokeWidth="3.2" strokeLinecap="round" />
              {/* Footrests */}
              <line x1="13" y1="42" x2="20" y2="42" stroke="#78350f" strokeWidth="2.5" />
              <line x1="28" y1="42" x2="35" y2="42" stroke="#78350f" strokeWidth="2.5" />
              {/* Body */}
              <rect x="17" y="16" width="14" height="16" rx="4" fill="#dc2626" />
              {/* Legs on stilts */}
              <line x1="20" y1="32" x2="17" y2="42" stroke="#1e293b" strokeWidth="3" />
              <line x1="28" y1="32" x2="31" y2="42" stroke="#1e293b" strokeWidth="3" />
              {/* Head + iket */}
              <circle cx="24" cy="10" r="6" fill="#fde68a" />
              <path d="M18 8 Q24 3 30 8" stroke="#111827" strokeWidth="3" fill="none" />
            </svg>
          </div>
        </div>

        {/* Distance Bar */}
        <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden mt-2.5">
          <div
            style={{ width: `${Math.min(100, distance)}%` }}
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-100"
          />
        </div>

        {/* Balance Meter */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300">Miring Kiri</span>
            <span className={inSafeZone ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
              {stumbleMs > 0
                ? 'Hampir Jatuh! Menyeimbangkan ulang...'
                : inSafeZone
                ? 'Seimbang — Ayo Melangkah!'
                : 'Awas Miring! Tahan Arah Lawan'}
            </span>
            <span className="text-slate-300">Miring Kanan</span>
          </div>
          <div className="relative w-full h-5 rounded-full bg-slate-950 border border-slate-700 overflow-hidden">
            {/* Safe green zone (-58..+58 => 21%..79%) */}
            <div className="absolute inset-y-0 left-[21%] right-[21%] bg-emerald-500/25 border-x border-emerald-400/50" />
            <div
              style={{ left: `${50 + balance * 0.45}%` }}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow ${
                inSafeZone ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      {phase === 'ready' ? (
        <button
          type="button"
          onClick={startEgrang}
          className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm"
        >
          Mulai Balap Egrang Bambu [Spasi / A]
        </button>
      ) : phase === 'playing' ? (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => nudgeBalance(-1)}
            className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 text-amber-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kiri [←]</span>
          </button>
          <button
            type="button"
            onClick={stepForward}
            disabled={stumbleMs > 0}
            className="py-3 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 active:scale-95 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg"
          >
            <Footprints className="w-4 h-4" />
            <span>Melangkah</span>
          </button>
          <button
            type="button"
            onClick={() => nudgeBalance(1)}
            className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 text-amber-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5"
          >
            <span>Kanan [→]</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEgrang}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/50 text-amber-200 font-bold text-xs flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Main Balap Egrang Lagi</span>
        </button>
      )}
    </div>
  );
};

// ============================================================================
// 3. SONDAH / ENGKLEK KAMPUNG (3 Babak Lempar Kojo & Lompat 8 Petak)
// ============================================================================
interface SondahGameProps {
  onComplete: (payload: KaulinanRewardPayload) => void;
}

const SONDAH_TARGET_BOXES = [2, 5, 7];

const SondahGame: React.FC<SondahGameProps> = ({ onComplete }) => {
  const [roundIdx, setRoundIdx] = useState(0); // 0..2
  const [phase, setPhase] = useState<'aim' | 'hop' | 'finished'>('aim');
  const [aimPos, setAimPos] = useState(50);
  const [hopSequence, setHopSequence] = useState<number[]>([]);
  const [hopCursor, setHopCursor] = useState(0);
  const [currentBox, setCurrentBox] = useState<number | null>(null);
  const [note, setNote] = useState('Babak 1/3: Lempar batu kojo tepat ke zona hijau!');
  const [rewarded, setRewarded] = useState(false);

  const aimDirRef = useRef(1);
  const targetKojoBox = SONDAH_TARGET_BOXES[roundIdx] ?? 2;

  useEffect(() => {
    if (phase !== 'aim') return;
    const id = window.setInterval(() => {
      setAimPos((prev) => {
        let next = prev + aimDirRef.current * 4.2;
        if (next >= 98) {
          next = 98;
          aimDirRef.current = -1;
        } else if (next <= 2) {
          next = 2;
          aimDirRef.current = 1;
        }
        return next;
      });
    }, 35);
    return () => window.clearInterval(id);
  }, [phase]);

  const handleThrowKojo = useCallback(() => {
    if (phase !== 'aim') return;
    if (aimPos >= 30 && aimPos <= 70) {
      soundEngine.confirm();
      const seq = [1, 2, 3, 4, 5, 6, 7, 8].filter((b) => b !== targetKojoBox);
      setHopSequence(seq);
      setHopCursor(0);
      setCurrentBox(null);
      setPhase('hop');
      setNote(`Kojo tepat di Petak ${targetKojoBox}! Lompati kotak berurutan tanpa menginjak Petak ${targetKojoBox}.`);
    } else {
      soundEngine.error();
      setNote('Lemparan meleset sedikit! Arahkan ke zona hijau tengah lalu lempar lagi.');
    }
  }, [aimPos, phase, targetKojoBox]);

  const handleStepBox = useCallback(
    (boxNum: number) => {
      if (phase !== 'hop') return;
      if (boxNum === targetKojoBox) {
        soundEngine.error();
        setNote(`Petak ${targetKojoBox} ada batu kojo! Jangan diinjak, lompati ke Petak ${hopSequence[hopCursor]}.`);
        return;
      }
      const expectedBox = hopSequence[hopCursor];
      if (boxNum !== expectedBox) {
        soundEngine.error();
        setNote(`Urutan lompatan sekarang adalah Petak ${expectedBox}!`);
        return;
      }

      soundEngine.click();
      setCurrentBox(boxNum);
      const nextCursor = hopCursor + 1;
      if (nextCursor >= hopSequence.length) {
        // Cleared this round!
        if (roundIdx + 1 >= SONDAH_TARGET_BOXES.length) {
          setPhase('finished');
          setNote('Hebat pisan! Semua 3 babak Sondah berhasil dilompati dengan lincah!');
          if (!rewarded) {
            setRewarded(true);
            onComplete({
              gameId: 'sondah',
              gameTitle: 'Sondah (Engklek Sunda)',
              resultLabel: 'Menamatkan 3 Babak Sondah',
              points: 24,
              bonusMoney: 6500,
            });
          }
        } else {
          const nextRound = roundIdx + 1;
          soundEngine.confirm();
          setRoundIdx(nextRound);
          setPhase('aim');
          setCurrentBox(null);
          setNote(`Babak ${nextRound + 1}/3: Sekarang lempar kojo ke Petak ${SONDAH_TARGET_BOXES[nextRound]}!`);
        }
      } else {
        setHopCursor(nextCursor);
      }
    },
    [hopCursor, hopSequence, onComplete, phase, rewarded, roundIdx, targetKojoBox]
  );

  const handleReset = () => {
    soundEngine.click();
    setRoundIdx(0);
    setPhase('aim');
    setAimPos(50);
    setHopSequence([]);
    setHopCursor(0);
    setCurrentBox(null);
    setRewarded(false);
    setNote('Babak 1/3: Lempar batu kojo tepat ke zona hijau!');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && phase === 'aim') {
        e.preventDefault();
        handleThrowKojo();
      } else if (phase === 'hop' && e.key >= '1' && e.key <= '8') {
        handleStepBox(Number(e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleStepBox, handleThrowKojo, phase]);

  useUiGamepadAction((btn) => {
    if (btn !== 'A') return;
    if (phase === 'aim') {
      handleThrowKojo();
    } else if (phase === 'hop') {
      const nextBox = hopSequence[hopCursor];
      if (nextBox) handleStepBox(nextBox);
    }
  });

  const expectedBox = phase === 'hop' ? hopSequence[hopCursor] : null;

  const renderBox = (num: number, wide = false) => {
    const hasKojo = phase !== 'aim' && num === targetKojoBox;
    const isNext = expectedBox === num;
    const isHere = currentBox === num;
    const alreadyPassed = phase === 'hop' && hopSequence.indexOf(num) !== -1 && hopSequence.indexOf(num) < hopCursor;

    return (
      <button
        key={num}
        type="button"
        disabled={phase !== 'hop'}
        onClick={() => handleStepBox(num)}
        className={`${
          wide ? 'col-span-2' : 'col-span-1'
        } h-12 sm:h-14 rounded-xl border-2 font-mono-num font-extrabold text-sm flex items-center justify-center gap-1.5 transition-all ${
          hasKojo
            ? 'bg-amber-950/70 border-amber-500/70 text-amber-300'
            : isHere
            ? 'bg-emerald-500 text-slate-950 border-white scale-105 shadow-lg'
            : isNext
            ? 'bg-amber-400/25 border-amber-300 text-amber-100 ring-2 ring-amber-300/60 cursor-pointer'
            : alreadyPassed
            ? 'bg-emerald-950/45 border-emerald-500/45 text-emerald-300'
            : 'bg-slate-900/90 border-slate-700 text-slate-300'
        }`}
      >
        <span>{num === 8 ? '8 Gunung' : `Petak ${num}`}</span>
        {hasKojo && <span className="text-xs">(Kojo)</span>}
        {isHere && <Footprints className="w-4 h-4" />}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <span>
          Babak <strong className="text-amber-200">{roundIdx + 1}/3</strong> · Target Kojo:{' '}
          <strong className="text-amber-200">Petak {targetKojoBox}</strong>
        </span>
        <span className="font-mono-num font-bold text-emerald-300">Selesai 3 Babak: +24 Poin</span>
      </div>

      {/* Aim Bar in Aim Phase */}
      {phase === 'aim' && (
        <div className="rounded-xl bg-slate-950 border border-amber-400/50 p-3 space-y-2.5">
          <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-amber-400" />
            <span>Arahkan Lemparan Kojo ke Petak {targetKojoBox}</span>
          </div>
          <div className="relative w-full h-6 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
            <div className="absolute inset-y-0 left-[30%] right-[30%] bg-emerald-500/35 border-x border-emerald-400" />
            <div
              style={{ left: `${aimPos}%` }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-300 border-2 border-white shadow"
            />
          </div>
          <button
            type="button"
            onClick={handleThrowKojo}
            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm"
          >
            Lempar Kojo Sekarang! [Spasi / A]
          </button>
        </div>
      )}

      {/* Chalk Hopscotch Court (top-down 8 -> 1 layout) */}
      <div className="rounded-2xl border-2 border-dashed border-amber-300/45 bg-stone-950/90 p-3">
        <div className="max-w-sm mx-auto grid grid-cols-2 gap-2">
          {renderBox(8, true)}
          {renderBox(6)}
          {renderBox(7)}
          {renderBox(5, true)}
          {renderBox(3)}
          {renderBox(4)}
          {renderBox(2, true)}
          {renderBox(1, true)}
        </div>
      </div>

      {/* Status & Restart */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs">
        <span className={phase === 'finished' ? 'text-emerald-300 font-bold' : 'text-amber-100 font-semibold'}>
          {note}
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Main Ulang</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN KAULINAN MODAL SHELL
// ============================================================================
export const KaulinanModal: React.FC<KaulinanModalProps> = ({
  minutesOfDay,
  totalActivityPoints,
  onAwardPoints,
  onClose,
}) => {
  const isOutdoorDaytime = minutesOfDay >= 6 * 60 && minutesOfDay < 18 * 60;
  const isCongklakOpen = minutesOfDay >= 6 * 60 && minutesOfDay < 22 * 60;

  const [activeGame, setActiveGame] = useState<KaulinanGameId>('congklak');
  const [lastReward, setLastReward] = useState<KaulinanRewardPayload | null>(null);
  const [sessionPoints, setSessionPoints] = useState(0);

  const handleGameComplete = useCallback(
    (payload: KaulinanRewardPayload) => {
      setLastReward(payload);
      setSessionPoints((s) => s + payload.points);
      onAwardPoints(payload);
    },
    [onAwardPoints]
  );

  useUiGamepadAction((btn) => {
    const order: KaulinanGameId[] = ['congklak', 'egrang', 'sondah'];
    if (btn === 'DPAD_UP' || btn === 'DPAD_DOWN') {
      const idx = order.indexOf(activeGame);
      setActiveGame(order[(idx + 1) % order.length]);
    }
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-4 sm:p-6 shadow-[0_0_60px_rgba(245,158,11,0.3)] max-h-[94dvh] flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kaulinan Urang Sunda · Tambah Poin Keaktifan</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-amber-50">
              Arena Permainan Tradisional
            </h2>
          </div>

          <div className="text-right font-mono-num text-xs">
            <div className="text-slate-400">Total Poin Arga</div>
            <div className="text-base font-extrabold text-amber-300">
              {totalActivityPoints} Poin
              {sessionPoints > 0 && (
                <span className="text-emerald-300 ml-1.5">(+{sessionPoints} sesi ini)</span>
              )}
            </div>
          </div>
        </div>

        {/* Game Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-3">
          {[
            { id: 'congklak' as const, label: 'Congklak', sub: '06.00–22.00 WIB' },
            { id: 'egrang' as const, label: 'Egrang Bambu', sub: '06.00–18.00 WIB' },
            { id: 'sondah' as const, label: 'Sondah', sub: '06.00–18.00 WIB' },
          ].map((g) => {
            const active = activeGame === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  soundEngine.click();
                  setActiveGame(g.id);
                }}
                className={`py-2 px-3 rounded-lg text-center transition-colors ${
                  active
                    ? 'bg-amber-400 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800 font-semibold'
                }`}
              >
                <div className="text-xs sm:text-sm leading-tight">{g.label}</div>
                <div className={`text-[10px] ${active ? 'text-amber-950' : 'text-slate-400'}`}>{g.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Recent Reward Banner */}
        {lastReward && (
          <div className="mb-3 rounded-xl bg-emerald-950/60 border border-emerald-400/70 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>
                <strong>{lastReward.gameTitle}</strong> — {lastReward.resultLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono-num font-extrabold text-amber-300">
              <Trophy className="w-4 h-4" />
              <span>
                +{lastReward.points} Poin · +Rp {lastReward.bonusMoney.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}

        {/* Active Game Stage */}
        <div className="flex-1 overflow-y-auto pr-1 mb-4">
          {activeGame === 'congklak' &&
            (isCongklakOpen ? (
              <CongklakGame onComplete={handleGameComplete} />
            ) : (
              <div className="rounded-xl bg-slate-950 border border-amber-400/40 p-5 text-center text-xs text-slate-300 space-y-2">
                <div className="text-sm font-bold text-amber-200">
                  Sudah Larut Malam (Congklak dibuka pukul 06.00–22.00 WIB)
                </div>
                <p>Warga sudah beristirahat malam. Kembali bermain esok pagi mulai pukul 06.00 WIB!</p>
              </div>
            ))}
          {activeGame === 'egrang' &&
            (isOutdoorDaytime ? (
              <EgrangGame onComplete={handleGameComplete} />
            ) : (
              <div className="rounded-xl bg-slate-950 border border-amber-400/40 p-5 text-center text-xs text-slate-300 space-y-2">
                <div className="text-sm font-bold text-amber-200">
                  Balap Egrang Bambu Berlangsung Pagi–Sore (06.00–18.00 WIB)
                </div>
                <p>
                  Lapangan sudah gelap sehingga balap Egrang istirahat sampai besok pagi. Malam ini Arga bisa bermain{' '}
                  <strong>Congklak</strong> di teras atau menonton <strong>Wayang Golek</strong> di Bumi Ageung!
                </p>
              </div>
            ))}
          {activeGame === 'sondah' &&
            (isOutdoorDaytime ? (
              <SondahGame onComplete={handleGameComplete} />
            ) : (
              <div className="rounded-xl bg-slate-950 border border-amber-400/40 p-5 text-center text-xs text-slate-300 space-y-2">
                <div className="text-sm font-bold text-amber-200">
                  Permainan Sondah Berlangsung Pagi–Sore (06.00–18.00 WIB)
                </div>
                <p>
                  Garis kapur petak Sondah di lapangan dimainkan saat hari terang (06.00–18.00 WIB). Malam ini Arga tetap bisa main{' '}
                  <strong>Congklak</strong> hingga pukul 22.00 WIB!
                </p>
              </div>
            ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
        >
          Tutup Arena Permainan [B]
        </button>
      </div>
    </div>
  );
};
