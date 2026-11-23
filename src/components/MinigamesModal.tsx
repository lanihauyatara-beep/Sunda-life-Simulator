import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { SideJobDef } from '../types/game';
import { formatRupiah } from '../data/gameData';
import { useUiGamepadAction } from '../hooks/useGamepad';
import { soundEngine } from '../utils/audio';

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
        soundEngine.error();
        setMessage('Energi Arga terlalu rendah! Ngopi atau istirahat dulu.');
        return;
      }
      soundEngine.splashWater();
      setPhase('waiting');
      setMessage('Menunggu ikan menyambar umpan...');
    } else if (phase === 'waiting') {
      soundEngine.splashWater();
      setPhase('result');
      setMessage('Terlalu cepat menarik kail! Ikannya kabur.');
    } else if (phase === 'biting') {
      soundEngine.splashWater();
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
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-3.5 sm:p-5 shadow-2xl max-h-[94dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-2.5 sm:mb-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-amber-300">MEMANCING DI SUNGAI</h2>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
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
          className="relative w-full h-40 sm:h-64 rounded-xl border-2 border-amber-300/70 overflow-hidden bg-gradient-to-b from-sky-400 via-teal-600 to-cyan-800 flex flex-col items-center justify-center cursor-pointer group"
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
    soundEngine.rustleLeaves();
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
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-3.5 sm:p-5 shadow-2xl max-h-[94dvh] overflow-y-auto">
        <div className="flex items-start justify-between mb-2.5 sm:mb-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-amber-300">KEBUN BUAH KAMPUNG</h2>
            <p className="text-[11px] sm:text-xs text-slate-300">
              {alreadyPicked
                ? 'Buah matang hari ini sudah dipanen. Pohon akan berbuah lagi besok pagi!'
                : 'Klik buah yang sudah matang dan berkilau untuk dimasukkan ke keranjang Arga.'}
            </p>
          </div>
          <div className="font-mono-num text-sm font-bold text-amber-300 shrink-0">
            {pickedCount}/{fruits.length} Dipetik
          </div>
        </div>

        <div className="rounded-xl border-2 border-amber-300/70 bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-600 p-3 sm:p-6 min-h-[150px] sm:min-h-[240px] flex flex-col justify-between">
          {alreadyPicked ? (
            <div className="flex-1 flex items-center justify-center text-slate-900 font-bold text-sm bg-white/80 rounded-xl p-4">
              Semua buah matang sudah masuk stok Warung Arga hari ini.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-3 my-auto">
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

interface SideJobTaskSpot {
  id: string;
  label: string;
  dirtyEmoji: string;
  cleanEmoji: string;
  cleanLabel: string;
}

interface SideJobStageConfig {
  actionHint: string;
  toolEmoji: string;
  surfaceClass: string;
  soundType: 'water' | 'leaves' | 'wood' | 'confirm';
  spots: SideJobTaskSpot[];
}

function getSideJobStages(jobId: string): SideJobStageConfig[] {
  if (jobId === 'bersih_masjid') {
    return [
      {
        actionHint: 'Klik atau usap daun kering di pelataran Masjid untuk menyapu:',
        toolEmoji: '🧹',
        surfaceClass: 'from-stone-700 via-stone-600 to-emerald-900',
        soundType: 'leaves',
        spots: [
          { id: 'm1', label: 'Daun Kering', dirtyEmoji: '🍂', cleanEmoji: '✨', cleanLabel: 'Disapu' },
          { id: 'm2', label: 'Ranting', dirtyEmoji: '🌿', cleanEmoji: '✨', cleanLabel: 'Disapu' },
          { id: 'm3', label: 'Daun Kering', dirtyEmoji: '🍁', cleanEmoji: '✨', cleanLabel: 'Disapu' },
          { id: 'm4', label: 'Debu Teras', dirtyEmoji: '💨', cleanEmoji: '✨', cleanLabel: 'Bersih' },
          { id: 'm5', label: 'Daun Kering', dirtyEmoji: '🍂', cleanEmoji: '✨', cleanLabel: 'Disapu' },
          { id: 'm6', label: 'Sampah Ranting', dirtyEmoji: '🪵', cleanEmoji: '✨', cleanLabel: 'Bersih' },
        ],
      },
      {
        actionHint: 'Klik atau seret kain pel di lantai mushola & rapikan sajadah:',
        toolEmoji: '🧽',
        surfaceClass: 'from-emerald-950 via-teal-900 to-emerald-800',
        soundType: 'water',
        spots: [
          { id: 'm7', label: 'Lantai Bernoda', dirtyEmoji: '👣', cleanEmoji: '🫧', cleanLabel: 'Dipél' },
          { id: 'm8', label: 'Sajadah Kusut', dirtyEmoji: '🧶', cleanEmoji: '🕌', cleanLabel: 'Rapi' },
          { id: 'm9', label: 'Genangan Air', dirtyEmoji: '💧', cleanEmoji: '✨', cleanLabel: 'Kering' },
          { id: 'm10', label: 'Lantai Berdebu', dirtyEmoji: '👣', cleanEmoji: '🫧', cleanLabel: 'Dipél' },
          { id: 'm11', label: 'Mukena Lipat', dirtyEmoji: '🧺', cleanEmoji: '✨', cleanLabel: 'Tertata' },
          { id: 'm12', label: 'Sajadah Imam', dirtyEmoji: '🧶', cleanEmoji: '🕌', cleanLabel: 'Rapi' },
        ],
      },
      {
        actionHint: 'Bersihkan keran & bak wudhu hingga air mengalir jernih:',
        toolEmoji: '🪣',
        surfaceClass: 'from-cyan-950 via-sky-900 to-slate-900',
        soundType: 'water',
        spots: [
          { id: 'm13', label: 'Bak Wudhu', dirtyEmoji: '🧼', cleanEmoji: '💧', cleanLabel: 'Jernih' },
          { id: 'm14', label: 'Keran Kiri', dirtyEmoji: '🚰', cleanEmoji: '✨', cleanLabel: 'Bersih' },
          { id: 'm15', label: 'Keran Tengah', dirtyEmoji: '🚰', cleanEmoji: '✨', cleanLabel: 'Bersih' },
          { id: 'm16', label: 'Keran Kanan', dirtyEmoji: '🚰', cleanEmoji: '✨', cleanLabel: 'Bersih' },
        ],
      },
    ];
  }

  if (jobId === 'bersih_bale') {
    return [
      {
        actionHint: 'Pel lantai papan kayu Bale Patemon hingga bersih mengkilap:',
        toolEmoji: '🧽',
        surfaceClass: 'from-amber-950 via-stone-800 to-amber-900',
        soundType: 'water',
        spots: [
          { id: 'b1', label: 'Noda Tanah', dirtyEmoji: '👣', cleanEmoji: '✨', cleanLabel: 'Kinclong' },
          { id: 'b2', label: 'Debu Papan', dirtyEmoji: '💨', cleanEmoji: '🫧', cleanLabel: 'Dipél' },
          { id: 'b3', label: 'Bekas Kopi', dirtyEmoji: '💧', cleanEmoji: '✨', cleanLabel: 'Kinclong' },
          { id: 'b4', label: 'Noda Sepatu', dirtyEmoji: '👣', cleanEmoji: '🫧', cleanLabel: 'Dipél' },
          { id: 'b5', label: 'Debu Sudut', dirtyEmoji: '💨', cleanEmoji: '✨', cleanLabel: 'Bersih' },
          { id: 'b6', label: 'Papan Tengah', dirtyEmoji: '👣', cleanEmoji: '✨', cleanLabel: 'Kinclong' },
        ],
      },
      {
        actionHint: 'Klik gulungan tikar pandan untuk menggelar tempat duduk warga:',
        toolEmoji: '🧺',
        surfaceClass: 'from-amber-900 via-yellow-950 to-stone-900',
        soundType: 'leaves',
        spots: [
          { id: 'b7', label: 'Tikar Utara', dirtyEmoji: '🗞️', cleanEmoji: '🟩', cleanLabel: 'Terhampar' },
          { id: 'b8', label: 'Tikar Timur', dirtyEmoji: '🗞️', cleanEmoji: '🟩', cleanLabel: 'Terhampar' },
          { id: 'b9', label: 'Tikar Selatan', dirtyEmoji: '🗞️', cleanEmoji: '🟩', cleanLabel: 'Terhampar' },
          { id: 'b10', label: 'Tikar Barat', dirtyEmoji: '🗞️', cleanEmoji: '🟩', cleanLabel: 'Terhampar' },
        ],
      },
      {
        actionHint: 'Lap gong & seperangkat gamelan degung di sudut ruangan:',
        toolEmoji: '✨',
        surfaceClass: 'from-slate-900 via-amber-950 to-slate-950',
        soundType: 'confirm',
        spots: [
          { id: 'b11', label: 'Gong Besar', dirtyEmoji: '🪘', cleanEmoji: '✨', cleanLabel: 'Berkilau' },
          { id: 'b12', label: 'Bonang', dirtyEmoji: '🔔', cleanEmoji: '✨', cleanLabel: 'Berkilau' },
          { id: 'b13', label: 'Saron', dirtyEmoji: '🎶', cleanEmoji: '✨', cleanLabel: 'Berkilau' },
          { id: 'b14', label: 'Kendang', dirtyEmoji: '🥁', cleanEmoji: '✨', cleanLabel: 'Bersih' },
        ],
      },
    ];
  }

  if (jobId === 'material_ujang') {
    return [
      {
        actionHint: 'Klik batang bambu tali untuk menyusunnya rapi di sisi Pos Ronda:',
        toolEmoji: '🎋',
        surfaceClass: 'from-emerald-950 via-stone-800 to-amber-950',
        soundType: 'wood',
        spots: [
          { id: 'u1', label: 'Bambu 1', dirtyEmoji: '🎋', cleanEmoji: '✅', cleanLabel: 'Tersusun' },
          { id: 'u2', label: 'Bambu 2', dirtyEmoji: '🎋', cleanEmoji: '✅', cleanLabel: 'Tersusun' },
          { id: 'u3', label: 'Bambu 3', dirtyEmoji: '🎋', cleanEmoji: '✅', cleanLabel: 'Tersusun' },
          { id: 'u4', label: 'Bambu 4', dirtyEmoji: '🎋', cleanEmoji: '✅', cleanLabel: 'Tersusun' },
          { id: 'u5', label: 'Bambu 5', dirtyEmoji: '🎋', cleanEmoji: '✅', cleanLabel: 'Tersusun' },
          { id: 'u6', label: 'Bambu 6', dirtyEmoji: '🎋', cleanEmoji: '✅', cleanLabel: 'Tersusun' },
        ],
      },
      {
        actionHint: 'Muat tumpukan bata merah ke gerobak kerja Mang Ujang:',
        toolEmoji: '🧱',
        surfaceClass: 'from-orange-950 via-stone-800 to-stone-900',
        soundType: 'wood',
        spots: [
          { id: 'u7', label: 'Bata (4 bh)', dirtyEmoji: '🧱', cleanEmoji: '🛒', cleanLabel: 'Di Gerobak' },
          { id: 'u8', label: 'Bata (4 bh)', dirtyEmoji: '🧱', cleanEmoji: '🛒', cleanLabel: 'Di Gerobak' },
          { id: 'u9', label: 'Bata (4 bh)', dirtyEmoji: '🧱', cleanEmoji: '🛒', cleanLabel: 'Di Gerobak' },
          { id: 'u10', label: 'Bata (4 bh)', dirtyEmoji: '🧱', cleanEmoji: '🛒', cleanLabel: 'Di Gerobak' },
          { id: 'u11', label: 'Bata (4 bh)', dirtyEmoji: '🧱', cleanEmoji: '🛒', cleanLabel: 'Di Gerobak' },
        ],
      },
      {
        actionHint: 'Pasang dan kencangkan ikatan tiang penyangga atap rumbia:',
        toolEmoji: '🔨',
        surfaceClass: 'from-amber-950 via-slate-800 to-slate-900',
        soundType: 'confirm',
        spots: [
          { id: 'u12', label: 'Tiang Depan', dirtyEmoji: '🪵', cleanEmoji: '🔩', cleanLabel: 'Kokoh' },
          { id: 'u13', label: 'Tiang Kiri', dirtyEmoji: '🪵', cleanEmoji: '🔩', cleanLabel: 'Kokoh' },
          { id: 'u14', label: 'Tiang Kanan', dirtyEmoji: '🪵', cleanEmoji: '🔩', cleanLabel: 'Kokoh' },
          { id: 'u15', label: 'Atap Rumbia', dirtyEmoji: '🛖', cleanEmoji: '✅', cleanLabel: 'Terpasang' },
        ],
      },
    ];
  }

  if (jobId === 'tumbuk_saung') {
    return [
      {
        actionHint: 'Tumbuk gabah padi di lubang lisung kayu dengan alu:',
        toolEmoji: '🪵',
        surfaceClass: 'from-amber-950 via-yellow-900 to-stone-900',
        soundType: 'wood',
        spots: [
          { id: 't1', label: 'Gabah 1', dirtyEmoji: '🌾', cleanEmoji: '🍚', cleanLabel: 'Tertumbuk' },
          { id: 't2', label: 'Gabah 2', dirtyEmoji: '🌾', cleanEmoji: '🍚', cleanLabel: 'Tertumbuk' },
          { id: 't3', label: 'Gabah 3', dirtyEmoji: '🌾', cleanEmoji: '🍚', cleanLabel: 'Tertumbuk' },
          { id: 't4', label: 'Gabah 4', dirtyEmoji: '🌾', cleanEmoji: '🍚', cleanLabel: 'Tertumbuk' },
          { id: 't5', label: 'Gabah 5', dirtyEmoji: '🌾', cleanEmoji: '🍚', cleanLabel: 'Tertumbuk' },
          { id: 't6', label: 'Gabah 6', dirtyEmoji: '🌾', cleanEmoji: '🍚', cleanLabel: 'Tertumbuk' },
        ],
      },
      {
        actionHint: 'Tampi beras di atas nyiru bambu untuk memisahkan sekam:',
        toolEmoji: '🧺',
        surfaceClass: 'from-yellow-950 via-amber-900 to-stone-900',
        soundType: 'leaves',
        spots: [
          { id: 't7', label: 'Sekam Kiri', dirtyEmoji: '💨', cleanEmoji: '✨', cleanLabel: 'Bersih' },
          { id: 't8', label: 'Sekam Tengah', dirtyEmoji: '💨', cleanEmoji: '✨', cleanLabel: 'Bersih' },
          { id: 't9', label: 'Sekam Kanan', dirtyEmoji: '💨', cleanEmoji: '✨', cleanLabel: 'Bersih' },
          { id: 't10', label: 'Beras Pulen', dirtyEmoji: '🌾', cleanEmoji: '🍚', cleanLabel: 'Siap' },
        ],
      },
      {
        actionHint: 'Tutup rapat dan kunci palang pintu lumbung padi:',
        toolEmoji: '🔒',
        surfaceClass: 'from-stone-900 via-amber-950 to-slate-950',
        soundType: 'confirm',
        spots: [
          { id: 't11', label: 'Jendela Lumbung', dirtyEmoji: '🪟', cleanEmoji: '✅', cleanLabel: 'Tutup' },
          { id: 't12', label: 'Palang Kayu', dirtyEmoji: '🔓', cleanEmoji: '🔒', cleanLabel: 'Terkunci' },
          { id: 't13', label: 'Gembok Pintu', dirtyEmoji: '🗝️', cleanEmoji: '🔒', cleanLabel: 'Aman' },
        ],
      },
    ];
  }

  if (jobId === 'bungkus_peuyeum') {
    return [
      {
        actionHint: 'Lap daun pisang muda dengan kain bersih sebelum dipakai membungkus:',
        toolEmoji: '🧻',
        surfaceClass: 'from-emerald-950 via-green-900 to-slate-900',
        soundType: 'leaves',
        spots: [
          { id: 'p1', label: 'Daun 1', dirtyEmoji: '🍃', cleanEmoji: '🌿', cleanLabel: 'Bersih' },
          { id: 'p2', label: 'Daun 2', dirtyEmoji: '🍃', cleanEmoji: '🌿', cleanLabel: 'Bersih' },
          { id: 'p3', label: 'Daun 3', dirtyEmoji: '🍃', cleanEmoji: '🌿', cleanLabel: 'Bersih' },
          { id: 'p4', label: 'Daun 4', dirtyEmoji: '🍃', cleanEmoji: '🌿', cleanLabel: 'Bersih' },
          { id: 'p5', label: 'Daun 5', dirtyEmoji: '🍃', cleanEmoji: '🌿', cleanLabel: 'Bersih' },
          { id: 'p6', label: 'Daun 6', dirtyEmoji: '🍃', cleanEmoji: '🌿', cleanLabel: 'Bersih' },
        ],
      },
      {
        actionHint: 'Susun potongan peuyeum manis ke dalam besek bambu:',
        toolEmoji: '🧺',
        surfaceClass: 'from-amber-950 via-yellow-900 to-stone-900',
        soundType: 'wood',
        spots: [
          { id: 'p7', label: 'Besek A', dirtyEmoji: '🍠', cleanEmoji: '🧺', cleanLabel: 'Tertata' },
          { id: 'p8', label: 'Besek B', dirtyEmoji: '🍠', cleanEmoji: '🧺', cleanLabel: 'Tertata' },
          { id: 'p9', label: 'Besek C', dirtyEmoji: '🍠', cleanEmoji: '🧺', cleanLabel: 'Tertata' },
          { id: 'p10', label: 'Besek D', dirtyEmoji: '🍠', cleanEmoji: '🧺', cleanLabel: 'Tertata' },
        ],
      },
      {
        actionHint: 'Ikat tali bambu dan tempel label harga pada tiap besek:',
        toolEmoji: '🏷️',
        surfaceClass: 'from-stone-900 via-amber-950 to-slate-950',
        soundType: 'confirm',
        spots: [
          { id: 'p11', label: 'Paket 1', dirtyEmoji: '📦', cleanEmoji: '🏷️', cleanLabel: 'Siap Jual' },
          { id: 'p12', label: 'Paket 2', dirtyEmoji: '📦', cleanEmoji: '🏷️', cleanLabel: 'Siap Jual' },
          { id: 'p13', label: 'Paket 3', dirtyEmoji: '📦', cleanEmoji: '🏷️', cleanLabel: 'Siap Jual' },
          { id: 'p14', label: 'Paket 4', dirtyEmoji: '📦', cleanEmoji: '🏷️', cleanLabel: 'Siap Jual' },
        ],
      },
    ];
  }

  // Default: ronda_malam or any other job
  return [
    {
      actionHint: 'Pukul kentongan bambu sebagai tanda ronda malam dimulai:',
      toolEmoji: '🎋',
      surfaceClass: 'from-slate-900 via-indigo-950 to-slate-950',
      soundType: 'wood',
      spots: [
        { id: 'r1', label: 'Ketukan 1', dirtyEmoji: '🎋', cleanEmoji: '🔊', cleanLabel: 'Tung!' },
        { id: 'r2', label: 'Ketukan 2', dirtyEmoji: '🎋', cleanEmoji: '🔊', cleanLabel: 'Tung!' },
        { id: 'r3', label: 'Ketukan 3', dirtyEmoji: '🎋', cleanEmoji: '🔊', cleanLabel: 'Tung!' },
        { id: 'r4', label: 'Ketukan 4', dirtyEmoji: '🎋', cleanEmoji: '🔊', cleanLabel: 'Siap!' },
      ],
    },
    {
      actionHint: 'Periksa titik keamanan kampung agar seluruh gerbang terkunci:',
      toolEmoji: '🔦',
      surfaceClass: 'from-indigo-950 via-slate-900 to-slate-950',
      soundType: 'confirm',
      spots: [
        { id: 'r5', label: 'Gerbang SD', dirtyEmoji: '🚪', cleanEmoji: '🔒', cleanLabel: 'Aman' },
        { id: 'r6', label: 'Warung Arga', dirtyEmoji: '🏪', cleanEmoji: '🔒', cleanLabel: 'Aman' },
        { id: 'r7', label: 'Warung Asih', dirtyEmoji: '☕', cleanEmoji: '🔒', cleanLabel: 'Aman' },
        { id: 'r8', label: 'Jalan Utama', dirtyEmoji: '🛣️', cleanEmoji: '✅', cleanLabel: 'Kondusif' },
      ],
    },
    {
      actionHint: 'Isi dan tanda tangani buku laporan keamanan di Pos Ronda:',
      toolEmoji: '📝',
      surfaceClass: 'from-slate-950 via-stone-900 to-slate-900',
      soundType: 'confirm',
      spots: [
        { id: 'r9', label: 'Jam Patroli', dirtyEmoji: '📄', cleanEmoji: '📋', cleanLabel: 'Tercatat' },
        { id: 'r10', label: 'Status Kampung', dirtyEmoji: '📄', cleanEmoji: '📋', cleanLabel: 'Aman' },
        { id: 'r11', label: 'Paraf Arga', dirtyEmoji: '✍️', cleanEmoji: '✅', cleanLabel: 'Selesai' },
      ],
    },
  ];
}

interface SideJobModalProps {
  job: SideJobDef;
  onComplete: (job: SideJobDef) => void;
  onClose: () => void;
}

export const SideJobModal: React.FC<SideJobModalProps> = ({ job, onComplete, onClose }) => {
  const stages = React.useMemo(() => getSideJobStages(job.id), [job.id]);
  const [stepIdx, setStepIdx] = useState(0);
  const [clearedIds, setClearedIds] = useState<Record<string, boolean>>({});
  const [isPointerWiping, setIsPointerWiping] = useState(false);

  const done = stepIdx >= job.steps.length;
  const activeStage = stages[Math.min(stepIdx, stages.length - 1)];
  const clearedInStage = activeStage
    ? activeStage.spots.filter((sp) => clearedIds[sp.id]).length
    : 0;
  const totalInStage = activeStage?.spots.length ?? 1;

  const totalSpotsAll = stages.reduce((acc, st) => acc + st.spots.length, 0);
  const totalClearedAll = stages.reduce(
    (acc, st) => acc + st.spots.filter((sp) => clearedIds[sp.id]).length,
    0
  );
  const overallPct = Math.round((totalClearedAll / Math.max(1, totalSpotsAll)) * 100);

  const triggerSpotWork = (spotId: string) => {
    if (done || clearedIds[spotId]) return;
    if (activeStage.soundType === 'water') soundEngine.splashWater();
    else if (activeStage.soundType === 'leaves') soundEngine.rustleLeaves();
    else if (activeStage.soundType === 'wood') soundEngine.click();
    else soundEngine.confirm();

    const nextCleared = { ...clearedIds, [spotId]: true };
    setClearedIds(nextCleared);

    const allStageDone = activeStage.spots.every((sp) => nextCleared[sp.id]);
    if (allStageDone) {
      soundEngine.confirm();
      setTimeout(() => {
        setStepIdx((prev) => prev + 1);
      }, 260);
    }
  };

  useUiGamepadAction((btn) => {
    if (btn === 'A') {
      if (done) {
        onComplete(job);
      } else if (activeStage) {
        const nextSpot = activeStage.spots.find((sp) => !clearedIds[sp.id]);
        if (nextSpot) triggerSpotWork(nextSpot.id);
      }
    }
  });

  return (
    <div
      onPointerUp={() => setIsPointerWiping(false)}
      onPointerCancel={() => setIsPointerWiping(false)}
      className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
    >
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 shadow-2xl max-h-[94dvh] overflow-y-auto">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Kerja Sampingan · {job.locationLabel}
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-amber-100">{job.title}</h2>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-400/50 text-xs font-mono-num font-bold text-amber-300">
            Progres: {overallPct}%
          </div>
        </div>
        <p className="text-xs text-slate-300 mb-3">{job.description}</p>

        {/* Progress Tahapan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mb-3">
          {job.steps.map((st, idx) => {
            const isCompleted = idx < stepIdx;
            const isCurrent = idx === stepIdx;
            return (
              <div
                key={idx}
                className={`px-2.5 py-2 rounded-xl border flex items-center justify-between gap-1.5 text-[11px] ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
                    : isCurrent
                    ? 'bg-amber-400/20 border-amber-400 text-amber-100 font-bold'
                    : 'bg-slate-950/70 border-slate-800 text-slate-500'
                }`}
              >
                <span className="leading-tight">
                  {idx + 1}. {st}
                </span>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Area Permainan Kerja Interaktif */}
        {!done && activeStage ? (
          <div
            className={`rounded-xl border-2 border-amber-400/65 bg-gradient-to-br ${activeStage.surfaceClass} p-3 sm:p-4 mb-4 select-none`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="text-xs font-bold text-amber-100 flex items-center gap-1.5">
                <span className="text-base">{activeStage.toolEmoji}</span>
                <span>{activeStage.actionHint}</span>
              </div>
              <span className="text-[11px] font-mono-num font-bold text-emerald-300 bg-slate-950/70 px-2 py-0.5 rounded">
                {clearedInStage}/{totalInStage}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeStage.spots.map((spot) => {
                const isCleared = Boolean(clearedIds[spot.id]);
                return (
                  <button
                    key={spot.id}
                    type="button"
                    disabled={isCleared}
                    onPointerDown={() => {
                      setIsPointerWiping(true);
                      triggerSpotWork(spot.id);
                    }}
                    onPointerEnter={() => {
                      if (isPointerWiping) triggerSpotWork(spot.id);
                    }}
                    onClick={() => triggerSpotWork(spot.id)}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-2 text-left ${
                      isCleared
                        ? 'bg-emerald-500/25 border-emerald-400/70 text-emerald-100 scale-[0.98]'
                        : 'bg-slate-950/80 hover:bg-amber-400/20 border-amber-300/70 text-amber-100 cursor-pointer active:scale-95 shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl shrink-0">
                        {isCleared ? spot.cleanEmoji : spot.dirtyEmoji}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{spot.label}</div>
                        <div
                          className={`text-[10px] font-semibold ${
                            isCleared ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          {isCleared ? spot.cleanLabel : `Klik / Usap ${activeStage.toolEmoji}`}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-emerald-400 bg-emerald-950/50 p-4 mb-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-1.5" />
            <div className="font-display text-base font-bold text-emerald-200">
              Pekerjaan Selesai &amp; Rapi!
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Warga {job.locationLabel} berterima kasih atas kerja keras Arga. Silakan ambil upah!
            </p>
          </div>
        )}

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
            <div className="flex-1 py-3 px-4 rounded-xl bg-slate-800/80 border border-amber-400/35 text-amber-200 font-semibold text-xs sm:text-sm text-center">
              Selesaikan area kerja di atas ({clearedInStage}/{totalInStage}) · Tekan [A] untuk aksi cepat
            </div>
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
