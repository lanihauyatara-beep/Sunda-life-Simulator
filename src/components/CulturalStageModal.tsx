import React, { useEffect, useState } from 'react';
import { Music, Sparkles, Theater, Trophy, Volume2, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { useUiGamepadAction } from '../hooks/useGamepad';

interface CulturalStageModalProps {
  onCompleteActivity: (
    mode: 'angklung' | 'wayang',
    title: string,
    rewardMoney: number,
    rewardPoints: number
  ) => void;
  onClose: () => void;
}

const ANGKLUNG_PIPES = [
  { idx: 0, label: 'Da', keyHint: '1', pitchLabel: 'Do / D4', heightClass: 'h-32', color: 'from-amber-300 to-amber-600' },
  { idx: 1, label: 'Mi', keyHint: '2', pitchLabel: 'Re / E4', heightClass: 'h-28', color: 'from-amber-200 to-amber-500' },
  { idx: 2, label: 'Na', keyHint: '3', pitchLabel: 'Fa / G4', heightClass: 'h-24', color: 'from-yellow-200 to-amber-500' },
  { idx: 3, label: 'Ti', keyHint: '4', pitchLabel: 'Sol / A4', heightClass: 'h-20', color: 'from-amber-200 to-yellow-600' },
  { idx: 4, label: 'La', keyHint: '5', pitchLabel: 'Si / C5', heightClass: 'h-16', color: 'from-yellow-100 to-amber-400' },
];

const MELODY_PRESETS = [
  {
    id: 'manuk_dadali',
    title: 'Manuk Dadali (Motif Priangan)',
    notes: [0, 1, 2, 4, 3, 2, 1, 0],
    rewardMoney: 22000,
    rewardPoints: 24,
  },
  {
    id: 'es_lilin',
    title: 'Es Lilin (Cianjuran)',
    notes: [2, 3, 4, 3, 2, 1, 0, 1],
    rewardMoney: 20000,
    rewardPoints: 22,
  },
];

const WAYANG_SCENES = [
  {
    speaker: 'Ki Dalang & Si Cepot',
    sundaLine: '"Sampurasun dulur! Hirup di lembur téh kudu Silih Asah, Silih Asih, jeung Silih Asuh."',
    indoLine: 'Salam sejahtera saudara! Hidup di kampung harus saling mengasah ilmu, mengasihi, dan membimbing.',
    question: 'Naon hartina falsafah Sunda "Silih Asih" dina kahirupan warga?',
    options: [
      { label: 'Saling menyayangi & menolong antar tetangga tanpa pamrih', isCorrect: true },
      { label: 'Saling bersaing keras demi keuntungan pribadi semata', isCorrect: false },
    ],
  },
  {
    speaker: 'Semar Badranaya',
    sundaLine: '"Jalma nu Cageur, Bageur, Bener, Pinter, tur Singer bakal mawa berkah ka salembur."',
    indoLine: 'Orang yang sehat, baik hati, jujur benar, cerdas, dan cekatan akan membawa berkah sekampung.',
    question: 'Sikep dagang Warung Arga nu luyu jeung "Bener & Bageur" nyaéta...',
    options: [
      { label: 'Menimbang jujur, harga wajar, serta menyapa warga dengan ramah', isCorrect: true },
      { label: 'Menaikkan harga setinggi-tingginya saat cuaca hujan lebat', isCorrect: false },
    ],
  },
];

export const CulturalStageModal: React.FC<CulturalStageModalProps> = ({
  onCompleteActivity,
  onClose,
}) => {
  const [tab, setTab] = useState<'angklung' | 'wayang'>('angklung');
  const [shakingPipe, setShakingPipe] = useState<number | null>(null);
  const [presetIdx, setPresetIdx] = useState(0);
  const [melodyStep, setMelodyStep] = useState(0);
  const [angklungDone, setAngklungDone] = useState(false);

  const [wayangStep, setWayangStep] = useState(0);
  const [wayangFeedback, setWayangFeedback] = useState<string | null>(null);
  const [wayangDone, setWayangDone] = useState(false);
  const [cepotWave, setCepotWave] = useState(false);

  const activePreset = MELODY_PRESETS[presetIdx];
  const expectedNote = activePreset.notes[melodyStep];

  const handlePlayPipe = (idx: number) => {
    soundEngine.playAngklungNote(idx);
    setShakingPipe(idx);
    window.setTimeout(() => {
      setShakingPipe((prev) => (prev === idx ? null : prev));
    }, 360);

    if (angklungDone) return;
    if (idx === expectedNote) {
      const nextStep = melodyStep + 1;
      if (nextStep >= activePreset.notes.length) {
        setMelodyStep(nextStep);
        setAngklungDone(true);
        soundEngine.angklungSuccess();
      } else {
        setMelodyStep(nextStep);
      }
    }
  };

  useEffect(() => {
    if (tab === 'wayang') {
      soundEngine.playWayangGong();
    }
  }, [tab]);

  useEffect(() => {
    if (tab !== 'angklung') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '5') {
        handlePlayPipe(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useUiGamepadAction((btn) => {
    if (btn === 'LB' || btn === 'RB') {
      setTab((prev) => (prev === 'angklung' ? 'wayang' : 'angklung'));
    } else if (btn === 'A' && tab === 'angklung') {
      if (angklungDone) {
        onCompleteActivity(
          'angklung',
          `Pentas Angklung: ${activePreset.title}`,
          activePreset.rewardMoney,
          activePreset.rewardPoints
        );
      } else if (typeof expectedNote === 'number') {
        handlePlayPipe(expectedNote);
      }
    }
  });

  const activeWayang = WAYANG_SCENES[wayangStep];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-4 sm:p-6 shadow-[0_0_60px_rgba(245,158,11,0.3)] max-h-[94dvh] flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Saung Seni Sunda · Bumi Ageung
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-amber-50">
              Pentas Angklung &amp; Wayang Golek
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTab('angklung')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                tab === 'angklung'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Main Angklung</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('wayang')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                tab === 'wayang'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Theater className="w-3.5 h-3.5" />
              <span>Wayang Golek</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-4">
          {tab === 'angklung' && (
            <>
              <div className="bg-slate-950/90 border border-amber-400/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-amber-200">{activePreset.title}</div>
                  <div className="text-[11px] text-slate-400">
                    Ketuk bambu Angklung atau tekan angka <strong>1–5</strong> / <strong>[A]</strong> mengikuti not menyala!
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {MELODY_PRESETS.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPresetIdx(i);
                        setMelodyStep(0);
                        setAngklungDone(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        presetIdx === i
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {i === 0 ? 'Manuk Dadali' : 'Es Lilin'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Melody guide bar */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-center gap-1.5 flex-wrap">
                {activePreset.notes.map((n, stepIdx) => {
                  const done = stepIdx < melodyStep;
                  const active = stepIdx === melodyStep && !angklungDone;
                  return (
                    <span
                      key={stepIdx}
                      className={`px-2.5 py-1 rounded-lg font-mono-num text-xs font-bold border transition-all ${
                        done
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                          : active
                          ? 'bg-amber-400 text-slate-950 border-white scale-110 shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {ANGKLUNG_PIPES[n].label} ({n + 1})
                    </span>
                  );
                })}
              </div>

              {/* Interactive Bamboo Angklung Rack */}
              <div className="bg-gradient-to-b from-amber-950/35 to-slate-950 border border-amber-400/35 rounded-2xl p-4">
                <div className="grid grid-cols-5 gap-2 sm:gap-3 items-end min-h-[170px]">
                  {ANGKLUNG_PIPES.map((pipe) => {
                    const isNext = !angklungDone && expectedNote === pipe.idx;
                    const isShaking = shakingPipe === pipe.idx;
                    return (
                      <button
                        key={pipe.idx}
                        type="button"
                        onClick={() => handlePlayPipe(pipe.idx)}
                        className={`flex flex-col items-center justify-end p-2 rounded-xl border transition-all ${
                          isNext
                            ? 'bg-amber-400/20 border-amber-300 ring-2 ring-amber-300/60'
                            : 'bg-slate-900/75 border-slate-800 hover:border-amber-400/50'
                        }`}
                      >
                        {/* Bamboo dual-tube visual */}
                        <div className={`flex items-end gap-1 mb-2 ${isShaking ? 'sunda-angklung-shake' : ''}`}>
                          <div
                            className={`w-3.5 sm:w-4 ${pipe.heightClass} rounded-t-full bg-gradient-to-b ${pipe.color} border border-amber-900 shadow-inner relative`}
                          >
                            <div className="absolute inset-x-0 top-1/3 h-0.5 bg-amber-950/40" />
                            <div className="absolute inset-x-0 top-2/3 h-0.5 bg-amber-950/40" />
                          </div>
                          <div
                            className={`w-2.5 sm:w-3 ${pipe.heightClass} scale-y-75 origin-bottom rounded-t-full bg-gradient-to-b ${pipe.color} border border-amber-900 opacity-90`}
                          />
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-amber-800 mb-1.5" />
                        <div className="text-sm font-display font-bold text-amber-100">{pipe.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono-num">[{pipe.keyHint}] {pipe.pitchLabel}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {angklungDone && (
                <div className="bg-emerald-950/50 border border-emerald-400/70 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                    <span>
                      <strong>Merdu pisan!</strong> Warga bertepuk tangan &amp; memberi saweran{' '}
                      <strong className="text-amber-300">Rp {activePreset.rewardMoney.toLocaleString('id-ID')}</strong> (+
                      {activePreset.rewardPoints} Poin).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onCompleteActivity(
                        'angklung',
                        `Pentas Angklung: ${activePreset.title}`,
                        activePreset.rewardMoney,
                        activePreset.rewardPoints
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Ambil Hadiah &amp; Selesai [A]</span>
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'wayang' && (
            <>
              {/* Animated Wayang Golek Stage */}
              <div className="relative rounded-2xl overflow-hidden border border-amber-400/50 bg-gradient-to-b from-amber-950/60 via-slate-950 to-stone-950 p-4 flex flex-col items-center">
                {/* Blencong oil-lamp warm glow */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full pointer-events-none mix-blend-screen opacity-60"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(217,119,6,0.2) 55%, transparent 75%)',
                  }}
                />
                <div className="relative z-10 flex items-end justify-center gap-8 sm:gap-12 pt-2">
                  {/* Si Cepot (Astrajingga) SVG Wayang Golek */}
                  <div
                    onClick={() => {
                      soundEngine.playWayangGong();
                      setCepotWave((v) => !v);
                    }}
                    className="cursor-pointer flex flex-col items-center"
                    title="Ketuk Si Cepot untuk membunyikan Goong"
                  >
                    <svg
                      viewBox="0 0 80 110"
                      className={`w-20 h-28 sunda-wayang-sway transition-transform ${
                        cepotWave ? 'scale-105' : ''
                      }`}
                    >
                      {/* Campurit wooden rod */}
                      <rect x="38" y="84" width="4" height="24" rx="1.5" fill="#78350f" />
                      {/* Batik sarung / dodot */}
                      <path d="M24 62 Q40 58 56 62 L58 88 Q40 92 22 88 Z" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />
                      <path d="M26 70 Q40 67 54 70" stroke="#f59e0b" strokeWidth="1.4" fill="none" />
                      <path d="M24 79 Q40 76 56 79" stroke="#fbbf24" strokeWidth="1.2" fill="none" />
                      {/* Reddish-amber Cepot Jacket */}
                      <path d="M27 38 Q40 34 53 38 L55 64 Q40 66 25 64 Z" fill="#b91c1c" stroke="#450a0a" strokeWidth="1.2" />
                      {/* Wooden arms */}
                      <path d="M26 41 L14 57 L18 60 L28 46 Z" fill="#dc2626" stroke="#450a0a" strokeWidth="1" />
                      <path d="M54 41 L66 53 L62 57 L52 46 Z" fill="#dc2626" stroke="#450a0a" strokeWidth="1" />
                      {/* Iconic Crimson Cepot Head */}
                      <ellipse cx="40" cy="24" rx="11" ry="12" fill="#dc2626" stroke="#450a0a" strokeWidth="1.2" />
                      {/* Sundanese Iket Udeng */}
                      <path d="M28 19 Q40 8 52 19 L50 11 Q40 5 30 11 Z" fill="#111827" stroke="#f59e0b" strokeWidth="1" />
                      <path d="M29 16 Q40 14 51 16" stroke="#f59e0b" strokeWidth="2.2" fill="none" />
                      {/* Expressive Cepot eyes & cheerful wide grin */}
                      <circle cx="35.5" cy="23" r="2.2" fill="#ffffff" />
                      <circle cx="44.5" cy="23" r="2.2" fill="#ffffff" />
                      <circle cx="35.8" cy="23" r="1.1" fill="#0f172a" />
                      <circle cx="44.2" cy="23" r="1.1" fill="#0f172a" />
                      <path d="M35 29 Q40 33 45 29" stroke="#fef3c7" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    </svg>
                    <span className="text-[10px] font-bold text-amber-300 mt-0.5">Si Cepot</span>
                  </div>

                  {/* Semar Badranaya SVG Wayang Golek */}
                  <div
                    onClick={() => soundEngine.playWayangGong()}
                    className="cursor-pointer flex flex-col items-center"
                    title="Ketuk Semar untuk membunyikan Goong"
                  >
                    <svg viewBox="0 0 80 110" className="w-20 h-28 sunda-wayang-sway">
                      <rect x="38" y="84" width="4" height="24" rx="1.5" fill="#78350f" />
                      <path d="M21 58 Q40 54 59 58 L61 88 Q40 92 19 88 Z" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.2" />
                      <path d="M23 40 Q40 36 57 40 L59 62 Q40 65 21 62 Z" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
                      <path d="M22 43 L12 56 L16 59 L25 47 Z" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
                      <path d="M58 43 L68 56 L64 59 L55 47 Z" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
                      {/* Semar wise white-painted face & topknot */}
                      <circle cx="40" cy="25" r="11.5" fill="#fefce8" stroke="#475569" strokeWidth="1.2" />
                      <circle cx="33" cy="12" r="4.2" fill="#1e293b" />
                      <path d="M34 22 Q36 20.5 38 22" stroke="#1e293b" strokeWidth="1.4" fill="none" />
                      <path d="M42 22 Q44 20.5 46 22" stroke="#1e293b" strokeWidth="1.4" fill="none" />
                      <path d="M35 29 Q40 32 45 29" stroke="#7c2d12" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-200 mt-0.5">Semar Badranaya</span>
                  </div>
                </div>

                {/* Gebog Cau (Banana trunk stage base) */}
                <div className="w-full h-4 rounded-full bg-gradient-to-b from-lime-800 to-emerald-950 border border-lime-600/50 mt-1 shadow-inner" />

                <button
                  type="button"
                  onClick={() => soundEngine.playWayangGong()}
                  className="mt-2.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-400/50 text-amber-200 text-[11px] font-bold flex items-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tabuh Goong &amp; Kendang</span>
                </button>
              </div>

              {/* Dalang Dialogue & Wisdom Quiz */}
              {!wayangDone ? (
                <div className="bg-slate-950 border border-amber-400/50 rounded-xl p-3.5 space-y-2.5">
                  <div className="text-xs font-bold text-amber-300">
                    Babak {wayangStep + 1}/{WAYANG_SCENES.length} · {activeWayang.speaker}
                  </div>
                  <p className="text-xs italic text-amber-100">{activeWayang.sundaLine}</p>
                  <p className="text-[11px] text-emerald-300">{activeWayang.indoLine}</p>
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-xs font-bold text-white mb-2">{activeWayang.question}</div>
                    <div className="space-y-1.5">
                      {activeWayang.options.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (opt.isCorrect) {
                              soundEngine.playWayangGong();
                              setWayangFeedback(null);
                              if (wayangStep + 1 >= WAYANG_SCENES.length) {
                                setWayangDone(true);
                                soundEngine.angklungSuccess();
                              } else {
                                setWayangStep((s) => s + 1);
                              }
                            } else {
                              soundEngine.error();
                              setWayangFeedback('Kurang pas euy! Coba pilih nilai luhur Sunda nu leuwih merenah.');
                            }
                          }}
                          className="w-full p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-400/40 text-left text-xs text-amber-50 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {wayangFeedback && (
                      <p className="text-[11px] text-rose-300 font-semibold mt-2">{wayangFeedback}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/50 border border-emerald-400/70 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                    <span>
                      <strong>Lakon Wayang Golek Sukses!</strong> Warga sangat terhibur: hadiah{' '}
                      <strong className="text-amber-300">Rp 25.000</strong> (+26 Poin Budaya).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onCompleteActivity(
                        'wayang',
                        'Pagelaran Wayang Golek Si Cepot',
                        25000,
                        26
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Ambil Hadiah &amp; Selesai</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
        >
          Tutup Panggung Seni [B]
        </button>
      </div>
    </div>
  );
};
