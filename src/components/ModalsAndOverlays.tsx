import React, { useState } from 'react';
import {
  MapPin,
  Smartphone,
  MoonStar,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Star,
  Wallet,
  Gamepad2,
  Trophy,
  CloudSun,
  Umbrella,
  ShoppingBag,
  Compass,
  ReceiptText,
  ArrowUpRight,
  ArrowDownLeft,
  Volume2,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Shirt,
  KeyRound,
  Lock,
} from 'lucide-react';
import {
  GAME_VERSION,
  PRAYER_SCHEDULE,
  RANK_TIER_DEFS,
  SCENES,
  SEASON_META,
  TRADITIONS,
  WEATHER_META,
  computeEffectiveActivityPoints,
  ensureWeatherForecast,
  formatGameDate,
  formatGameTime,
  formatRupiah,
  getArgaOutfitState,
  getForecastPlanningAdvice,
  getGreetingOptionsForNpc,
  getPlayerRankInfo,
  GreetingOption,
} from '../data/gameData';
import {
  ArgaOutfitMode,
  DialogueOption,
  GameState,
  NpcDef,
  PrayerName,
  SceneId,
  TraditionDef,
  VehicleType,
} from '../types/game';
import { useUiGamepadAction } from '../hooks/useGamepad';
import { CharacterSprite, PortraitBadge } from './CharacterAvatar';
import { soundEngine } from '../utils/audio';

