import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { SideJobDef } from '../types/game';
import { formatRupiah } from '../data/gameData';
import { useUiGamepadAction } from '../hooks/useGamepad';

interface FishingModalProps {
  energy: number;
  onCatchFish: (fishId: 'ikan_mas' | 'ikan_dewa', energyUsed: number) => void;
  onClose: () => void;
}

export const FishingModal: React.FC<FishingModalProps> = ({ energy, onCatchFish, onClose }) => {
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'biting' | 'result'>('idle');
  const [message, setMessage] = useState('Klik atau tekan [A] untuk melempar kail (energi -3%)');
  const [caughtCount, setCaughtCount] = useState(0);

  useEffect(() => {
    if (phase !== 'waiting') return;
    const waitMs = 1500 + Math.random() * 2000;
    const t = setTimeout(() => {
      setPhase('biting');
      setMessage('PELAMPUNG TENGGELAM! Klik / Tekan [A] sekarang!');
    }, waitMs);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'biting') return;
    const missTimer = setTimeout(() => {
      setPhase('result');
      setMessage('Terlambat! Ikannya lepas dari kail.');
    }, 1550);
    return () => clearTimeout(missTimer);
  }, [phase]);

  const handleAction = () => {
    if (phase === 'idle' || phase === 'result') {
      if (energy < 5) {
        setMessage('Energi Arga terlalu rendah! Ngopi atau istirahat dulu.');
        return;
      }
      setPhase('waiting');
      setMessage('Menunggu ikan menyambar umpan...');
    } else if (phase === 'waiting') {
      setPhase('result');
      setMessage('Terlalu cepat menarik kail! Ikannya kabur.');
    } else if (phase === 'biting') {
      const isLegend = Math.random() < 0.22;
      const fishId = isLegend ? 'ikan_dewa' : 'ikan_mas';
      setCaughtCount((c) => c + 1);
      onCatchFish(fishId, 3);
      setPhase('result');
      setMessage(
        isLegend
          ? 'LUAR BIASA! Arga mendapat Ikan Dewa (Kancra Bodas) langka!'
          : 'Berhasil! Arga mendapat Ikan Mas segar untuk dijual/dimasak.'
      );
    }
  };

  useUiGamepadAction((btn) => {
    if (btn === 'A') {
      handleAction();
    }
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="font-display text-xl font-bold text-amber-300">MEMANCING DI SUNGAI</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Klik area sungai atau tekan [A] untuk melempar kail (energi -3%). Saat pelampung tenggelam, cepat tarik!
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-emerald-300 font-bold font-mono-num">ENERGI {Math.round(energy)}%</div>
            <div className="text-xs text-amber-300 font-bold font-mono-num">Ikan didapat: {caughtCount}</div>
          </div>
        </div>

        {/* River Visual Area */}
        <button
          onClick={handleAction}
          className="relative w-full h-64 rounded-xl border-2 border-amber-300/70 overflow-hidden bg-gradient-to-b from-sky-400 via-teal-600 to-cyan-800 flex flex-col items-center justify-center cursor-pointer group"
        >
          {/* Greenery bank */}
          <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-emerald-700 to-emerald-600 border-b-4 border-stone-400" />
          {/* Ripples */}
          <div
            className={`relative z-10 w-8 h-8 rounded-full border-2 border-white/80 flex items-center justify-center transition-transform ${
              phase === 'biting' ? 'translate-y-4 scale-125 bg-rose-500 animate-ping' : 'bg-rose-500'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white" />
          </div>
          <div className="relative z-10 mt-6 px-5 py-2 rounded-lg bg-slate-950/75 text-amber-100 font-bold text-sm">
            {message}
          </div>
        </button>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm"
          >
            Selesai [B]
          </button>
        </div>
      </div>
    </div>
  );
};

interface FruitPickingModalProps {
  alreadyPicked: boolean;
  onFinishPick: (count: number) => void;
  onClose: () => void;
}

export const FruitPickingModal: React.FC<FruitPickingModalProps> = ({
  alreadyPicked,
  onFinishPick,
  onClose,
}) => {
  const [fruits, setFruits] = useState(() =>
    alreadyPicked
      ? []
      : [
          { id: 'f1', label: 'Kelapa', emoji: '🥥', picked: false },
          { id: 'f2', label: 'Kelapa', emoji: '🥥', picked: false },
          { id: 'f3', label: 'Jambu Air', emoji: '🍎', picked: false },
          { id: 'f4', label: 'Jambu Air', emoji: '🍎', picked: false },
          { id: 'f5', label: 'Mangga', emoji: '🥭', picked: false },
          { id: 'f6', label: 'Mangga', emoji: '🥭', picked: false },
          { id: 'f7', label: 'Alpukat', emoji: '🥑', picked: false },
          { id: 'f8', label: 'Alpukat', emoji: '🥑', picked: false },
        ]
  );

  const pickedCount = fruits.filter((f) => f.picked).length;

  const handlePick = (id: string) => {
    setFruits((prev) => prev.map((f) => (f.id === id ? { ...f, picked: true } : f)));
  };

  useUiGamepadAction((btn) => {
    if (btn !== 'A') return;
    if (alreadyPicked) {
      onClose();
      return;
    }
    const nextUnpicked = fruits.find((f) => !f.picked);
    if (nextUnpicked) {
      handlePick(nextUnpicked.id);
    } else if (pickedCount > 0) {
      onFinishPick(pickedCount);
    }
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-display text-xl font-bold text-amber-300">KEBUN BUAH KAMPUNG</h2>
            <p className="text-xs text-slate-300">
              {alreadyPicked
                ? 'Buah matang hari ini sudah dipanen. Pohon akan berbuah lagi besok pagi!'
                : 'Klik buah yang sudah matang dan berkilau untuk dimasukkan ke keranjang Arga.'}
            </p>
          </div>
          <div className="font-mono-num text-sm font-bold text-amber-300">
            {pickedCount}/{fruits.length} Dipetik
          </div>
        </div>

        <div className="rounded-xl border-2 border-amber-300/70 bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-600 p-6 min-h-[240px] flex flex-col justify-between">
          {alreadyPicked ? (
            <div className="flex-1 flex items-center justify-center text-slate-900 font-bold text-sm bg-white/80 rounded-xl p-4">
              Semua buah matang sudah masuk stok Warung Arga hari ini.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 my-auto">
              {fruits.map((f) => (
                <button
                  key={f.id}
                  disabled={f.picked}
                  onClick={() => handlePick(f.id)}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center ${
                    f.picked
                      ? 'bg-emerald-900/30 border-emerald-700/40 opacity-35 scale-90'
                      : 'bg-white/90 border-amber-400 hover:scale-105 shadow-lg cursor-pointer'
                  }`}
                >
                  <span className="text-3xl">{f.emoji}</span>
                  <span className="text-[11px] font-bold text-slate-900 mt-1">{f.label}</span>
                  {!f.picked && <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={() => {
              if (!alreadyPicked && pickedCount > 0) {
                onFinishPick(pickedCount);
              } else {
                onClose();
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm"
          >
            {pickedCount > 0 && !alreadyPicked ? `Simpan ${pickedCount} Buah ke Stok` : 'Selesai [B]'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SideJobModalProps {
  job: SideJobDef;
  onComplete: (job: SideJobDef) => void;
  onClose: () => void;
}

export const SideJobModal: React.FC<SideJobModalProps> = ({ job, onComplete, onClose }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const done = stepIdx >= job.steps.length;

  useUiGamepadAction((btn) => {
    if (btn === 'A') {
      if (!done) setStepIdx((s) => s + 1);
      else onComplete(job);
    }
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 shadow-2xl">
        <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
          Kerja Sampingan · {job.locationLabel}
        </div>
        <h2 className="font-display text-xl font-bold text-amber-100 mb-2">{job.title}</h2>
        <p className="text-xs text-slate-300 mb-4">{job.description}</p>

        <div className="space-y-2 mb-5">
          {job.steps.map((st, idx) => {
            const isCompleted = idx < stepIdx;
            const isCurrent = idx === stepIdx;
            return (
              <div
                key={idx}
                className={`px-4 py-3 rounded-xl border flex items-center justify-between text-xs ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
                    : isCurrent
                    ? 'bg-amber-400/20 border-amber-400 text-amber-100 font-bold'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400'
                }`}
              >
                <span>
                  {idx + 1}. {st}
                </span>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs bg-slate-950 rounded-xl p-3 border border-slate-800 mb-4">
          <span className="text-slate-300">
            Upah: <strong className="text-emerald-300 font-mono-num">{formatRupiah(job.reward)}</strong>
          </span>
          <span className="text-slate-300">
            Energi: <strong className="text-amber-300 font-mono-num">-{job.energyCost}%</strong>
          </span>
          <span className="text-slate-300">
            Durasi: <strong className="text-slate-100 font-mono-num">{job.durationMinutes} mnt</strong>
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
          >
            Batal [B]
          </button>
          {!done ? (
            <button
              onClick={() => setStepIdx((s) => s + 1)}
              className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm"
            >
              Kerjakan Langkah {stepIdx + 1}/{job.steps.length} [A]
            </button>
          ) : (
            <button
              onClick={() => onComplete(job)}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
            >
              Ambil Upah {formatRupiah(job.reward)} [A]
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