interface DialogueModalProps {
  npc: NpcDef;
  minutesOfDay: number;
  outfitMode?: ArgaOutfitMode;
  onSelectOption: (opt: DialogueOption, salamBonusPoints: number, salamAppropriate: boolean) => void;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  minutesOfDay,
  outfitMode = 'default',
  onSelectOption,
  onClose,
}) => {
  const [selectedGreeting, setSelectedGreeting] = useState<GreetingOption | null>(null);
  const [selectedReply, setSelectedReply] = useState<{ reply: string; replyId: string } | null>(null);
  const [impactMsg, setImpactMsg] = useState<string>('');
  const [focusedOpt, setFocusedOpt] = useState(0);

  const greetingOptions = React.useMemo(
    () => getGreetingOptionsForNpc(npc, minutesOfDay),
    [npc, minutesOfDay]
  );

  const npcOpening = npc.greetings[0];
  const npcOpeningId = npc.greetingsId[0] ?? '';

  const handleChooseGreeting = (g: GreetingOption) => {
    setSelectedGreeting(g);
    setFocusedOpt(0);
    if (g.isAppropriate) {
      soundEngine.confirm();
    } else {
      soundEngine.click();
    }
  };

  const handleChoose = (opt: DialogueOption) => {
    const salamPts = selectedGreeting?.bonusPoints ?? 0;
    const salamOk = Boolean(selectedGreeting?.isAppropriate);
    setSelectedReply({ reply: opt.reply, replyId: opt.replyId });
    const repLabel = opt.reputationDelta >= 0 ? `+${opt.reputationDelta.toFixed(2)}` : opt.reputationDelta.toFixed(2);
    const satLabel = opt.satisfactionDelta >= 0 ? `+${opt.satisfactionDelta}%` : `${opt.satisfactionDelta}%`;
    const totalPts = (opt.tone === 'ramah' ? 8 : opt.tone === 'biasa' ? 5 : 2) + salamPts;
    setImpactMsg(
      `Reputasi Warung ${repLabel} · Kepuasan Warga ${satLabel} · +${totalPts} Poin Keaktifan`
    );
    onSelectOption(opt, salamPts, salamOk);
  };

  useUiGamepadAction((btn) => {
    if (selectedReply) {
      if (btn === 'A' || btn === 'B') onClose();
      return;
    }
    const activeListLen = !selectedGreeting ? greetingOptions.length : npc.options.length;
    if (btn === 'DPAD_DOWN' || btn === 'DPAD_RIGHT') {
      setFocusedOpt((i) => (i + 1) % activeListLen);
    } else if (btn === 'DPAD_UP' || btn === 'DPAD_LEFT') {
      setFocusedOpt((i) => (i + activeListLen - 1) % activeListLen);
    } else if (btn === 'A') {
      if (!selectedGreeting) {
        const g = greetingOptions[focusedOpt];
        if (g) handleChooseGreeting(g);
      } else {
        const opt = npc.options[focusedOpt];
        if (opt) handleChoose(opt);
      }
    }
  });

  const bubbleMain = selectedReply
    ? selectedReply.reply
    : selectedGreeting
    ? `${selectedGreeting.npcReaction} — ${npcOpening}`
    : `${npc.name} menoleh menyambut kehadiran Arga...`;
  const bubbleTrans = selectedReply
    ? selectedReply.replyId
    : selectedGreeting
    ? `${selectedGreeting.npcReactionId} — ${npcOpeningId}`
    : `Pilih salam pembuka berbahasa Sunda yang sopan sesuai waktu (${formatGameTime(minutesOfDay)} WIB).`;

  const argaGesture: 'wave' | 'salute' | 'nod' = selectedReply
    ? 'nod'
    : selectedGreeting
    ? 'salute'
    : 'wave';
  const gestureBadgeText = selectedReply
    ? '🙂 Mengangguk Sopan'
    : selectedGreeting
    ? selectedGreeting.isAppropriate
      ? '🙏 Rengkuh Hormat'
      : '👋 Menyapa Warga'
    : '👋 Melambaikan Tangan';
  const npcAnimKey = selectedReply ? 'reply' : selectedGreeting ? 'greet' : 'open';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-3.5 sm:p-5 shadow-2xl max-h-[94dvh] overflow-y-auto">
        {/* Live Animated Greeting Stage: Arga (animated gesture) <-> Warga (nod reaction) */}
        <div className="mb-3 rounded-xl bg-gradient-to-r from-emerald-950/55 via-slate-950/90 to-amber-950/55 border border-amber-400/35 px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-14 h-16 rounded-xl bg-slate-900/90 border border-amber-400/40 flex items-end justify-center overflow-hidden shrink-0">
              <div className="scale-[0.82] origin-bottom -mb-1">
                <CharacterSprite
                  name="Arga"
                  shirtColor="#dc2626"
                  accentColor="#f8fafc"
                  outfitMode={outfitMode}
                  isArga
                  facing="right"
                  viewPerspective="front"
                  gesture={argaGesture}
                  hideNameplate
                />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200">Arga</div>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/45 text-[10px] font-semibold text-amber-100">
                {gestureBadgeText}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-center text-[10px] text-emerald-300/90 font-semibold">
            <span className="animate-pulse">✦ Tatap Muka Sopan ✦</span>
          </div>

          <div className="flex items-center gap-2.5 text-right">
            <div>
              <div className="text-xs font-bold text-amber-300">{npc.name}</div>
              <div className="text-[10px] text-slate-400">{npc.role}</div>
            </div>
            <div key={npcAnimKey} className={selectedGreeting || selectedReply ? 'sunda-npc-nod' : ''}>
              <PortraitBadge
                name={npc.name}
                shirtColor={npc.shirtColor}
                accentColor={npc.accentColor}
                hatType={npc.hatType}
                size="md"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="hidden sm:block shrink-0" key={`lg_${npcAnimKey}`}>
            <div className={selectedGreeting || selectedReply ? 'sunda-npc-nod' : ''}>
              <PortraitBadge
                name={npc.name}
                shirtColor={npc.shirtColor}
                accentColor={npc.accentColor}
                hatType={npc.hatType}
                size="lg"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg sm:text-xl font-bold text-amber-300">{npc.name}</h3>
              <span className="text-xs text-slate-400">{npc.role}</span>
            </div>
            <div className="mt-2 bg-slate-950/85 border border-slate-800 rounded-xl p-3 space-y-1.5">
              <p className="text-sm font-medium text-amber-50 leading-relaxed">
                "{bubbleMain}"
              </p>
              <p className="text-xs text-emerald-300/95 leading-relaxed border-t border-slate-800/80 pt-1.5">
                <span className="font-bold text-emerald-400">
                  {selectedGreeting ? 'Terjemahan:' : 'Petunjuk:'}
                </span>{' '}
                "{bubbleTrans}"
              </p>
            </div>
            {selectedGreeting && (
              <div
                className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  selectedGreeting.isAppropriate
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                    : 'bg-amber-500/15 border-amber-400/50 text-amber-200'
                }`}
              >
                {selectedGreeting.isAppropriate && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{selectedGreeting.feedbackLabel}</span>
              </div>
            )}
            {impactMsg && <div className="text-xs font-bold text-emerald-300 mt-1.5">{impactMsg}</div>}
          </div>
        </div>

        {!selectedGreeting ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 uppercase tracking-wider">
              <span>Langkah 1 · Ucapkan Salam Pembuka ({formatGameTime(minutesOfDay)} WIB)</span>
              <span className="text-[10px] text-emerald-300 normal-case">Basa Sunda sopan = +6 Poin!</span>
            </div>
            {greetingOptions.map((g, idx) => (
              <button
                key={g.id}
                onMouseEnter={() => setFocusedOpt(idx)}
                onClick={() => handleChooseGreeting(g)}
                className={`group w-full text-left px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                  focusedOpt === idx
                    ? 'bg-amber-400 text-slate-950 border-white ally-focus'
                    : 'bg-slate-950 hover:bg-amber-400 hover:text-slate-950 border-amber-400/50 text-amber-100'
                }`}
              >
                <div>
                  {idx + 1}. {g.text}
                </div>
                <div
                  className={`text-[11px] font-normal mt-0.5 ${
                    focusedOpt === idx ? 'text-amber-950' : 'text-emerald-300/90 group-hover:text-amber-950'
                  }`}
                >
                  Arti: {g.textId}
                </div>
              </button>
            ))}
          </div>
        ) : !selectedReply ? (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Langkah 2 · Pilih Lanjutan Obrolan [D-Pad + A]:
            </div>
            {npc.options.map((opt, idx) => (
              <button
                key={idx}
                onMouseEnter={() => setFocusedOpt(idx)}
                onClick={() => handleChoose(opt)}
                className={`group w-full text-left px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                  focusedOpt === idx
                    ? 'bg-amber-400 text-slate-950 border-white ally-focus'
                    : 'bg-slate-950 hover:bg-amber-400 hover:text-slate-950 border-amber-400/50 text-amber-100'
                }`}
              >
                <div>
                  {idx + 1}. {opt.text}
                </div>
                <div
                  className={`text-[11px] font-normal mt-0.5 ${
                    focusedOpt === idx ? 'text-amber-950' : 'text-emerald-300/90 group-hover:text-amber-950'
                  }`}
                >
                  Terjemahan: {opt.textId}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm"
          >
            Lanjutkan Perjalanan [A / B]
          </button>
        )}
      </div>
    </div>
  );
};

interface PrayerReminderModalProps {
  prayerName: PrayerName;
  wasWarungOpen: boolean;
  masterSarungUnlocked?: boolean;
  onPrayNow: (where: 'masjid' | 'rumah') => void;
  onAcknowledgeCloseOnly: () => void;
}

export const PrayerReminderModal: React.FC<PrayerReminderModalProps> = ({
  prayerName,
  wasWarungOpen,
  masterSarungUnlocked = false,
  onPrayNow,
  onAcknowledgeCloseOnly,
}) => {
  const info = PRAYER_SCHEDULE.find((p) => p.name === prayerName);

  useUiGamepadAction((btn) => {
    if (btn === 'A') {
      soundEngine.stopAdzan();
      onPrayNow('masjid');
    }
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-emerald-400 rounded-2xl p-4 sm:p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)] max-h-[94dvh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
              <MoonStar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Pengingat Waktu Sholat</div>
              <h2 className="font-display text-2xl font-bold text-white">{info?.label ?? prayerName}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.stopAdzan();
                soundEngine.playBeduk(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-200 text-[11px] font-bold flex items-center gap-1"
            >
              <span>🥁 Beduk</span>
            </button>
            <button
              type="button"
              onClick={() => soundEngine.playAdzan()}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-[11px] font-bold flex items-center gap-1"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Adzan</span>
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed mb-3">{info?.info}</p>
        {masterSarungUnlocked && (
          <div className="bg-emerald-500/15 border border-emerald-400/60 rounded-xl p-2.5 text-xs text-emerald-200 font-semibold mb-3">
            🕌 Tahap Master+: Arga otomatis mengenakan <strong>Kain Sarung, Baju Koko &amp; Peci</strong> untuk waktu sholat {prayerName}.
          </div>
        )}
        {wasWarungOpen && (
          <div className="bg-amber-400/15 border border-amber-400 rounded-xl p-3 text-xs text-amber-200 font-semibold mb-4">
            Warung Arga otomatis ditutup sementara demi menghormati waktu sholat {prayerName}. Setelah sholat, Arga
            bisa membuka warung kembali (jika masih jam 09.00–17.00).
          </div>
        )}

        <div className="space-y-2.5">
          <button
            onClick={() => {
              soundEngine.stopAdzan();
              onPrayNow('masjid');
            }}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
          >
            Sholat Berjamaah di Masjid Al-Ikhlas (+Reputasi & +10% Energi)
          </button>
          <button
            onClick={() => {
              soundEngine.stopAdzan();
              onPrayNow('rumah');
            }}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-200 border border-emerald-400/40 font-bold text-sm"
          >
            Sholat di Sajadah Rumah Arga (+8% Energi)
          </button>
          <button
            onClick={() => {
              soundEngine.stopAdzan();
              onAcknowledgeCloseOnly();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-semibold"
          >
            Tutup Warung Saja, Berangkat Jalan Kaki Sendiri [B]
          </button>
        </div>
      </div>
    </div>
  );
};

interface TraditionModalProps {
  tradition: TraditionDef;
  currentScene: SceneId;
  day: number;
  minutesOfDay: number;
  money: number;
  alreadyPaid: boolean;
  onGoToLocation: (scene: SceneId) => void;
  onPayUrunan: (tradition: TraditionDef) => void;
  onSkip: () => void;
}

export const TraditionModal: React.FC<TraditionModalProps> = ({
  tradition,
  currentScene,
  day,
  minutesOfDay,
  money,
  alreadyPaid,
  onGoToLocation,
  onPayUrunan,
  onSkip,
}) => {
  const isAtVenue = currentScene === tradition.scene;
  const cycleDay = ((day - 1) % 12) + 1;
  const isScheduledDay = cycleDay === tradition.dayTrigger;
  const isWithinWindow = minutesOfDay >= tradition.startMinutes && minutesOfDay <= tradition.endMinutes;
  const canAttendNow = isAtVenue && isScheduledDay && isWithinWindow;

  useUiGamepadAction((btn) => {
    if (btn !== 'A') return;
    if (alreadyPaid) {
      onSkip();
    } else if (!isAtVenue) {
      onGoToLocation(tradition.scene);
    } else if (canAttendNow && money >= tradition.urunanAmount) {
      onPayUrunan(tradition);
    }
  });

  const scheduleStatusText = !isScheduledDay
    ? `Dijadwalkan Hari ke-${tradition.dayTrigger} (${tradition.timeLabel})`
    : isWithinWindow
    ? 'Sedang Berlangsung Sekarang'
    : minutesOfDay < tradition.startMinutes
    ? `Dimulai nanti pukul ${formatGameTime(tradition.startMinutes)} WIB`
    : `Waktu acara hari ini sudah selesai (${tradition.timeLabel})`;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-400 rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[94dvh] overflow-y-auto">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Acara Warga Sunda · Tuan Rumah {tradition.hostNpc}</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-amber-50 mb-2">{tradition.title}</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">{tradition.description}</p>

        {/* Venue & Realistic Time Window */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-3 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Tempat Acara:</span>
            <span className={`font-bold ${isAtVenue ? 'text-emerald-300' : 'text-amber-200'}`}>
              {tradition.locationLabel} {isAtVenue ? '(Arga sudah di lokasi)' : '(Belum di lokasi)'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Waktu Acara:</span>
            <span className={`font-bold ${isScheduledDay && isWithinWindow ? 'text-emerald-300' : 'text-amber-300'}`}>
              {tradition.timeLabel}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
            Status: <span className="font-semibold text-amber-100">{scheduleStatusText}</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-amber-400/40 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Urunan Gotong Royong Warga</div>
            <div className="font-mono-num text-xl font-bold text-amber-300">
              {formatRupiah(tradition.urunanAmount)}
            </div>
          </div>
          <div className="text-right text-xs text-emerald-300 font-bold">
            +{tradition.reputationGain.toFixed(2)} Reputasi Warung
            <br />
            +10% Kepuasan Warga · +35 Poin
          </div>
        </div>

        {alreadyPaid ? (
          <button
            onClick={onSkip}
            className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm"
          >
            Arga Sudah Hadir &amp; Urunan · Tutup [B]
          </button>
        ) : !isAtVenue ? (
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
            >
              Nanti [B]
            </button>
            <button
              onClick={() => onGoToLocation(tradition.scene)}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              <span>Langsung ke {tradition.locationLabel} [A]</span>
            </button>
          </div>
        ) : !canAttendNow ? (
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-400/40 text-xs text-amber-200 text-center">
              Arga sudah berada di tempat acara, namun acara hanya dilaksanakan pada{' '}
              <strong>Hari ke-{tradition.dayTrigger} pukul {tradition.timeLabel}</strong>.
            </div>
            <button
              onClick={onSkip}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
            >
              Mengerti · Tutup [B]
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
            >
              Nanti Dulu [B]
            </button>
            <button
              disabled={money < tradition.urunanAmount}
              onClick={() => onPayUrunan(tradition)}
              className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm"
            >
              {money < tradition.urunanAmount
                ? 'Uang Belum Cukup'
                : `Ikuti Acara & Urunan ${formatRupiah(tradition.urunanAmount)} [A]`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface AccidentModalProps {
  vehicleType: VehicleType;
  medicalFee: number;
  paidCash: number;
  addedDebt: number;
  onContinue: () => void;
}

export const AccidentModal: React.FC<AccidentModalProps> = ({
  vehicleType,
  medicalFee,
  paidCash,
  addedDebt,
  onContinue,
}) => {
  useUiGamepadAction((btn) => {
    if (btn === 'A' || btn === 'B') {
      onContinue();
    }
  });

  const labels: Record<VehicleType, string> = {
    mobil: 'Mobil',
    angkot: 'Angkot',
    motor: 'Sepeda Motor',
    pedati: 'Pedati',
    delman: 'Delman',
    becak: 'Becak',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 sm:p-6 text-center overflow-y-auto">
      <AlertTriangle className="w-11 h-11 sm:w-14 sm:h-14 text-amber-400 mb-3 sm:mb-4 shrink-0" />
      <h2 className="font-display text-2xl md:text-3xl font-bold text-amber-300 mb-4">
        Arga tertabrak {labels[vehicleType]} di jalan!
      </h2>
      <p className="font-display text-xl text-amber-200 mb-2">
        Biaya fasilitas kesehatan & dokter {formatRupiah(medicalFee)}.
      </p>
      {addedDebt > 0 ? (
        <p className="font-display text-lg text-amber-100 mb-2">
          Tunai terbayar {formatRupiah(paidCash)}, sisa {formatRupiah(addedDebt)} masuk catatan utang.
        </p>
      ) : (
        <p className="font-display text-lg text-emerald-300 mb-2">
          Saldo Arga berkurang {formatRupiah(paidCash)} untuk berobat ke Puskesmas.
        </p>
      )}
      <p className="text-base text-amber-200/90 mt-2 mb-8">
        Arga harus beristirahat di kamar sampai kakinya pulih. Lihat kiri-kanan sebelum menyeberang!
      </p>

      <button
        onClick={onContinue}
        className="px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base"
      >
        Istirahat di Kamar Arga [A]
      </button>
    </div>
  );
};

interface MapModalProps {
  currentScene: SceneId;
  onTravel: (scene: SceneId) => void;
  onOpenPasarTransport: () => void;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({
  currentScene,
  onTravel,
  onOpenPasarTransport,
  onClose,
}) => {
  const villageLocations: SceneId[] = [
    'kampung_warung',
    'kompleks_warga',
    'sawah_lisung',
    'bumi_ageung',
    'sekolah',
    'hutan_tutupan',
    'area_air',
  ];
  const [focusedIdx, setFocusedIdx] = useState(0);
  const totalItems = villageLocations.length + 1;

  useUiGamepadAction((btn) => {
    if (btn === 'DPAD_DOWN' || btn === 'DPAD_RIGHT') {
      setFocusedIdx((i) => (i + 1) % totalItems);
    } else if (btn === 'DPAD_UP' || btn === 'DPAD_LEFT') {
      setFocusedIdx((i) => (i + totalItems - 1) % totalItems);
    } else if (btn === 'A') {
      if (focusedIdx === villageLocations.length) {
        onOpenPasarTransport();
      } else {
        onTravel(villageLocations[focusedIdx]);
      }
    }
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[94dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-amber-200 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              Peta Kampung Sunda Sukamaju
            </h2>
            <p className="text-xs text-slate-400">
              Pilih wilayah kampung [D-Pad + A] untuk menuju ke sana, atau ke Halte untuk naik kendaraan ke Pasar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {villageLocations.map((id, idx) => {
            const sc = SCENES[id];
            const isHere = currentScene === id;
            const isFocused = focusedIdx === idx;
            return (
              <button
                key={id}
                onMouseEnter={() => setFocusedIdx(idx)}
                onClick={() => onTravel(id)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isHere
                    ? 'bg-amber-400 text-slate-950 border-white font-bold'
                    : 'bg-slate-950/85 hover:bg-slate-800 border-amber-400/40 text-amber-100'
                } ${isFocused ? 'ally-focus' : ''}`}
              >
                <div className="text-sm font-bold">{sc.name}</div>
                <div className={`text-xs mt-0.5 ${isHere ? 'text-amber-950' : 'text-slate-400'}`}>
                  {sc.subtitle}
                </div>
              </button>
            );
          })}

          {/* Pasar Tradisional (Requires Vehicle!) */}
          <button
            onMouseEnter={() => setFocusedIdx(villageLocations.length)}
            onClick={onOpenPasarTransport}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              currentScene === 'pasar'
                ? 'bg-emerald-500 text-slate-950 border-white font-bold'
                : 'bg-emerald-950/50 hover:bg-emerald-900/50 border-emerald-400/60 text-emerald-100'
            } ${focusedIdx === villageLocations.length ? 'ally-focus' : ''}`}
          >
            <div className="text-sm font-bold">PASAR TRADISIONAL SUNDA (Jauh)</div>
            <div className="text-xs mt-0.5 text-emerald-300">
              Naik Angkot Rp 5.000 / Ojek / Becak / Delman
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
        >
          Tutup Peta [B / Y]
        </button>
      </div>
    </div>
  );
};

interface PhoneModalProps {
  gameState: GameState;
  onPayDebt: (amount: number) => void;
  onOpenTraditions: () => void;
  onClose: () => void;
}

export const PhoneModal: React.FC<PhoneModalProps> = ({
  gameState,
  onPayDebt,
  onOpenTraditions,
  onClose,
}) => {
  const [tab, setTab] = useState<'keuangan' | 'cuaca' | 'ulasan' | 'tradisi' | 'kontroler'>('keuangan');

  useUiGamepadAction((btn) => {
    const order: ('keuangan' | 'cuaca' | 'ulasan' | 'tradisi' | 'kontroler')[] = [
      'keuangan',
      'cuaca',
      'ulasan',
      'tradisi',
      'kontroler',
    ];
    if (btn === 'LB' || btn === 'DPAD_LEFT') {
      const idx = order.indexOf(tab);
      setTab(order[(idx + order.length - 1) % order.length]);
    } else if (btn === 'RB' || btn === 'DPAD_RIGHT') {
      const idx = order.indexOf(tab);
      setTab(order[(idx + 1) % order.length]);
    }
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-3.5 sm:p-5 shadow-2xl max-h-[94dvh] flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
          <h2 className="font-display text-lg sm:text-xl font-bold text-amber-200 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            HP Arga · AsihApp
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'keuangan' as const, label: 'Keuangan' },
              { id: 'cuaca' as const, label: 'Cuaca 3 Hari' },
              { id: 'ulasan' as const, label: 'Ulasan' },
              { id: 'tradisi' as const, label: 'Adat & Sholat' },
              { id: 'kontroler' as const, label: 'Controller' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  tab === t.id ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {tab === 'keuangan' && (() => {
            const effectivePts = computeEffectiveActivityPoints(gameState);
            const rankInfo = getPlayerRankInfo(effectivePts);
            return (
              <div className="space-y-3">
                {/* Peringkat Keaktifan Warrior -> Mythic */}
                <div className={`rounded-xl p-4 border-2 ${rankInfo.badgeBg} ${rankInfo.badgeBorder}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className={`w-5 h-5 ${rankInfo.badgeText}`} />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                          Peringkat Keaktifan Arga (Slot {gameState.slotId})
                        </div>
                        <div className={`font-display text-lg font-extrabold ${rankInfo.badgeText}`}>
                          {rankInfo.fullLabel}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono-num">
                      <div className="text-sm font-bold text-white">{rankInfo.points} Poin</div>
                      <div className="text-[10px] text-slate-300">
                        {rankInfo.nextThreshold !== null
                          ? `Menuju ${rankInfo.nextTierName} (${rankInfo.nextThreshold} poin)`
                          : 'Peringkat Tertinggi Kampung!'}
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950/75 border border-white/15 overflow-hidden mb-2">
                    <div
                      style={{ width: `${rankInfo.progressPct}%` }}
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {RANK_TIER_DEFS.map((t) => {
                      const active = t.tier === rankInfo.tier;
                      return (
                        <span
                          key={t.tier}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            active
                              ? 'bg-amber-400 text-slate-950 border-white'
                              : 'bg-slate-950/60 text-slate-400 border-slate-700'
                          }`}
                        >
                          {t.tier}
                        </span>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-[10px] text-slate-200 font-mono-num">
                    <div className="bg-slate-950/60 rounded p-1.5 text-center">
                      <div className="text-slate-400">Penjualan</div>
                      <div className="font-bold">{gameState.totalSalesCount}x</div>
                    </div>
                    <div className="bg-slate-950/60 rounded p-1.5 text-center">
                      <div className="text-slate-400">Sapa Warga</div>
                      <div className="font-bold">{gameState.totalGreetingsCount ?? gameState.greetedNpcsToday.length}x</div>
                    </div>
                    <div className="bg-slate-950/60 rounded p-1.5 text-center">
                      <div className="text-slate-400">Kerja</div>
                      <div className="font-bold">{gameState.totalSideJobsCount ?? gameState.completedJobsToday.length}x</div>
                    </div>
                    <div className="bg-slate-950/60 rounded p-1.5 text-center">
                      <div className="text-slate-400">Sholat</div>
                      <div className="font-bold">{gameState.totalPrayersCount ?? gameState.prayedToday.length}x</div>
                    </div>
                  </div>
                </div>

                {/* Pakaian Khusus Peringkat Arga */}
                {(() => {
                  const outfit = getArgaOutfitState(gameState);
                  return (
                    <div className="bg-slate-950 border border-amber-400/40 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Shirt className="w-4 h-4" /> Pakaian Khusus Peringkat Arga
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-amber-200">
                          Dipakai: {outfit.shortTag}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div
                          className={`rounded-lg border px-2.5 py-2 ${
                            outfit.eliteWarmUnlocked
                              ? 'bg-sky-950/35 border-sky-400/50 text-sky-100'
                              : 'bg-slate-900/70 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>🧥 Pakaian Hangat</span>
                            <span className={outfit.eliteWarmUnlocked ? 'text-emerald-300' : 'text-amber-300'}>
                              {outfit.eliteWarmUnlocked ? 'Terbuka' : 'Tahap Elite'}
                            </span>
                          </div>
                          <div className="text-[10px] opacity-85 mt-0.5">
                            Otomatis dipakai saat Musim Hujan / gerimis.
                          </div>
                        </div>
                        <div
                          className={`rounded-lg border px-2.5 py-2 ${
                            outfit.masterSarungUnlocked
                              ? 'bg-emerald-950/35 border-emerald-400/50 text-emerald-100'
                              : 'bg-slate-900/70 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>🕌 Kain Sarung &amp; Koko</span>
                            <span className={outfit.masterSarungUnlocked ? 'text-emerald-300' : 'text-amber-300'}>
                              {outfit.masterSarungUnlocked ? 'Terbuka' : 'Tahap Master'}
                            </span>
                          </div>
                          <div className="text-[10px] opacity-85 mt-0.5">
                            Otomatis dipakai setiap waktu sholat tiba.
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Saldo Tunai Arga
                    </div>
                    <div className="font-mono-num text-xl font-bold text-emerald-300 mt-1">
                      {formatRupiah(gameState.money)}
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                    <div className="text-xs text-slate-400">Total Omzet Warung Arga</div>
                    <div className="font-mono-num text-xl font-bold text-amber-300 mt-1">
                      {formatRupiah(gameState.totalRevenue)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-rose-500/40 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-rose-300">
                      Catatan Hutang: {formatRupiah(gameState.debt)}
                    </span>
                    {gameState.debt > 0 && gameState.money > 0 && (
                      <button
                        onClick={() => onPayDebt(Math.min(gameState.debt, gameState.money))}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                      >
                        Cicil / Lunasi Sekarang
                      </button>
                    )}
                  </div>
                  {gameState.debtRecords.length === 0 ? (
                    <p className="text-xs text-slate-400">Alhamdulillah, belum ada catatan utang.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {gameState.debtRecords.map((r) => (
                        <div key={r.id} className="text-xs flex justify-between text-slate-300">
                          <span>
                            Hari {r.dayCreated} · {r.reason}
                          </span>
                          <span className="font-mono-num text-rose-300">{formatRupiah(r.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 10 Transaksi & Kejadian Terakhir */}
                {(() => {
                  const recentTx = (gameState.transactions ?? []).slice(0, 10);
                  const totalIn = recentTx
                    .filter((tx) => tx.type === 'income')
                    .reduce((acc, tx) => acc + tx.amount, 0);
                  const totalOut = recentTx
                    .filter((tx) => tx.type === 'expense')
                    .reduce((acc, tx) => acc + tx.amount, 0);

                  return (
                    <div className="bg-slate-950 border border-amber-400/40 rounded-xl p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-amber-300">
                          <ReceiptText className="w-4 h-4 text-amber-400" />
                          <span>10 Transaksi &amp; Kejadian Terakhir</span>
                        </div>
                        {recentTx.length > 0 && (
                          <div className="flex items-center gap-2 text-[10px] font-mono-num font-bold">
                            <span className="text-emerald-300">+{formatRupiah(totalIn)}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-rose-300">-{formatRupiah(totalOut)}</span>
                          </div>
                        )}
                      </div>

                      {recentTx.length === 0 ? (
                        <p className="text-xs text-slate-400">
                          Belum ada riwayat transaksi. Mulai buka warung, belanja ke pasar, atau ambil kerja sampingan!
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                          {recentTx.map((tx) => {
                            const isIncome = tx.type === 'income';
                            return (
                              <div
                                key={tx.id}
                                className="flex items-center justify-between gap-2.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                                      isIncome
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    }`}
                                  >
                                    {isIncome ? (
                                      <ArrowDownLeft className="w-3.5 h-3.5" />
                                    ) : (
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-100 truncate">
                                      {tx.title}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      Hari {tx.day} · {formatGameTime(tx.minutesOfDay)} WIB
                                      {tx.detail ? ` · ${tx.detail}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className={`font-mono-num text-xs font-bold shrink-0 ${
                                    isIncome ? 'text-emerald-300' : 'text-rose-300'
                                  }`}
                                >
                                  {isIncome ? '+' : '-'}
                                  {formatRupiah(tx.amount)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {tab === 'cuaca' && (() => {
            const rolling = ensureWeatherForecast(
              gameState.day,
              gameState.season,
              gameState.weather,
              gameState.weatherForecast
            );
            const upcoming3Days = rolling.slice(1, 4);
            const liveMeta = WEATHER_META[gameState.weather];
            const liveSeason = SEASON_META[gameState.season];
            const relativeNames = ['Besok', 'Lusa', '3 Hari Lagi'];

            return (
              <div className="space-y-3">
                {/* Live Weather Header */}
                <div className="bg-slate-950 border border-sky-400/50 rounded-xl p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <CloudSun className="w-5 h-5 text-sky-300" />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                          BMKG Kampung Sukamaju · Sekarang ({formatGameDate(gameState.day)})
                        </div>
                        <div className="font-display text-base font-bold text-white flex items-center gap-1.5">
                          <span>{liveMeta.emoji}</span>
                          <span>{liveMeta.label}</span>
                          <span className="text-xs font-normal text-slate-400">
                            · {liveSeason.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono-num text-xs">
                      <div className="text-amber-200 font-bold">
                        {formatGameTime(gameState.minutesOfDay)} WIB
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Perubahan ~{Math.max(5, Math.round(gameState.weatherRemainingMin))} mnt lagi
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5">
                    {liveSeason.advice}
                  </p>
                </div>

                {/* 3-Day Upcoming Forecast */}
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider px-0.5">
                  Prakiraan 3 Hari Mendatang (Rencana Pasar & Kerja Luar)
                </div>

                <div className="space-y-2.5">
                  {upcoming3Days.map((fc, idx) => {
                    const prevDaySeason = idx === 0 ? gameState.season : upcoming3Days[idx - 1].season;
                    const seasonChanged = fc.season !== prevDaySeason;
                    const advice = getForecastPlanningAdvice(fc);
                    const isRainSeason = fc.season === 'hujan';

                    return (
                      <div
                        key={fc.day}
                        className={`rounded-xl border p-3 ${
                          isRainSeason
                            ? 'bg-slate-950 border-cyan-500/45'
                            : 'bg-slate-950 border-amber-400/45'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-200 font-bold text-[11px]">
                              {relativeNames[idx]}
                            </span>
                            <span className="text-xs font-bold text-white">
                              Hari ke-{fc.day} ({formatGameDate(fc.day)})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {seasonChanged && (
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-400/60 text-rose-200 text-[10px] font-bold">
                                Pergantian Musim!
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                                isRainSeason
                                  ? 'bg-cyan-950/70 border-cyan-400/60 text-cyan-200'
                                  : 'bg-amber-950/60 border-amber-400/60 text-amber-200'
                              }`}
                            >
                              {SEASON_META[fc.season].shortLabel}
                            </span>
                          </div>
                        </div>

                        {/* Morning / Afternoon / Evening slots */}
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          {[
                            { slot: 'Pagi', w: fc.morning },
                            { slot: 'Siang', w: fc.afternoon },
                            { slot: 'Sore', w: fc.evening },
                          ].map((part) => {
                            const m = WEATHER_META[part.w];
                            return (
                              <div
                                key={part.slot}
                                className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1.5 text-center"
                              >
                                <div className="text-[10px] text-slate-400">{part.slot}</div>
                                <div className="text-xs font-bold text-slate-100 mt-0.5">
                                  {m.emoji} {m.label}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Rain Probability Bar */}
                        <div className="flex items-center gap-2 mb-2 text-[11px]">
                          <Umbrella className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                          <span className="text-slate-300 shrink-0">Peluang Hujan</span>
                          <div className="flex-1 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${fc.rainChancePct}%` }}
                              className={`h-full ${
                                fc.rainChancePct >= 55
                                  ? 'bg-cyan-400'
                                  : fc.rainChancePct >= 30
                                  ? 'bg-sky-400'
                                  : 'bg-amber-400'
                              }`}
                            />
                          </div>
                          <span className="font-mono-num font-bold text-cyan-200 w-9 text-right">
                            {fc.rainChancePct}%
                          </span>
                        </div>

                        {/* Planning Tips */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-100 flex items-start gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-amber-300">Stok Pasar:</strong> {advice.stockTip}
                            </span>
                          </div>
                          <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-100 flex items-start gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-emerald-300">Aktivitas Luar:</strong> {advice.outdoorTip}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {tab === 'ulasan' && (
            <div className="space-y-2.5">
              <div className="bg-slate-950 border border-amber-400/40 rounded-xl p-3 flex items-center justify-between text-xs">
                <span>Reputasi Warung Arga: {gameState.reputation.toFixed(2)} / 5.0</span>
                <span className="text-emerald-300 font-bold">Kepuasan Warga: {gameState.wargaSatisfaction}%</span>
              </div>
              {gameState.reviews.map((rev) => (
                <div key={rev.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-amber-200">{rev.author}</span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {rev.rating}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'tradisi' && (
            <div className="space-y-3">
              <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3.5">
                <div className="text-xs font-bold text-emerald-300 mb-2">Jadwal Sholat 5 Waktu (WIB)</div>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {PRAYER_SCHEDULE.map((p) => {
                    const done = gameState.prayedToday.includes(p.name);
                    return (
                      <div
                        key={p.name}
                        className={`p-2 rounded-lg border text-[11px] ${
                          done
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="font-bold">{p.name}</div>
                        <div className="font-mono-num">{formatGameTime(p.minutes)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-950 border border-amber-400/40 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300">Kalender Acara &amp; Tradisi Sunda</span>
                  <button
                    onClick={onOpenTraditions}
                    className="text-xs font-bold text-amber-200 underline"
                  >
                    Cek &amp; Hadiri Acara
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TRADITIONS.map((t) => {
                    const paid = gameState.paidTraditions.some(
                      (entry) => entry === t.id || entry.startsWith(`${t.id}_`)
                    );
                    return (
                      <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs">
                        <div className="font-bold text-amber-100">{t.id}</div>
                        <div className="text-[11px] text-slate-400">
                          Hari ke-{t.dayTrigger} · {t.timeLabel}
                        </div>
                        <div className="text-[10px] text-sky-300">
                          Tempat: {t.locationLabel} · Urunan {formatRupiah(t.urunanAmount)}
                        </div>
                        <div className={`text-[10px] font-bold mt-0.5 ${paid ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {paid ? 'Sudah Berpartisipasi' : 'Menunggu Jadwal'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'kontroler' && (
            <div className="bg-slate-950 border border-amber-400/40 rounded-xl p-4 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                <Gamepad2 className="w-4 h-4" /> Kontrol Controller (Gamepad Mode)
              </div>
              <div>• <strong>Left Stick / D-Pad</strong>: Jalan di Kampung & navigasi menu</div>
              <div>• <strong>Tombol A</strong>: Sapa Warga terdekat / Masuk Gedung / Layani Pembeli</div>
              <div>• <strong>Tombol B</strong>: Kembali / Tutup Modal / Keluar Ruangan</div>
              <div>• <strong>Tombol X</strong>: Buka HP Arga</div>
              <div>• <strong>Tombol Y</strong>: Buka Peta Kampung Sunda</div>
              <div>• <strong>Tombol Menu / Start</strong>: Buka Pengaturan</div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm"
        >
          Tutup HP [B]
        </button>
      </div>
    </div>
  );
};

interface DisplayModeModalProps {
  launchLabel: string;
  onSelectDisplayMode: (fullscreen: boolean) => void;
  onCancel: () => void;
}

export const DisplayModeModal: React.FC<DisplayModeModalProps> = ({
  launchLabel,
  onSelectDisplayMode,
  onCancel,
}) => {
  useUiGamepadAction((btn) => {
    if (btn === 'A') onSelectDisplayMode(true);
    else if (btn === 'X' || btn === 'Y') onSelectDisplayMode(false);
    else if (btn === 'B') onCancel();
  });

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/50 text-amber-300 text-[11px] font-bold mb-2">
            Versi {GAME_VERSION} · Pilihan Layar
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-amber-100">
            Pilih Mode Tampilan Bermain
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {launchLabel} — pilih bermain dalam mode <strong>Layar Penuh (Fullscreen)</strong> atau{' '}
            <strong>Mode Biasa</strong>.
          </p>
        </div>

        <div className="space-y-2.5 mb-4">
          <button
            type="button"
            onClick={() => onSelectDisplayMode(true)}
            className="w-full p-3.5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 hover:brightness-105 text-slate-950 font-bold text-sm flex items-center gap-3 shadow-lg border-2 border-amber-200 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-950/15 flex items-center justify-center shrink-0">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-extrabold">Mainkan Fullscreen (Layar Penuh) [A]</div>
              <div className="text-[11px] text-amber-950 font-semibold">
                Tampilan penuh bebas gangguan bilah browser
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectDisplayMode(false)}
            className="w-full p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-50 font-bold text-sm flex items-center gap-3 border border-amber-400/50 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-950/70 flex items-center justify-center shrink-0 text-amber-300">
              <Minimize2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold">Mainkan Tidak Fullscreen (Mode Biasa) [X]</div>
              <div className="text-[11px] text-slate-300 font-normal">
                Tetap di jendela browser standar
              </div>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold"
        >
          Kembali [B]
        </button>
      </div>
    </div>
  );
};

export const ChangelogAndGuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useUiGamepadAction((btn) => {
    if (btn === 'A' || btn === 'B') onClose();
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[94dvh] flex flex-col">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/60 text-amber-300 text-[11px] font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Versi {GAME_VERSION} · Pembaruan &amp; Panduan
          </div>
          <h2 className="font-display text-2xl font-bold text-amber-200 flex items-center justify-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
            Yang Baru di Versi {GAME_VERSION} &amp; Panduan
          </h2>
          <p className="text-xs text-slate-400 mt-1">Semua fitur terbaru &amp; panduan lengkap Kampung Sunda bersama Arga</p>
        </div>

        <div className="space-y-2.5 overflow-y-auto pr-1 mb-5 text-xs text-slate-200">
          {/* YANG BARU DI VERSI 3.1 */}
          <div className="bg-gradient-to-br from-amber-950/55 via-slate-950 to-emerald-950/45 border-2 border-amber-400/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" /> YANG BARU · VERSI {GAME_VERSION}
              </span>
              <span className="text-[10px] text-amber-200 font-semibold">Edisi Sunda Priangan</span>
            </div>
            <ul className="space-y-1.5 text-slate-200 leading-relaxed">
              <li>
                • <strong>🎥 Kamera Third-Person &amp; Transisi Halus:</strong> Sudut kamera mengikuti di belakang Arga (pilihan ubah ke mode <strong>Klasik</strong> tersedia di menu <strong>Pengaturan → Tampilan</strong>), dilengkapi transisi <strong>fade-to-black sinematik</strong> setiap berpindah tempat serta animasi gestur sapaan warga.
              </li>
              <li>
                • <strong>🌄 Visual Sinematik Realistis:</strong> Pencahayaan <strong>Golden Hour</strong> pagi/sore, <strong>kabut pagi pegunungan</strong>, warna film, bayangan lembut terarah, simulasi <strong>SSAO &amp; Glow</strong>, pantulan genangan air hujan, serta efek <strong>Depth of Field</strong>.
              </li>
              <li>
                • <strong>🎶 Budaya &amp; Kuliner Sunda Baru:</strong> Mainkan <strong>Angklung (Da-Mi-Na-Ti-La, 07.00–18.30)</strong> dan saksikan <strong>Wayang Golek Si Cepot &amp; Semar (malam hari 18.30–23.59 WIB)</strong> langsung di Bumi Ageung, kerja sampingan <strong>Latihan Angklung</strong>, plus kuliner <strong>Seblak Ceker, Karedok, Cilok, Colenak</strong> &amp; <strong>Tutug Oncom</strong>!
              </li>
              <li>
                • <strong>🎲 Arena Permainan Tradisional (Kaulinan Sunda):</strong> Ikuti permainan <strong>Congklak</strong>, <strong>Egrang Bambu</strong>, dan <strong>Sondah (Engklek)</strong> langsung di arena Lapangan SD Sukamaju / Kompleks Warga untuk meraih tambahan <strong>Poin Keaktifan</strong> &amp; uang saku!
              </li>
              <li>
                • <strong>🖥️ Pilihan Layar Fullscreen / Tidak saat Mulai:</strong> Saat mulai bermain atau memuat slot, pemain bisa langsung memilih mode <strong>Fullscreen (Layar Penuh)</strong> atau <strong>Mode Biasa</strong> (plus tombol ubah layar penuh di HUD).
              </li>
              <li>
                • <strong>🧥 Pakaian Hangat (Tahap Elite+) &amp; Kain Sarung (Master+):</strong> Mulai peringkat <strong>Elite</strong>, Arga memakai <strong>jaket &amp; kupluk hangat</strong> saat hujan; mulai <strong>Master</strong>, memakai <strong>Kain Sarung, Koko &amp; Peci</strong> saat sholat.
              </li>
              <li>
                • <strong>🔊 Suara Alam, Masjid &amp; Pasar Asli:</strong> Beduk + Adzan asli, suara jangkrik malam, kokok ayam pagi, rintik hujan dalam ruangan + guntur acak, serta riuh tawar-menawar Pasar Sunda.
              </li>
              <li>
                • <strong>📅 Kalender 12 Bulan &amp; Renovasi Warung:</strong> Penanggalan penuh <strong>JAN–DES</strong>, <strong>Renovasi Warung</strong> (hingga 24 slot), <strong>Misi Harian</strong>, <strong>Prakiraan Cuaca 3 Hari</strong>, dan dukungan penuh <strong>Controller</strong>.
              </li>
            </ul>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="inline-block px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold mr-2">WARUNG ARGA &amp; WARUNG ASIH</span>
            <strong>Warung Arga</strong> (toko milik Arga) hanya boleh buka pukul <strong>09.00 – 17.00 WIB</strong>.
            Saat Adzan tiba, warung tutup otomatis untuk sholat. Renovasi warung untuk membuka lebih banyak slot barang! Untuk ngopi &amp; makan memulihkan energi, mampir ke{' '}
            <strong>Warung Asih</strong> di sampingnya!
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="inline-block px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold mr-2">PERINGKAT, PAKAIAN &amp; KERJA</span>
            Aktivitas berjualan, sapa warga (dengan <strong>salam Basa Sunda sopan</strong>), kerja sampingan interaktif, sholat, memancing, memetik buah &amp; tradisi menaikkan{' '}
            <strong>Peringkat Keaktifan</strong> dari <strong>Warrior → Elite (Pakaian Hangat) → Master (Kain Sarung Sholat) → Grandmaster → Epic → Legend → Mythic</strong>!
            Jam istirahat tidur malam mulai pukul <strong>18.00 – 04.30 WIB</strong> (atau tidur kapan saja dari Kamar Istirahat).
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="inline-block px-2 py-0.5 rounded bg-sky-400 text-slate-950 font-bold mr-2">PASAR &amp; JALAN</span>
            Waspada Mobil, Angkot, Motor, Pedati, Delman &amp; Becak di jalan raya agar tidak tertabrak dan kena biaya
            dokter! Pasar jauh dari kampung: naik Angkot (Rp 5.000 pergi / Rp 5.000 pulang, operasi 07.00–21.00 WIB) atau Delman/Becak, dan
            gunakan jasa kirim Mamang Delman / Becak.
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="inline-block px-2 py-0.5 rounded bg-rose-400 text-slate-950 font-bold mr-2">TRADISI, HP &amp; CONTROLLER</span>
            Datang langsung ke tempat acara warga sesuai jadwalnya (seperti <strong>Wayang Golek malam hari 19.00–23.30</strong>, Botram siang, Ngalaksa pagi) untuk ikut urunan &amp; meramaikan, pantau <strong>10 transaksi terakhir</strong> &amp; <strong>prakiraan cuaca 3 hari</strong> di HP <strong>[X]</strong>, serta mainkan pakai sentuh, keyboard, atau <strong>Controller</strong>!
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm"
        >
          Oke, Ayo Main! [A / B]
        </button>
      </div>
    </div>
  );
};

const VALID_ACCESS_CODE = 'B47URI';

interface AccessCodeModalProps {
  onUnlock: () => void;
}

export const AccessCodeModal: React.FC<AccessCodeModalProps> = ({ onUnlock }) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized === VALID_ACCESS_CODE) {
      soundEngine.angklungSuccess();
      setErrorMsg(null);
      onUnlock();
    } else {
      soundEngine.error();
      setErrorMsg('Kode akses salah. Pastikan kode akses yang dimasukkan sudah benar.');
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-2xl p-5 sm:p-6 shadow-[0_0_55px_rgba(245,158,11,0.35)]"
      >
        <div className="text-center mb-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/60 flex items-center justify-center text-amber-300 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/45 text-amber-300 text-[11px] font-bold mb-1.5">
            Akses Pertama · Sunda Life Simulator
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-amber-100">
            Masukkan Kode Akses
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Untuk mengakses permainan pertama kali, masukkan kode akses Anda. Setelah berhasil, Anda bisa langsung bermain dan tidak perlu memasukkannya lagi.
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label
              htmlFor="access-code-input"
              className="block text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1.5"
            >
              Kode Akses (Otomatis Huruf Kapital)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="access-code-input"
                type="text"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                maxLength={12}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="KETIK KODE AKSES..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border-2 border-amber-400/60 focus:border-amber-300 focus:outline-none text-amber-100 font-mono-num text-base sm:text-lg font-extrabold tracking-[0.25em] uppercase placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:font-normal placeholder:text-slate-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="px-3 py-2 rounded-lg bg-rose-950/75 border border-rose-400/60 text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 hover:brightness-105 text-slate-950 font-display font-extrabold text-base shadow-[0_4px_0_#92400e] active:translate-y-0.5 transition-all"
        >
          Verifikasi &amp; Masuk Game
        </button>
      </form>
    </div>
  );
};
