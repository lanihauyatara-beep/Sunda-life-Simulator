import {
  GameSettings,
  GameState,
  ItemDef,
  NpcDef,
  PrayerName,
  RankTierInfo,
  RankTierName,
  SceneDef,
  SceneId,
  SeasonType,
  SideJobDef,
  TraditionDef,
  VehicleType,
  WeatherCondition,
  WeatherForecastDay,
  FinancialTransaction,
  DailyMissionTask,
  DailyMissionTaskId,
  DailyMissionsState,
} from '../types/game';

export const ASSETS = {
  cover: '/src/assets/images/cover_sunda_pak_guruai_1795397943135.jpg',
  kampung_warung: '/src/assets/images/bg_kampung_sunda_main_1795397942643.jpg',
  sawah_lisung: '/src/assets/images/bg_sawah_lisung_1795395400813.jpg',
  kompleks_warga: '/src/assets/images/bg_kompleks_sunda_1795397942424.jpg',
  bumi_ageung: '/src/assets/images/bg_bumi_ageung_1795395400437.jpg',
  pasar: '/src/assets/images/bg_pasar_sunda_1795395400324.jpg',
  warung_interior: '/src/assets/images/bg_warung_arga_interior_1795397943542.jpg',
  warung_asih: '/src/assets/images/bg_warung_asih_ngopi_1795397943242.jpg',
  rumah_interior: '/src/assets/images/bg_rumah_interior_1795395401017.jpg',
  hutan_air: '/src/assets/images/bg_hutan_air_1795395400264.jpg',
  sekolah: '/src/assets/images/bg_sekolah_sunda_1795395400857.jpg',
};

export const RANK_TIER_DEFS: {
  tier: RankTierName;
  minPoints: number;
  maxPoints: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}[] = [
  {
    tier: 'Warrior',
    minPoints: 0,
    maxPoints: 99,
    badgeBg: 'bg-stone-800',
    badgeText: 'text-stone-200',
    badgeBorder: 'border-stone-400',
  },
  {
    tier: 'Elite',
    minPoints: 100,
    maxPoints: 249,
    badgeBg: 'bg-slate-800',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-400',
  },
  {
    tier: 'Master',
    minPoints: 250,
    maxPoints: 499,
    badgeBg: 'bg-amber-950',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-400',
  },
  {
    tier: 'Grandmaster',
    minPoints: 500,
    maxPoints: 849,
    badgeBg: 'bg-emerald-950',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-400',
  },
  {
    tier: 'Epic',
    minPoints: 850,
    maxPoints: 1299,
    badgeBg: 'bg-teal-950',
    badgeText: 'text-teal-200',
    badgeBorder: 'border-teal-400',
  },
  {
    tier: 'Legend',
    minPoints: 1300,
    maxPoints: 1999,
    badgeBg: 'bg-orange-950',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-400',
  },
  {
    tier: 'Mythic',
    minPoints: 2000,
    maxPoints: Infinity,
    badgeBg: 'bg-rose-950',
    badgeText: 'text-yellow-300',
    badgeBorder: 'border-yellow-400',
  },
];

export function computeEffectiveActivityPoints(state: Partial<GameState>): number {
  if (typeof state.activityPoints === 'number' && state.activityPoints >= 0) {
    return state.activityPoints;
  }
  const sales = state.totalSalesCount ?? 0;
  const rev = state.totalRevenue ?? 0;
  const day = state.day ?? 1;
  const greeted = state.greetedNpcsToday?.length ?? 0;
  const paidTrad = state.paidTraditions?.length ?? 0;
  return (day - 1) * 15 + sales * 12 + Math.floor(rev / 25000) * 8 + greeted * 6 + paidTrad * 30;
}

export function getPlayerRankInfo(points: number): RankTierInfo {
  const safePts = Math.max(0, Math.floor(points));
  let idx = 0;
  for (let i = 0; i < RANK_TIER_DEFS.length; i++) {
    if (safePts >= RANK_TIER_DEFS[i].minPoints) idx = i;
  }
  const def = RANK_TIER_DEFS[idx];
  const nextDef = RANK_TIER_DEFS[idx + 1] ?? null;

  if (!nextDef) {
    return {
      tier: def.tier,
      division: `★ ${Math.floor((safePts - def.minPoints) / 100)}`,
      fullLabel: `${def.tier} ★${Math.floor((safePts - def.minPoints) / 100)}`,
      points: safePts,
      minPoints: def.minPoints,
      nextThreshold: null,
      nextTierName: null,
      progressPct: 100,
      badgeBg: def.badgeBg,
      badgeText: def.badgeText,
      badgeBorder: def.badgeBorder,
    };
  }

  const span = nextDef.minPoints - def.minPoints;
  const inTier = safePts - def.minPoints;
  const third = span / 3;
  const division = inTier < third ? 'III' : inTier < third * 2 ? 'II' : 'I';
  const progressPct = Math.max(0, Math.min(100, Math.round((inTier / span) * 100)));

  return {
    tier: def.tier,
    division,
    fullLabel: `${def.tier} ${division}`,
    points: safePts,
    minPoints: def.minPoints,
    nextThreshold: nextDef.minPoints,
    nextTierName: nextDef.tier,
    progressPct,
    badgeBg: def.badgeBg,
    badgeText: def.badgeText,
    badgeBorder: def.badgeBorder,
  };
}

export interface WarungRenovationTier {
  level: number;
  name: string;
  slotCount: number;
  cost: number;
  recommendedRanks: RankTierName[];
  rankRequirementLabel: string;
  description: string;
  unlockedItemIds: string[];
}

export const WARUNG_RENOVATION_TIERS: WarungRenovationTier[] = [
  {
    level: 0,
    name: 'Warung Bambu Awal',
    slotCount: 8,
    cost: 0,
    recommendedRanks: ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic'],
    rankRequirementLabel: 'Terbuka sejak awal',
    description: 'Etalase awal dengan 8 slot kebutuhan pokok harian kampung.',
    unlockedItemIds: [
      'kopi_kapal',
      'teh_manis',
      'gorengan',
      'beras_1kg',
      'minyak_1l',
      'telur_setengah',
      'gas_3kg',
      'galon_air',
    ],
  },
  {
    level: 1,
    name: 'Warung Kayu Semi-Permanen',
    slotCount: 12,
    cost: 175000,
    recommendedRanks: ['Grandmaster', 'Epic', 'Legend', 'Mythic'],
    rankRequirementLabel: 'Rank Grandmaster+ atau Uang > Rp 175.000',
    description: 'Menambah rak jajanan tradisional Sunda: Mie Instan, Surabi, Peuyeum & Bajigur (+4 slot).',
    unlockedItemIds: ['mie_instan', 'surabi', 'peuyeum', 'bajigur'],
  },
  {
    level: 2,
    name: 'Warung Juragan Grandmaster',
    slotCount: 17,
    cost: 350000,
    recommendedRanks: ['Grandmaster', 'Epic', 'Legend', 'Mythic'],
    rankRequirementLabel: 'Rank Grandmaster+ atau Uang > Rp 350.000',
    description: 'Etalase kaca & kanopi musiman: Jas Hujan, Payung, Bandrek, Minyak Angin & Es Cendol (+5 slot).',
    unlockedItemIds: ['jas_hujan', 'payung_lipat', 'bandrek_hangat', 'minyak_angin', 'es_cendol'],
  },
  {
    level: 3,
    name: 'Toko Kelontong Legend Priangan',
    slotCount: 22,
    cost: 600000,
    recommendedRanks: ['Legend', 'Mythic'],
    rankRequirementLabel: 'Rank Legend+ atau Uang > Rp 600.000',
    description: 'Warung termegah di Sukamaju! Membuka seluruh 22 barang termasuk Caping & Hasil Alam segar (+5 slot).',
    unlockedItemIds: ['caping_bambu', 'ikan_mas', 'ikan_dewa', 'buah_kebun', 'herbal_hutan'],
  },
];

export function getUnlockedWarungItemIds(renovationLevel = 0): string[] {
  const safeLevel = Math.max(0, Math.min(WARUNG_RENOVATION_TIERS.length - 1, Math.floor(renovationLevel)));
  const ids: string[] = [];
  for (let i = 0; i <= safeLevel; i++) {
    ids.push(...WARUNG_RENOVATION_TIERS[i].unlockedItemIds);
  }
  return ids;
}

export function getWarungRenovationInfo(state: Partial<GameState>) {
  const currentLevel = Math.max(
    0,
    Math.min(WARUNG_RENOVATION_TIERS.length - 1, Math.floor(state.warungRenovationLevel ?? 0))
  );
  const currentTier = WARUNG_RENOVATION_TIERS[currentLevel];
  const nextTier =
    currentLevel < WARUNG_RENOVATION_TIERS.length - 1
      ? WARUNG_RENOVATION_TIERS[currentLevel + 1]
      : null;
  const rankInfo = getPlayerRankInfo(computeEffectiveActivityPoints(state));
  const money = state.money ?? 0;

  if (!nextTier) {
    return {
      currentLevel,
      currentTier,
      nextTier: null,
      rankInfo,
      meetsRank: true,
      moneyExceedsCost: false,
      canAfford: false,
      canRenovate: false,
      unlockedItemIds: getUnlockedWarungItemIds(currentLevel),
    };
  }

  const meetsRank = nextTier.recommendedRanks.includes(rankInfo.tier);
  const moneyExceedsCost = money > nextTier.cost;
  const canAfford = money >= nextTier.cost;
  const canRenovate = (meetsRank || moneyExceedsCost) && canAfford;

  return {
    currentLevel,
    currentTier,
    nextTier,
    rankInfo,
    meetsRank,
    moneyExceedsCost,
    canAfford,
    canRenovate,
    unlockedItemIds: getUnlockedWarungItemIds(currentLevel),
  };
}

export interface GreetingOption {
  id: string;
  text: string;
  textId: string;
  isAppropriate: boolean;
  bonusPoints: number;
  npcReaction: string;
  npcReactionId: string;
  feedbackLabel: string;
}

export function getGreetingOptionsForNpc(npc: NpcDef, minutesOfDay: number): GreetingOption[] {
  const hour = (minutesOfDay / 60) % 24;
  const timeSu =
    hour >= 4 && hour < 11
      ? 'énjing'
      : hour >= 11 && hour < 15
      ? 'siang'
      : hour >= 15 && hour < 18
      ? 'sonten'
      : 'wengi';
  const timeId =
    hour >= 4 && hour < 11
      ? 'pagi'
      : hour >= 11 && hour < 15
      ? 'siang'
      : hour >= 15 && hour < 18
      ? 'sore'
      : 'malam';
  const wrongTimeSu = timeSu === 'énjing' ? 'wengi' : 'énjing';
  const wrongTimeId = timeId === 'pagi' ? 'malam' : 'pagi';

  const isElderOrReligious =
    npc.id === 'ustaz_hidayat' ||
    npc.id === 'abah_karta' ||
    npc.id === 'pak_rt_dedi' ||
    npc.id === 'aki_jaya';

  const appropriateOpt: GreetingOption =
    npc.id === 'ustaz_hidayat'
      ? {
          id: 'polite_sunda',
          text: `Assalamualaikum, punten wilujeng ${timeSu} Pak Ustaz. Kumaha damang?`,
          textId: `Assalamualaikum, permisi selamat ${timeId} Pak Ustaz. Bagaimana kabarnya?`,
          isAppropriate: true,
          bonusPoints: 6,
          npcReaction: 'Waalaikumsalam Jang Arga, alhamdulillah pangéstu. Sopan pisan anjeun mah!',
          npcReactionId: 'Waalaikumsalam Nak Arga, alhamdulillah baik. Kamu sopan sekali!',
          feedbackLabel: '+6 Poin Bahasa Sunda Lemes & Adab Tepat Waktu',
        }
      : isElderOrReligious
      ? {
          id: 'polite_sunda',
          text: `Punten, sampurasun ${npc.name}. Wilujeng ${timeSu}, kumaha damang?`,
          textId: `Permisi, sampurasun ${npc.name}. Selamat ${timeId}, bagaimana kabarnya?`,
          isAppropriate: true,
          bonusPoints: 6,
          npcReaction: 'Rampés Jang Arga! Alhamdulillah damang, resep ningali budak ngora nu tata krama.',
          npcReactionId: 'Rampes Nak Arga! Alhamdulillah sehat, senang melihat anak muda bertata krama.',
          feedbackLabel: '+6 Poin Bahasa Sunda Lemes & Tata Krama',
        }
      : {
          id: 'polite_sunda',
          text: `Sampurasun ${npc.name}! Wilujeng ${timeSu}, mugia séhat salawasna.`,
          textId: `Permisi ${npc.name}! Selamat ${timeId}, semoga sehat selalu.`,
          isAppropriate: true,
          bonusPoints: 6,
          npcReaction: 'Rampés Arga! Wah ramah pisan euy salamna, nuhun pisan!',
          npcReactionId: 'Rampes Arga! Wah ramah sekali salamnya, terima kasih banyak!',
          feedbackLabel: '+6 Poin Bahasa Sunda Akrab & Sopan',
        };

  const casualMismatchOpt: GreetingOption = isElderOrReligious
    ? {
        id: 'casual_slang',
        text: `Eh ${npc.name}, lagi santai aja nih? Gimana kabarnya bro?`,
        textId: `Eh ${npc.name}, lagi santai saja nih? Bagaimana kabarnya bro?`,
        isAppropriate: false,
        bonusPoints: 0,
        npcReaction: 'Eh muhun Jang... mugia tetep diajar tata krama nyarios ka kolot nya.',
        npcReactionId: 'Eh iya Nak... semoga tetap belajar tata krama berbicara kepada yang lebih tua ya.',
        feedbackLabel: 'Bahasa santai kurang pas untuk sesepuh (+0 Poin Bonus)',
      }
    : {
        id: 'casual_slang',
        text: `Woy ${npc.name}, tumben nongkrong di sini, lagi gabut ya?`,
        textId: `Hei ${npc.name}, tumben nongkrong di sini, lagi bosan ya?`,
        isAppropriate: false,
        bonusPoints: 0,
        npcReaction: 'Heh si Arga meni kasar kitu nyariosna, tapi nya teu nanaon lah.',
        npcReactionId: 'Heh si Arga agak kasar bicaranya, tapi ya sudahlah.',
        feedbackLabel: 'Bahasa gaul kurang sopan dalam adat Sunda (+0 Poin Bonus)',
      };

  const wrongTimeOrRudeOpt: GreetingOption = {
    id: 'wrong_time',
    text: `Wilujeng ${wrongTimeSu} ${npc.name}! Permisi, minggir heula sakedap.`,
    textId: `Selamat ${wrongTimeId} ${npc.name}! Permisi, minggir sebentar.`,
    isAppropriate: false,
    bonusPoints: 0,
    npcReaction: `Ayeuna mah tos ${timeId} atuh Arga, sanés ${wrongTimeId}... tong rusuh teuing!`,
    npcReactionId: `Sekarang sudah ${timeId} Arga, bukan ${wrongTimeId}... jangan terlalu terburu-buru!`,
    feedbackLabel: `Salam kurang sesuai waktu (sekarang ${timeId}) (+0 Poin Bonus)`,
  };

  // Deterministic rotation per NPC + time bucket so correct answer position varies naturally
  const seed = (npc.name.length + Math.floor(hour)) % 3;
  const list = [appropriateOpt, casualMismatchOpt, wrongTimeOrRudeOpt];
  return [list[seed], list[(seed + 1) % 3], list[(seed + 2) % 3]];
}

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 75,
  sfxVolume: 85,
  ambientVolume: 80,
  serveMode: 'klik',
  graphicsQuality: 'sedang',
  batterySaver: false,
  language: 'id',
  rogAllyMode: true,
};

export function formatRupiah(amount: number): string {
  const abs = Math.round(Math.abs(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function appendTransaction(
  existing: FinancialTransaction[] | undefined,
  entry: Omit<FinancialTransaction, 'id'>
): FinancialTransaction[] {
  const nextItem: FinancialTransaction = {
    ...entry,
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
  return [nextItem, ...(existing ?? [])].slice(0, 10);
}

const DAILY_MISSION_TEMPLATES: Record<
  DailyMissionTaskId,
  Omit<DailyMissionTask, 'progress' | 'claimed'>
> = {
  greet_warga: {
    id: 'greet_warga',
    label: 'Sapa 5 warga kampung',
    target: 5,
    rewardPoints: 15,
    rewardMoney: 10000,
  },
  sell_items: {
    id: 'sell_items',
    label: 'Jual 5 item di Warung Arga',
    target: 5,
    rewardPoints: 20,
    rewardMoney: 15000,
  },
  forage_herbal: {
    id: 'forage_herbal',
    label: 'Kumpulkan 1 rempah hutan',
    target: 1,
    rewardPoints: 18,
    rewardMoney: 12000,
  },
  catch_fish: {
    id: 'catch_fish',
    label: 'Tangkap 2 ikan di sungai',
    target: 2,
    rewardPoints: 16,
    rewardMoney: 12000,
  },
  side_job: {
    id: 'side_job',
    label: 'Selesaikan 1 kerja sampingan',
    target: 1,
    rewardPoints: 18,
    rewardMoney: 15000,
  },
  pray_jamaah: {
    id: 'pray_jamaah',
    label: 'Tunaikan 3 waktu sholat',
    target: 3,
    rewardPoints: 18,
    rewardMoney: 10000,
  },
};

export const DAILY_MISSION_GRAND_BONUS = {
  points: 25,
  money: 25000,
};

export function generateDailyMissions(day: number): DailyMissionsState {
  // Day 1 & even rotation always feature the core trio; other days rotate cleanly with 3 varied tasks
  const pools: DailyMissionTaskId[][] = [
    ['greet_warga', 'sell_items', 'forage_herbal'],
    ['greet_warga', 'sell_items', 'catch_fish'],
    ['greet_warga', 'forage_herbal', 'side_job'],
    ['sell_items', 'forage_herbal', 'pray_jamaah'],
  ];
  const chosenIds = pools[(Math.max(1, day) - 1) % pools.length];
  return {
    day,
    bonusClaimed: false,
    tasks: chosenIds.map((id) => ({
      ...DAILY_MISSION_TEMPLATES[id],
      progress: 0,
      claimed: false,
    })),
  };
}

export function ensureDailyMissions(
  day: number,
  existing?: DailyMissionsState,
  greetedCount = 0,
  prayedCount = 0
): DailyMissionsState {
  const base = existing && existing.day === day ? existing : generateDailyMissions(day);
  return {
    ...base,
    tasks: base.tasks.map((task) => {
      if (task.id === 'greet_warga') {
        return {
          ...task,
          progress: Math.min(task.target, Math.max(task.progress, greetedCount)),
        };
      }
      if (task.id === 'pray_jamaah') {
        return {
          ...task,
          progress: Math.min(task.target, Math.max(task.progress, prayedCount)),
        };
      }
      return task;
    }),
  };
}

export function advanceDailyMissionProgress(
  missions: DailyMissionsState | undefined,
  day: number,
  taskId: DailyMissionTaskId,
  delta: number,
  greetedCount = 0,
  prayedCount = 0
): DailyMissionsState {
  const base = ensureDailyMissions(day, missions, greetedCount, prayedCount);
  return {
    ...base,
    tasks: base.tasks.map((task) =>
      task.id === taskId
        ? { ...task, progress: Math.min(task.target, task.progress + delta) }
        : task
    ),
  };
}

export function formatGameTime(minutesOfDay: number): string {
  const m = ((Math.floor(minutesOfDay) % 1440) + 1440) % 1440;
  const hh = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${hh}.${mm}`;
}

const HARI_NAMES = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];
const BULAN_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const BULAN_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function formatGameDate(day: number): string {
  const safeDay = Math.max(1, Math.floor(Number.isFinite(day) ? day : 1));
  const hari = HARI_NAMES[(safeDay - 1) % 7];

  let remaining = safeDay - 1;
  const year = Math.floor(remaining / 365) + 1;
  remaining = remaining % 365;

  let bulanIdx = 0;
  while (bulanIdx < BULAN_DAYS.length - 1 && remaining >= BULAN_DAYS[bulanIdx]) {
    remaining -= BULAN_DAYS[bulanIdx];
    bulanIdx++;
  }

  const tanggal = remaining + 1;
  const bulan = BULAN_NAMES[bulanIdx];
  return year > 1 ? `${hari}, ${tanggal} ${bulan} (Thn ${year})` : `${hari}, ${tanggal} ${bulan}`;
}

export const SEASON_META: Record<
  SeasonType,
  { label: string; shortLabel: string; advice: string }
> = {
  kemarau: {
    label: 'Musim Kemarau (Terik)',
    shortLabel: 'Kemarau',
    advice: 'Siang cenderung terik. Warga banyak mencari Es Cendol, Teh Manis & Caping.',
  },
  hujan: {
    label: 'Musim Hujan',
    shortLabel: 'Musim Hujan',
    advice: 'Hujan turun berkala (tidak terus-menerus). Warga banyak mencari Jas Hujan, Payung & Bandrek.',
  },
};

export const WEATHER_META: Record<
  WeatherCondition,
  { label: string; emoji: string; badgeBg: string; badgeText: string; isRainy: boolean }
> = {
  terik: {
    label: 'Panas Terik',
    emoji: '☀️',
    badgeBg: 'bg-amber-500/20 border-amber-400/70',
    badgeText: 'text-amber-200',
    isRainy: false,
  },
  cerah: {
    label: 'Cerah Sejuk',
    emoji: '🌤️',
    badgeBg: 'bg-sky-500/20 border-sky-300/60',
    badgeText: 'text-sky-100',
    isRainy: false,
  },
  mendung: {
    label: 'Berawan / Mendung',
    emoji: '⛅',
    badgeBg: 'bg-slate-700/75 border-slate-400/60',
    badgeText: 'text-slate-200',
    isRainy: false,
  },
  gerimis: {
    label: 'Gerimis Ringan',
    emoji: '🌦️',
    badgeBg: 'bg-cyan-900/75 border-cyan-400/70',
    badgeText: 'text-cyan-200',
    isRainy: true,
  },
  hujan: {
    label: 'Hujan Turun',
    emoji: '🌧️',
    badgeBg: 'bg-blue-900/80 border-sky-400/80',
    badgeText: 'text-sky-100',
    isRainy: true,
  },
};

export function pickRandomSeason(): SeasonType {
  return Math.random() < 0.5 ? 'hujan' : 'kemarau';
}

export function rollNextWeather(
  season: SeasonType,
  currentWeather: WeatherCondition,
  minutesOfDay: number
): { weather: WeatherCondition; durationMin: number } {
  const hour = (minutesOfDay / 60) % 24;
  const isDaytimePeak = hour >= 10 && hour < 15.5;

  if (season === 'hujan') {
    // Walaupun musim hujan, hujan tidak turun terus-menerus: selang-seling hujan/gerimis dan reda (mendung/cerah)
    const wasRainy = currentWeather === 'hujan' || currentWeather === 'gerimis';
    const r = Math.random();
    if (wasRainy) {
      // Setelah hujan/gerimis, mayoritas mereda menjadi mendung atau cerah berawan
      if (r < 0.52) return { weather: 'mendung', durationMin: 80 + Math.floor(Math.random() * 65) };
      if (r < 0.85) return { weather: 'cerah', durationMin: 75 + Math.floor(Math.random() * 60) };
      return { weather: 'gerimis', durationMin: 55 + Math.floor(Math.random() * 45) };
    }
    // Dari mendung/cerah di musim hujan -> bisa turun hujan/gerimis atau tetap mendung
    if (r < 0.36) return { weather: 'hujan', durationMin: 60 + Math.floor(Math.random() * 55) };
    if (r < 0.65) return { weather: 'gerimis', durationMin: 50 + Math.floor(Math.random() * 50) };
    if (r < 0.88) return { weather: 'mendung', durationMin: 70 + Math.floor(Math.random() * 60) };
    return { weather: 'cerah', durationMin: 75 + Math.floor(Math.random() * 55) };
  }

  // Musim Kemarau: siang dominan terik, pagi/sore cerah atau sesekali berawan tipis
  const r = Math.random();
  if (isDaytimePeak) {
    if (r < 0.76) return { weather: 'terik', durationMin: 110 + Math.floor(Math.random() * 75) };
    if (r < 0.92) return { weather: 'cerah', durationMin: 95 + Math.floor(Math.random() * 60) };
    return { weather: 'mendung', durationMin: 60 + Math.floor(Math.random() * 45) };
  }
  if (r < 0.68) return { weather: 'cerah', durationMin: 110 + Math.floor(Math.random() * 80) };
  if (r < 0.88) return { weather: 'terik', durationMin: 90 + Math.floor(Math.random() * 60) };
  return { weather: 'mendung', durationMin: 65 + Math.floor(Math.random() * 45) };
}

export function rollInitialSeasonAndWeather(minutesOfDay: number): {
  season: SeasonType;
  weather: WeatherCondition;
  weatherRemainingMin: number;
} {
  const season = pickRandomSeason();
  const rolled = rollNextWeather(season, 'mendung', minutesOfDay);
  return {
    season,
    weather: rolled.weather,
    weatherRemainingMin: rolled.durationMin,
  };
}

export function generateForecastDay(
  day: number,
  prevSeason: SeasonType,
  forcedSeason?: SeasonType
): WeatherForecastDay {
  const nextSeason: SeasonType =
    forcedSeason ??
    (Math.random() < (prevSeason === 'hujan' ? 0.28 : 0.25)
      ? prevSeason === 'hujan'
        ? 'kemarau'
        : 'hujan'
      : prevSeason);

  if (nextSeason === 'hujan') {
    const rM = Math.random();
    const rA = Math.random();
    const rE = Math.random();
    const morning: WeatherCondition = rM < 0.48 ? 'cerah' : rM < 0.82 ? 'mendung' : 'gerimis';
    const afternoon: WeatherCondition = rA < 0.44 ? 'hujan' : rA < 0.76 ? 'gerimis' : 'mendung';
    const evening: WeatherCondition = rE < 0.34 ? 'hujan' : rE < 0.68 ? 'gerimis' : rE < 0.9 ? 'mendung' : 'cerah';
    const rainChancePct = 58 + ((day * 11 + Math.floor(Math.random() * 22)) % 33);
    return { day, season: nextSeason, morning, afternoon, evening, rainChancePct };
  }

  const rM = Math.random();
  const rA = Math.random();
  const rE = Math.random();
  const morning: WeatherCondition = rM < 0.74 ? 'cerah' : rM < 0.9 ? 'terik' : 'mendung';
  const afternoon: WeatherCondition = rA < 0.76 ? 'terik' : rA < 0.94 ? 'cerah' : 'mendung';
  const evening: WeatherCondition = rE < 0.76 ? 'cerah' : 'mendung';
  const rainChancePct = 5 + ((day * 7 + Math.floor(Math.random() * 12)) % 18);
  return { day, season: nextSeason, morning, afternoon, evening, rainChancePct };
}

/**
 * Keeps a consistent 4-day rolling weather window:
 * index 0 = today (currentDay), index 1..3 = upcoming 3-day forecast (Besok, Lusa, Hari +3).
 */
export function ensureWeatherForecast(
  currentDay: number,
  currentSeason: SeasonType,
  currentWeather: WeatherCondition,
  existing?: WeatherForecastDay[]
): WeatherForecastDay[] {
  const byDay = new Map<number, WeatherForecastDay>();
  if (Array.isArray(existing)) {
    for (const entry of existing) {
      if (entry && typeof entry.day === 'number') {
        byDay.set(entry.day, entry);
      }
    }
  }

  const result: WeatherForecastDay[] = [];
  let prevSeason = currentSeason;
  for (let offset = 0; offset <= 3; offset++) {
    const targetDay = currentDay + offset;
    const saved = byDay.get(targetDay);
    if (saved && (offset > 0 || saved.season === currentSeason)) {
      result.push(saved);
      prevSeason = saved.season;
    } else {
      const generated = generateForecastDay(
        targetDay,
        prevSeason,
        offset === 0 ? currentSeason : undefined
      );
      if (offset === 0) {
        generated.morning = currentWeather;
      }
      result.push(generated);
      prevSeason = generated.season;
    }
  }
  return result;
}

export function getForecastPlanningAdvice(fc: WeatherForecastDay): {
  stockTip: string;
  outdoorTip: string;
} {
  const hasAfternoonRain = fc.afternoon === 'hujan' || fc.afternoon === 'gerimis';
  const hasMorningRain = fc.morning === 'hujan' || fc.morning === 'gerimis';

  if (fc.season === 'hujan') {
    return {
      stockTip: 'Kulakan Jas Hujan, Payung Lipat, Bandrek & Bajigur di Pasar sebelum hujan turun.',
      outdoorTip: hasMorningRain
        ? 'Pagi berpotensi gerimis—utamakan buka warung & naik Angkot/Delman saat ke Pasar.'
        : hasAfternoonRain
        ? 'Manfaatkan pagi hari untuk mancing di Area Air, petik buah, atau belanja Pasar.'
        : 'Langit berawan sejuk; aman untuk keliling kampung & kerja sampingan.',
    };
  }

  return {
    stockTip:
      fc.afternoon === 'terik'
        ? 'Stok Es Cendol, Teh Manis & Caping Bambu—siang terik bikin minuman dingin laris!'
        : 'Stok kebutuhan pokok (Beras, Minyak, Gorengan) tetap stabil sepanjang hari.',
    outdoorTip:
      fc.afternoon === 'terik'
        ? 'Terik siang cukup terik: ke Pasar atau kebun buah lebih nyaman pagi (06.00–10.00 WIB).'
        : 'Cuaca kemarau sejuk mendukung memancing, bertani di sawah, & kerja sampingan.',
  };
}

export const PRAYER_SCHEDULE: { name: PrayerName; minutes: number; label: string; info: string }[] = [
  {
    name: 'Subuh',
    minutes: 4 * 60 + 35,
    label: '04.35 WIB · Subuh',
    info: 'Fajar menyingsing di Priangan. Awali hari dengan sholat Subuh sebelum mencari rezeki.',
  },
  {
    name: 'Dzuhur',
    minutes: 12 * 60,
    label: '12.00 WIB · Dzuhur',
    info: 'Adzan Dzuhur berkumandang! Warung Arga wajib ditutup sejenak untuk menunaikan sholat.',
  },
  {
    name: 'Ashar',
    minutes: 15 * 60 + 15,
    label: '15.15 WIB · Ashar',
    info: 'Waktu Ashar tiba! Tutup sementara warung untuk sholat berjamaah atau di rumah.',
  },
  {
    name: 'Maghrib',
    minutes: 18 * 60,
    label: '18.00 WIB · Maghrib',
    info: 'Mentari terbenam di balik gunung. Mari tunaikan sholat Maghrib di Masjid Al-Ikhlas.',
  },
  {
    name: 'Isya',
    minutes: 19 * 60 + 15,
    label: '19.15 WIB · Isya',
    info: 'Malam semakin tenang. Tunaikan sholat Isya sebelum bersiap istirahat.',
  },
];

// Harga barang sesuai harga pasar & warung Indonesia saat ini (dalam Rupiah)
export const ITEMS: ItemDef[] = [
  {
    id: 'kopi_kapal',
    name: 'Kopi Sachet',
    sundaName: 'Kopi Hideung',
    category: 'warung',
    wholesalePrice: 1500,
    retailPrice: 2500,
    description: 'Kopi bubuk hitam favorit warga saat pagi & ronda.',
    emojiIcon: '☕',
  },
  {
    id: 'teh_manis',
    name: 'Teh Celup / Botol',
    sundaName: 'Enteh Amis',
    category: 'warung',
    seasonTag: 'kemarau',
    wholesalePrice: 2500,
    retailPrice: 4000,
    description: 'Minuman teh segar penghilang dahaga saat terik.',
    emojiIcon: '🧋',
  },
  {
    id: 'mie_instan',
    name: 'Mie Instan',
    sundaName: 'Emie Instan',
    category: 'warung',
    wholesalePrice: 2800,
    retailPrice: 4000,
    description: 'Stok wajib warung paling cepat laku.',
    emojiIcon: '🍜',
  },
  {
    id: 'gorengan',
    name: 'Gorengan Bala-bala',
    sundaName: 'Bala-bala & Gehu',
    category: 'warung',
    wholesalePrice: 1000,
    retailPrice: 2000,
    description: 'Gorengan hangat renyah cocok teman ngopi.',
    emojiIcon: '🥟',
  },
  {
    id: 'beras_1kg',
    name: 'Beras 1 Kg',
    sundaName: 'Beas Cianjur 1 Kg',
    category: 'warung',
    wholesalePrice: 13500,
    retailPrice: 16000,
    description: 'Beras pulen wangi khas Cianjur.',
    emojiIcon: '🌾',
  },
  {
    id: 'minyak_1l',
    name: 'Minyak Goreng 1L',
    sundaName: 'Minyak Kalapa 1L',
    category: 'warung',
    wholesalePrice: 16500,
    retailPrice: 19500,
    description: 'Minyak goreng kemasan 1 liter untuk dapur warga.',
    emojiIcon: '🫗',
  },
  {
    id: 'telur_setengah',
    name: 'Telur Ayam 1/2 Kg',
    sundaName: 'Endog Hayam',
    category: 'warung',
    wholesalePrice: 14000,
    retailPrice: 17000,
    description: 'Telur ayam negeri segar isi ~8 butir.',
    emojiIcon: '🥚',
  },
  {
    id: 'gas_3kg',
    name: 'Gas LPG 3 Kg',
    sundaName: 'Gas Melon 3 Kg',
    category: 'warung',
    wholesalePrice: 19000,
    retailPrice: 23000,
    description: 'Tabung gas hijau 3 kg kebutuhan pokok ibu-ibu.',
    emojiIcon: '🟢',
  },
  {
    id: 'galon_air',
    name: 'Air Galon Isi Ulang',
    sundaName: 'Cai Galon',
    category: 'warung',
    wholesalePrice: 6000,
    retailPrice: 9000,
    description: 'Air minum bersih galon 19 liter.',
    emojiIcon: '💧',
  },
  {
    id: 'surabi',
    name: 'Surabi Oncom / Kinca',
    sundaName: 'Surabi Sunda',
    category: 'warung',
    wholesalePrice: 2500,
    retailPrice: 5000,
    description: 'Kue tradisional Sunda gurih dan manis.',
    emojiIcon: '🥞',
  },
  {
    id: 'peuyeum',
    name: 'Peuyeum Bandung',
    sundaName: 'Peuyeum Sampeu',
    category: 'warung',
    wholesalePrice: 8000,
    retailPrice: 12000,
    description: 'Tape singkong manis khas tanah Sunda.',
    emojiIcon: '🍠',
  },
  {
    id: 'bajigur',
    name: 'Bajigur Hangat',
    sundaName: 'Bajigur',
    category: 'warung',
    seasonTag: 'hujan',
    wholesalePrice: 3500,
    retailPrice: 6000,
    description: 'Minuman gula aren & santan hangat khas Priangan.',
    emojiIcon: '🍵',
  },
  // Barang khusus musim hujan & cuaca terik (terjual sesuai cuaca & musim)
  {
    id: 'jas_hujan',
    name: 'Jas Hujan Ponco',
    sundaName: 'Jas Hujan',
    category: 'warung',
    seasonTag: 'hujan',
    wholesalePrice: 10000,
    retailPrice: 15000,
    description: 'Jas hujan praktis anti bocor, sangat dicari pengendara saat musim hujan.',
    emojiIcon: '🧥',
  },
  {
    id: 'payung_lipat',
    name: 'Payung Lipat',
    sundaName: 'Payung Kampung',
    category: 'warung',
    seasonTag: 'hujan',
    wholesalePrice: 22000,
    retailPrice: 30000,
    description: 'Payung lipat kuat untuk berteduh ketika hujan turun.',
    emojiIcon: '☂️',
  },
  {
    id: 'bandrek_hangat',
    name: 'Bandrek Jahe Hangat',
    sundaName: 'Bandrek Haneut',
    category: 'warung',
    seasonTag: 'hujan',
    wholesalePrice: 3500,
    retailPrice: 6000,
    description: 'Minuman jahe merah, serai & gula aren penghangat tubuh saat hujan.',
    emojiIcon: '🫖',
  },
  {
    id: 'minyak_angin',
    name: 'Minyak Kayu Putih',
    sundaName: 'Minyak Kayu Bodas',
    category: 'warung',
    seasonTag: 'hujan',
    wholesalePrice: 8000,
    retailPrice: 12000,
    description: 'Minyak hangat pencegah masuk angin sepulang kehujanan.',
    emojiIcon: '🧴',
  },
  {
    id: 'es_cendol',
    name: 'Es Cendol Gula Aren',
    sundaName: 'Es Cendol Dawet',
    category: 'warung',
    seasonTag: 'kemarau',
    wholesalePrice: 4000,
    retailPrice: 7000,
    description: 'Cendol segar dengan santan & gula aren cair dingin untuk siang terik.',
    emojiIcon: '🍧',
  },
  {
    id: 'caping_bambu',
    name: 'Topi Caping Bambu',
    sundaName: 'Duduy / Caping',
    category: 'warung',
    seasonTag: 'kemarau',
    wholesalePrice: 12000,
    retailPrice: 18000,
    description: 'Topi anyaman bambu pelindung terik matahari di sawah dan jalan.',
    emojiIcon: '👒',
  },
  // Menu Warung Asih (Warung Ngopi & Makan Sunda untuk memulihkan energi Arga)
  {
    id: 'ngopi_tubruk',
    name: 'Ngopi Hideung + Bala-bala',
    sundaName: 'Ngopi & Bala-bala',
    category: 'ngopi',
    wholesalePrice: 0,
    retailPrice: 5000,
    energyRestore: 22,
    description: 'Kopi hitam tubruk Priangan dan 2 bala-bala hangat di Warung Asih.',
    emojiIcon: '☕',
  },
  {
    id: 'ngopi_bajigur',
    name: 'Bajigur & Surabi Kinca',
    sundaName: 'Bajigur & Surabi',
    category: 'ngopi',
    seasonTag: 'hujan',
    wholesalePrice: 0,
    retailPrice: 8000,
    energyRestore: 35,
    description: 'Hangatkan badan sambil menyeruput bajigur manis & surabi hangat buatan Teh Asih.',
    emojiIcon: '🍵',
  },
  {
    id: 'es_kelapa_asih',
    name: 'Es Kelapa Muda Gula Aren',
    sundaName: 'Dawegan Tiis',
    category: 'ngopi',
    seasonTag: 'kemarau',
    wholesalePrice: 0,
    retailPrice: 6000,
    energyRestore: 28,
    description: 'Kelapa muda segar pelepas dahaga saat cuaca terik di Warung Asih.',
    emojiIcon: '🥥',
  },
  {
    id: 'makan_tutug',
    name: 'Nasi Tutug Oncom Komplit',
    sundaName: 'Sangu Tutug Oncom',
    category: 'ngopi',
    wholesalePrice: 0,
    retailPrice: 14000,
    energyRestore: 55,
    description: 'Nasi hangat gurih oncom, lalaban, sambal goang, dan tempe goreng di Warung Asih.',
    emojiIcon: '🍛',
  },
  {
    id: 'lotek_sunda',
    name: 'Lotek & Tahu Sumedang',
    sundaName: 'Lotek & Tahu Lembang',
    category: 'ngopi',
    wholesalePrice: 0,
    retailPrice: 12000,
    energyRestore: 45,
    description: 'Sayuran segar bumbu kacang kencur dengan tahu goreng renyah & kerupuk.',
    emojiIcon: '🥗',
  },
  // Hasil alam (mancing, kebun, hutan) yang bisa dijual di warung/pasar
  {
    id: 'ikan_mas',
    name: 'Ikan Mas Segar',
    sundaName: 'Lauk Emas',
    category: 'hasil_alam',
    wholesalePrice: 14000,
    retailPrice: 18000,
    description: 'Hasil pancingan sungai kampung.',
    emojiIcon: '🐟',
  },
  {
    id: 'ikan_dewa',
    name: 'Ikan Dewa Legendaris',
    sundaName: 'Kancra Bodas',
    category: 'hasil_alam',
    wholesalePrice: 45000,
    retailPrice: 60000,
    description: 'Ikan langka suci sungai Sunda, bernilai tinggi!',
    emojiIcon: '🐠',
  },
  {
    id: 'buah_kebun',
    name: 'Buah Kebun Segar',
    sundaName: 'Buah Kebon',
    category: 'hasil_alam',
    wholesalePrice: 4000,
    retailPrice: 7500,
    description: 'Mangga, jambu air, kelapa, dan alpukat petikan kebun.',
    emojiIcon: '🥭',
  },
  {
    id: 'herbal_hutan',
    name: 'Rempah & Madu Hutan',
    sundaName: 'Jamu & Madu Leuweung',
    category: 'hasil_alam',
    wholesalePrice: 12000,
    retailPrice: 18000,
    description: 'Temuan alami dari pinggiran Hutan Tutupan.',
    emojiIcon: '🌿',
  },
];

export const ITEM_MAP: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const VEHICLE_INFO: Record<
  VehicleType,
  {
    label: string;
    speedRange: [number, number];
    medicalCost: number;
    desc: string;
    openMin: number;
    closeMin: number;
    scheduleLabel: string;
    cultureNote: string;
  }
> = {
  angkot: {
    label: 'Angkot Hijau',
    speedRange: [14, 20],
    medicalCost: 120000,
    desc: 'Angkutan kota trayek Kampung - Pasar Tradisional.',
    openMin: 7 * 60, // 07.00 WIB
    closeMin: 21 * 60, // 21.00 WIB
    scheduleLabel: '07.00–21.00 WIB',
    cultureNote: 'Trayek desa aktif pukul 07.00–21.00 WIB',
  },
  motor: {
    label: 'Sepeda Motor',
    speedRange: [19, 27],
    medicalCost: 75000,
    desc: 'Motor warga & ojek pangkalan kampung Sunda.',
    openMin: 5 * 60, // 05.00 WIB (ba'da Subuh)
    closeMin: 23 * 60, // 23.00 WIB (malam)
    scheduleLabel: '05.00–23.00 WIB',
    cultureNote: 'Ojek & motor warga aktif dari Subuh sampai larut malam',
  },
  becak: {
    label: 'Becak Kampung',
    speedRange: [7, 10],
    medicalCost: 50000,
    desc: 'Becak kayuh roda tiga mangkal di persimpangan.',
    openMin: 5 * 60, // 05.00 WIB (warga belanja pagi ke pasar)
    closeMin: 20 * 60, // 20.00 WIB (ba'da Isya)
    scheduleLabel: '05.00–20.00 WIB',
    cultureNote: 'Mangkal sejak pagi buta untuk belanja pasar hingga Isya',
  },
  delman: {
    label: 'Delman Hias',
    speedRange: [8, 12],
    medicalCost: 60000,
    desc: 'Kereta kuda tradisional Sunda milik Mang Tatang.',
    openMin: 6 * 60, // 06.00 WIB
    closeMin: 18 * 60, // 18.00 WIB (Maghrib kuda istirahat)
    scheduleLabel: '06.00–18.00 WIB',
    cultureNote: 'Beroperasi pagi hingga Maghrib sebelum kuda beristirahat',
  },
  pedati: {
    label: 'Pedati Kerbau',
    speedRange: [6, 9],
    medicalCost: 50000,
    desc: 'Pedati kayu tradisional pengangkut hasil panen sawah.',
    openMin: 5 * 60 + 30, // 05.30 WIB
    closeMin: 17 * 60 + 30, // 17.30 WIB (sebelum petang)
    scheduleLabel: '05.30–17.30 WIB',
    cultureNote: 'Mengangkut hasil sawah dari pagi hingga menjelang petang',
  },
  mobil: {
    label: 'Mobil Keluarga',
    speedRange: [18, 25],
    medicalCost: 200000,
    desc: 'Mobil pribadi melaju cukup kencang di jalan desa.',
    openMin: 6 * 60, // 06.00 WIB
    closeMin: 22 * 60, // 22.00 WIB (malam kampung tenang)
    scheduleLabel: '06.00–22.00 WIB',
    cultureNote: 'Kendaraan warga melintas pukul 06.00–22.00 WIB',
  },
};

export function isVehicleOperating(vType: VehicleType, minutesOfDay: number): boolean {
  const info = VEHICLE_INFO[vType];
  const m = ((Math.floor(minutesOfDay) % 1440) + 1440) % 1440;
  if (info.openMin <= info.closeMin) {
    return m >= info.openMin && m < info.closeMin;
  }
  return m >= info.openMin || m < info.closeMin;
}

export function getOperatingVehicles(
  allowed: VehicleType[] | undefined,
  minutesOfDay: number
): VehicleType[] {
  if (!allowed || allowed.length === 0) return [];
  return allowed.filter((v) => isVehicleOperating(v, minutesOfDay));
}

export const TRANSPORT_TO_PASAR_OPTIONS = [
  {
    id: 'angkot',
    name: 'Naik Angkot',
    fare: 5000,
    minutes: 25,
    note: 'Tarif Rp 5.000 · Operasi 07.00–21.00 WIB',
    vehicle: 'angkot' as VehicleType,
  },
  {
    id: 'motor',
    name: 'Ojek Motor Kang Dadan',
    fare: 10000,
    minutes: 12,
    note: 'Cepat sampai · Operasi 05.00–23.00 WIB',
    vehicle: 'motor' as VehicleType,
  },
  {
    id: 'becak',
    name: 'Naik Becak Mang Eman',
    fare: 12000,
    minutes: 35,
    note: 'Santai pagi–malam · Operasi 05.00–20.00 WIB',
    vehicle: 'becak' as VehicleType,
  },
  {
    id: 'delman',
    name: 'Naik Delman Mang Tatang',
    fare: 15000,
    minutes: 30,
    note: 'Khas Sunda · Operasi 06.00–18.00 WIB',
    vehicle: 'delman' as VehicleType,
  },
];

export const DELIVERY_OPTIONS = [
  {
    id: 'sendiri',
    name: 'Bawa Sendiri (Tenteng)',
    ongkir: 0,
    maxUnits: 15,
    vehicle: undefined as VehicleType | undefined,
    note: 'Gratis ongkir, maksimal muat 15 barang (24 jam)',
  },
  {
    id: 'mamang_becak',
    name: 'Kirim Mamang Becak',
    ongkir: 10000,
    maxUnits: 45,
    vehicle: 'becak' as VehicleType | undefined,
    note: 'Ongkir Rp 10.000 (maks 45 pcs) · Operasi 05.00–20.00 WIB',
  },
  {
    id: 'mamang_delman',
    name: 'Kirim Mamang Delman',
    ongkir: 15000,
    maxUnits: 999,
    vehicle: 'delman' as VehicleType | undefined,
    note: 'Ongkir Rp 15.000 tanpa batas · Operasi 06.00–18.00 WIB',
  },
];

export const SCENES: Record<SceneId, SceneDef> = {
  kampung_warung: {
    id: 'kampung_warung',
    name: 'WARUNG ARGA & WARUNG ASIH',
    subtitle: 'Jalan Utama Kampung Sunda',
    bgImage: ASSETS.kampung_warung,
    isIndoor: false,
    hasRoad: true,
    roadPath: {
      points: [
        { x: 4, y: 103 },
        { x: 26, y: 86 },
        { x: 52, y: 65 },
        { x: 70, y: 50 },
        { x: 74, y: 45 },
        { x: 69, y: 41 },
        { x: 52, y: 35 },
      ],
      laneOffset: 2.3,
    },
    roadYMin: 32,
    roadYMax: 98,
    crosswalkX: 26,
    allowedVehicles: ['mobil', 'angkot', 'motor', 'delman', 'becak'],
    obstacles: [
      // Bangunan Warung Arga (milik karakter utama)
      { xMin: 6, xMax: 39, yMin: 14, yMax: 51 },
      // Saung Warung Asih (tempat ngopi & makan)
      { xMin: 39, xMax: 55, yMin: 22, yMax: 42 },
      // Bangunan Masjid Al-Ikhlas
      { xMin: 66, xMax: 96, yMin: 8, yMax: 35 },
      // Rimbun taman & pepohonan kanan bawah
      { xMin: 68, xMax: 100, yMin: 68, yMax: 100 },
    ],
    defaultSpawn: { x: 28, y: 58 },
    hotspots: [
      {
        id: 'enter_warung',
        label: 'Masuk Warung Arga',
        subtitle: 'Kelola toko milik Arga (09.00–17.00)',
        x: 26,
        y: 53,
        actionType: 'enter_scene',
        targetScene: 'warung_interior',
      },
      {
        id: 'enter_warung_asih',
        label: 'Mampir Warung Asih',
        subtitle: 'Ngopi & sarapan Sunda (05.00–22.00)',
        x: 47,
        y: 44,
        actionType: 'enter_scene',
        targetScene: 'warung_asih',
      },
      {
        id: 'masjid_prayer',
        label: 'Masjid Al-Ikhlas',
        subtitle: 'Sholat berjamaah & ketenangan',
        x: 78,
        y: 37,
        actionType: 'pray_masjid',
      },
      {
        id: 'halte_pasar',
        label: 'Halte Ke Pasar',
        subtitle: 'Angkot (07.00–21.00) · Ojek · Becak · Delman',
        x: 16,
        y: 78,
        actionType: 'open_pasar_transport',
      },
    ],
    neighbors: [
      { label: 'Kompleks Rumah Sunda', scene: 'kompleks_warga', direction: 'Kiri' },
      { label: 'SD Negeri Sukamaju', scene: 'sekolah', direction: 'Kanan' },
      { label: 'Sawah & Saung Lisung', scene: 'sawah_lisung', direction: 'Bawah' },
    ],
  },

  warung_interior: {
    id: 'warung_interior',
    name: 'DALAM WARUNG ARGA',
    subtitle: 'Toko Kelontong Milik Arga (09.00–17.00 WIB)',
    bgImage: ASSETS.warung_interior,
    isIndoor: true,
    hasRoad: false,
    defaultSpawn: { x: 52, y: 65 },
    hotspots: [
      {
        id: 'exit_warung',
        label: 'Keluar Warung Arga',
        x: 50,
        y: 86,
        actionType: 'enter_scene',
        targetScene: 'kampung_warung',
        targetSpawn: { x: 28, y: 58 },
      },
    ],
    neighbors: [],
  },

  warung_asih: {
    id: 'warung_asih',
    name: 'WARUNG ASIH (NGOPI & MAKAN)',
    subtitle: 'Saung Kopi, Surabi & Kuliner Sunda (Buka 05.00–22.00 WIB)',
    bgImage: ASSETS.warung_asih,
    isIndoor: true,
    hasRoad: false,
    defaultSpawn: { x: 50, y: 65 },
    hotspots: [
      {
        id: 'exit_warung_asih',
        label: 'Keluar ke Jalan Kampung',
        x: 50,
        y: 86,
        actionType: 'enter_scene',
        targetScene: 'kampung_warung',
        targetSpawn: { x: 47, y: 47 },
      },
    ],
    neighbors: [],
  },

  kompleks_warga: {
    id: 'kompleks_warga',
    name: 'KOMPLEKS IMAH PANGGUNG SUNDA',
    subtitle: 'Rumah Arga · Pak RT · Imah Warga · Pos Ronda',
    bgImage: ASSETS.kompleks_warga,
    isIndoor: false,
    hasRoad: true,
    roadPath: {
      points: [
        { x: 17, y: 86 },
        { x: 47, y: 61 },
        { x: 78, y: 36 },
      ],
      laneOffset: 2.2,
    },
    roadYMin: 34,
    roadYMax: 88,
    crosswalkX: 46,
    allowedVehicles: ['motor', 'angkot', 'mobil', 'becak', 'delman'],
    obstacles: [
      // Pos Ronda kiri
      { xMin: 4, xMax: 18, yMin: 40, yMax: 66 },
      // Imah Panggung Pak RT kiri atas
      { xMin: 12, xMax: 37, yMin: 18, yMax: 48 },
      // Rumah Arga & Imah Warga atas
      { xMin: 36, xMax: 61, yMin: 6, yMax: 36 },
      // Imah panggung warga kanan
      { xMin: 74, xMax: 96, yMin: 30, yMax: 64 },
      // Imah panggung bawah
      { xMin: 43, xMax: 70, yMin: 66, yMax: 92 },
    ],
    defaultSpawn: { x: 38, y: 52 },
    hotspots: [
      {
        id: 'enter_rumah_arga',
        label: 'Masuk Rumah Arga',
        subtitle: 'Ruang Tamu, Dapur & Kamar',
        x: 49,
        y: 39,
        actionType: 'enter_scene',
        targetScene: 'rumah_ruang_tamu',
      },
      {
        id: 'rumah_pak_rt',
        label: 'Imah Pak RT Dedi',
        subtitle: 'Info tradisi & urunan warga',
        x: 25,
        y: 50,
        actionType: 'tradition_board',
      },
      {
        id: 'pos_ronda',
        label: 'Pos Ronda Kampung',
        subtitle: 'Menuju Bale Patemon',
        x: 12,
        y: 68,
        actionType: 'enter_scene',
        targetScene: 'bumi_ageung',
      },
    ],
    neighbors: [
      { label: 'Warung Arga & Warung Asih', scene: 'kampung_warung', direction: 'Kanan' },
      { label: 'Bumi Ageung & Bale Patemon', scene: 'bumi_ageung', direction: 'Kiri' },
      { label: 'Area Air & Hutan Tutupan', scene: 'area_air', direction: 'Atas' },
    ],
  },

  rumah_ruang_tamu: {
    id: 'rumah_ruang_tamu',
    name: 'RUANG TAMU RUMAH ARGA',
    subtitle: 'Rumah Pribadi Arga',
    bgImage: ASSETS.rumah_interior,
    bgPosition: '50% 45%',
    isIndoor: true,
    hasRoad: false,
    defaultSpawn: { x: 50, y: 60 },
    hotspots: [
      {
        id: 'to_kamar',
        label: 'Masuk Kamar Istirahat',
        x: 24,
        y: 52,
        actionType: 'enter_scene',
        targetScene: 'rumah_kamar',
      },
      {
        id: 'to_dapur',
        label: 'Masuk Dapur',
        x: 78,
        y: 56,
        actionType: 'enter_scene',
        targetScene: 'rumah_dapur',
      },
      {
        id: 'exit_house',
        label: 'Keluar Rumah',
        x: 52,
        y: 85,
        actionType: 'enter_scene',
        targetScene: 'kompleks_warga',
        targetSpawn: { x: 49, y: 42 },
      },
    ],
    neighbors: [],
  },

  rumah_dapur: {
    id: 'rumah_dapur',
    name: 'DAPUR RUMAH ARGA',
    subtitle: 'Masak Makanan & Kopi Hangat',
    bgImage: ASSETS.rumah_interior,
    bgPosition: '90% 55%',
    isIndoor: true,
    hasRoad: false,
    defaultSpawn: { x: 68, y: 62 },
    hotspots: [
      {
        id: 'cook_stove',
        label: 'Masak di Kompor / Hawu',
        subtitle: 'Pulihkan energi dengan masakan rumah',
        x: 78,
        y: 56,
        actionType: 'cook_dapur',
      },
      {
        id: 'back_tamu_from_dapur',
        label: 'Ke Ruang Tamu',
        x: 42,
        y: 62,
        actionType: 'enter_scene',
        targetScene: 'rumah_ruang_tamu',
      },
    ],
    neighbors: [],
  },

  rumah_kamar: {
    id: 'rumah_kamar',
    name: 'KAMAR ISTIRAHAT ARGA',
    subtitle: 'Kasur Tidur (18.00 - 04.30) & Sajadah Sholat',
    bgImage: ASSETS.rumah_interior,
    bgPosition: '15% 55%',
    isIndoor: true,
    hasRoad: false,
    defaultSpawn: { x: 35, y: 62 },
    hotspots: [
      {
        id: 'bed_sleep',
        label: 'Tidur / Istirahat',
        subtitle: 'Jam istirahat 18.00 - 04.30 WIB',
        x: 22,
        y: 52,
        actionType: 'sleep_bed',
      },
      {
        id: 'sajadah_pray',
        label: 'Sajadah Sholat',
        subtitle: 'Tunaikan sholat wajib tepat waktu',
        x: 34,
        y: 74,
        actionType: 'pray_home',
      },
      {
        id: 'back_tamu_from_kamar',
        label: 'Ke Ruang Tamu',
        x: 56,
        y: 58,
        actionType: 'enter_scene',
        targetScene: 'rumah_ruang_tamu',
      },
    ],
    neighbors: [],
  },

  sawah_lisung: {
    id: 'sawah_lisung',
    name: 'SAWAH & SAUNG LISUNG',
    subtitle: 'Lumbung Padi, Kebun Buah & Sungai',
    bgImage: ASSETS.sawah_lisung,
    isIndoor: false,
    hasRoad: false,
    obstacles: [
      // Bangunan Saung Lisung (kiri)
      { xMin: 9, xMax: 28, yMin: 16, yMax: 37 },
      // Sungai bagian atas (kecuali jembatan di y: 44..58)
      { xMin: 54, xMax: 65, yMin: 18, yMax: 43 },
      // Sungai bagian bawah
      { xMin: 32, xMax: 50, yMin: 60, yMax: 95 },
    ],
    defaultSpawn: { x: 48, y: 52 },
    hotspots: [
      {
        id: 'saung_lisung_spot',
        label: 'Saung Lisung',
        subtitle: 'Tempat menumbuk padi tradisional',
        x: 22,
        y: 41,
        actionType: 'enter_scene',
        targetScene: 'bumi_ageung',
      },
      {
        id: 'fishing_spot',
        label: 'Memancing di Sungai',
        subtitle: 'Cari ikan segar & Ikan Dewa langka',
        x: 54,
        y: 68,
        actionType: 'fishing',
      },
      {
        id: 'fruit_spot',
        label: 'Kebun Buah Kampung',
        subtitle: 'Petik kelapa, mangga, jambu air, alpukat',
        x: 78,
        y: 35,
        actionType: 'fruit_picking',
      },
    ],
    neighbors: [
      { label: 'Warung Arga & Warung Asih', scene: 'kampung_warung', direction: 'Atas' },
      { label: 'Bumi Ageung & Bale Patemon', scene: 'bumi_ageung', direction: 'Kiri' },
      { label: 'Hutan Tutupan', scene: 'hutan_tutupan', direction: 'Kanan' },
    ],
  },

  bumi_ageung: {
    id: 'bumi_ageung',
    name: 'BUMI AGEUNG & BALE PATEMON',
    subtitle: 'Pusat Adat Sunda & Musyawarah Kampung',
    bgImage: ASSETS.bumi_ageung,
    isIndoor: false,
    hasRoad: false,
    obstacles: [
      // Bangunan Bale Patemon (kiri)
      { xMin: 8, xMax: 41, yMin: 14, yMax: 42 },
      // Bangunan Bumi Ageung (kanan)
      { xMin: 46, xMax: 88, yMin: 8, yMax: 42 },
      // Pagar & pepohonan pinggir kiri-kanan
      { xMin: 0, xMax: 9, yMin: 0, yMax: 100 },
      { xMin: 91, xMax: 100, yMin: 0, yMax: 100 },
    ],
    defaultSpawn: { x: 46, y: 62 },
    hotspots: [
      {
        id: 'bale_patemon_board',
        label: 'Bale Patemon',
        subtitle: 'Agenda Tradisi Sunda & Urunan',
        x: 26,
        y: 46,
        actionType: 'tradition_board',
      },
      {
        id: 'bumi_ageung_hall',
        label: 'Bumi Ageung',
        subtitle: 'Rumah panggung sesepuh adat',
        x: 66,
        y: 46,
        actionType: 'tradition_board',
      },
    ],
    neighbors: [
      { label: 'Kompleks Rumah Warga', scene: 'kompleks_warga', direction: 'Kanan' },
      { label: 'Sawah & Saung Lisung', scene: 'sawah_lisung', direction: 'Bawah' },
      { label: 'Hutan Tutupan', scene: 'hutan_tutupan', direction: 'Atas' },
    ],
  },

  sekolah: {
    id: 'sekolah',
    name: 'SD NEGERI SUKAMAJU',
    subtitle: 'Sekolah Dasar & Lapangan Upacara',
    bgImage: ASSETS.sekolah,
    isIndoor: false,
    hasRoad: true,
    roadPath: {
      points: [
        { x: -5, y: 70 },
        { x: 42, y: 83 },
        { x: 76, y: 93 },
        { x: 105, y: 99 },
      ],
      laneOffset: 2.1,
    },
    roadYMin: 60,
    roadYMax: 95,
    crosswalkX: 43,
    allowedVehicles: ['angkot', 'motor', 'mobil', 'becak'],
    obstacles: [
      // Gedung kelas utama atas
      { xMin: 30, xMax: 92, yMin: 0, yMax: 24 },
      // Gedung kelas kiri
      { xMin: 8, xMax: 27, yMin: 16, yMax: 52 },
      // Gedung kelas kanan
      { xMin: 74, xMax: 96, yMin: 34, yMax: 70 },
    ],
    defaultSpawn: { x: 48, y: 55 },
    hotspots: [
      {
        id: 'halte_sekolah',
        label: 'Halte Sekolah ke Pasar',
        subtitle: 'Angkot Rp 5.000 · Ojek · Becak · Delman',
        x: 34,
        y: 72,
        actionType: 'open_pasar_transport',
      },
    ],
    neighbors: [
      { label: 'Warung Arga & Warung Asih', scene: 'kampung_warung', direction: 'Kiri' },
      { label: 'Area Air & Kebersihan', scene: 'area_air', direction: 'Atas' },
    ],
  },

  hutan_tutupan: {
    id: 'hutan_tutupan',
    name: 'HUTAN TUTUPAN',
    subtitle: 'Leuweung Larangan & Tanaman Herbal Alami',
    bgImage: ASSETS.hutan_air,
    bgPosition: '15% 45%',
    isIndoor: false,
    hasRoad: false,
    obstacles: [
      // Pohon besar & rimba atas
      { xMin: 0, xMax: 100, yMin: 0, yMax: 26 },
      { xMin: 0, xMax: 15, yMin: 20, yMax: 70 },
      // Sungai (kecuali jembatan kayu di y: 54..70)
      { xMin: 42, xMax: 60, yMin: 26, yMax: 53 },
      { xMin: 46, xMax: 68, yMin: 71, yMax: 95 },
    ],
    defaultSpawn: { x: 28, y: 62 },
    hotspots: [
      {
        id: 'forage_herbs',
        label: 'Cari Madu & Rempah Pinggiran',
        subtitle: 'Hormati alam, ambil secukupnya',
        x: 24,
        y: 44,
        actionType: 'forage_hutan',
      },
      {
        id: 'to_area_air',
        label: 'Menuju Area Air & Pancuran',
        x: 68,
        y: 62,
        actionType: 'enter_scene',
        targetScene: 'area_air',
      },
    ],
    neighbors: [
      { label: 'Area Air & Kebersihan', scene: 'area_air', direction: 'Kanan' },
      { label: 'Bumi Ageung & Bale Patemon', scene: 'bumi_ageung', direction: 'Bawah' },
      { label: 'Sawah & Saung Lisung', scene: 'sawah_lisung', direction: 'Kiri' },
    ],
  },

  area_air: {
    id: 'area_air',
    name: 'AREA AIR & KEBERSIHAN',
    subtitle: 'Pancuran Bambu Alami & Sumber Air Bersih',
    bgImage: ASSETS.hutan_air,
    bgPosition: '85% 55%',
    isIndoor: false,
    hasRoad: false,
    obstacles: [
      // Rimba atas & saung pancuran
      { xMin: 0, xMax: 100, yMin: 0, yMax: 24 },
      { xMin: 66, xMax: 90, yMin: 24, yMax: 44 },
      // Sungai dalam kiri teras batu
      { xMin: 38, xMax: 55, yMin: 24, yMax: 95 },
    ],
    defaultSpawn: { x: 68, y: 64 },
    hotspots: [
      {
        id: 'pancuran_bersih',
        label: 'Cuci Muka & Segarkan Badan',
        subtitle: 'Air pegunungan jernih (+15% Energi)',
        x: 68,
        y: 55,
        actionType: 'clean_air',
      },
      {
        id: 'to_hutan_tutupan',
        label: 'Masuk Jalur Hutan Tutupan',
        x: 24,
        y: 62,
        actionType: 'enter_scene',
        targetScene: 'hutan_tutupan',
      },
    ],
    neighbors: [
      { label: 'Hutan Tutupan', scene: 'hutan_tutupan', direction: 'Kiri' },
      { label: 'Kompleks Rumah Warga', scene: 'kompleks_warga', direction: 'Bawah' },
      { label: 'SD Negeri Sukamaju', scene: 'sekolah', direction: 'Kanan' },
    ],
  },

  pasar: {
    id: 'pasar',
    name: 'PASAR TRADISIONAL SUNDA',
    subtitle: 'Kulakan Dagangan & Halte Kendaraan Pulang',
    bgImage: ASSETS.pasar,
    isIndoor: false,
    hasRoad: true,
    roadPath: {
      points: [
        { x: 28, y: 12 },
        { x: 21, y: 23 },
        { x: 25, y: 36 },
        { x: 37, y: 52 },
        { x: 55, y: 76 },
        { x: 76, y: 104 },
      ],
      laneOffset: 2.3,
    },
    roadYMin: 0,
    roadYMax: 100,
    crosswalkX: 44,
    allowedVehicles: ['angkot', 'motor', 'mobil', 'pedati', 'delman', 'becak'],
    obstacles: [
      // Halte kayu kiri
      { xMin: 4, xMax: 26, yMin: 32, yMax: 56 },
      // Deretan kios pasar sebelah kanan
      { xMin: 66, xMax: 100, yMin: 10, yMax: 60 },
    ],
    defaultSpawn: { x: 60, y: 45 },
    hotspots: [
      {
        id: 'kios_kulakan',
        label: 'Kios Grosir Pasar',
        subtitle: 'Beli stok Warung Arga + Ongkir Mamang',
        x: 62,
        y: 38,
        actionType: 'open_pasar_shop',
      },
      {
        id: 'halte_pulang',
        label: 'Halte Pulang ke Kampung',
        subtitle: 'Bayar angkot Rp 5.000 / becak / delman',
        x: 24,
        y: 60,
        actionType: 'open_pasar_transport',
      },
    ],
    neighbors: [],
  },
};

export const NPCS: NpcDef[] = [
  {
    id: 'abah_karta',
    name: 'Abah Karta',
    role: 'Sesepuh Petani Sawah',
    scene: 'sawah_lisung',
    x: 24,
    y: 43,
    walkSpeed: 5.5,
    patrolPath: [
      { x: 24, y: 43, pauseSec: 4.5, label: 'Saung Lisung' },
      { x: 36, y: 50, pauseSec: 2.0, label: 'Pematang Sawah' },
      { x: 58, y: 50, pauseSec: 2.5, label: 'Jembatan Sungai' },
      { x: 75, y: 40, pauseSec: 4.5, label: 'Kebun Buah' },
      { x: 58, y: 50, pauseSec: 2.0, label: 'Jembatan Sungai' },
      { x: 28, y: 48, pauseSec: 3.0, label: 'Saung Lisung' },
    ],
    dailySchedule: [
      {
        id: 'abah_pagi',
        startMinutes: 300,
        endMinutes: 690,
        waypoints: [
          { x: 24, y: 43, pauseSec: 3.5, label: 'Saung Lisung' },
          { x: 75, y: 40, pauseSec: 4.5, label: 'Kebun Buah' },
          { x: 36, y: 50, pauseSec: 2.5, label: 'Pematang Sawah' },
        ],
      },
      {
        id: 'abah_siang',
        startMinutes: 690,
        endMinutes: 870,
        waypoints: [
          { x: 24, y: 43, pauseSec: 5.0, label: 'Istirahat Saung Lisung' },
          { x: 32, y: 48, pauseSec: 3.0, label: 'Tepi Sawah' },
        ],
      },
      {
        id: 'abah_sore_malam',
        startMinutes: 870,
        endMinutes: 300,
        waypoints: [
          { x: 75, y: 40, pauseSec: 4.0, label: 'Kebun Buah' },
          { x: 58, y: 50, pauseSec: 2.5, label: 'Jembatan Sungai' },
          { x: 24, y: 43, pauseSec: 4.5, label: 'Saung Lisung' },
        ],
      },
    ],
    shirtColor: '#78350f',
    accentColor: '#fde68a',
    hatType: 'iket',
    greetings: [
      'Wilujeng enjing, Jang Arga! Sawah keur héjo ngémploh yeuh, alhamdulillah.',
      'Eh, Arga! Kumaha kabarna Warung Arga poé ieu? Laris manis nya?',
    ],
    greetingsId: [
      'Selamat pagi, Nak Arga! Sawah sedang hijau subur sekali ini, alhamdulillah.',
      'Eh, Arga! Bagaimana kabar Warung Arga hari ini? Laris manis ya?',
    ],
    options: [
      {
        text: 'Pangéstu Abah, alhamdulillah sehat. Mugia panén lancar!',
        textId: 'Berkat doa Abah, alhamdulillah sehat. Semoga panennya lancar!',
        tone: 'ramah',
        reputationDelta: 0.08,
        satisfactionDelta: 5,
        reply: 'Aamiin, Jang Arga! Warga resep pisan balanja di Warung Arga sabab ramah.',
        replyId: 'Aamiin, Nak Arga! Warga senang sekali belanja di Warung Arga karena ramah.',
      },
      {
        text: 'Muhun Bah, nuju sibuk pisan ieu rék muka warung.',
        textId: 'Iya Bah, sedang sibuk sekali ini mau membuka warung.',
        tone: 'biasa',
        reputationDelta: 0.02,
        satisfactionDelta: 1,
        reply: 'Nya geus atuh, sing getol usahana nya Jang.',
        replyId: 'Ya sudah kalau begitu, yang rajin usahanya ya Nak.',
      },
      {
        text: 'Punten Bah, abdi rusuh teu tiasa lami-lami.',
        textId: 'Maaf Bah, saya buru-buru tidak bisa berlama-lama.',
        tone: 'ketus',
        reputationDelta: -0.08,
        satisfactionDelta: -6,
        reply: 'Oh... muhun atuh Jang, hampura mun Abah ngaganggu.',
        replyId: 'Oh... iya deh Nak, maaf kalau Abah mengganggu.',
      },
    ],
  },
  {
    id: 'ustaz_hidayat',
    name: 'Ustaz Hidayat',
    role: 'Pengurus Masjid Al-Ikhlas',
    scene: 'kampung_warung',
    x: 78,
    y: 39,
    walkSpeed: 6.2,
    patrolPath: [
      { x: 78, y: 39, pauseSec: 4.5, label: 'Masjid Al-Ikhlas' },
      { x: 58, y: 44, pauseSec: 2.0, label: 'Jalan Kampung' },
      { x: 47, y: 46, pauseSec: 3.5, label: 'Warung Asih' },
      { x: 27, y: 55, pauseSec: 4.0, label: 'Warung Arga' },
      { x: 72, y: 46, pauseSec: 2.5, label: 'Gerbang Masjid' },
    ],
    dailySchedule: [
      {
        id: 'ustaz_subuh',
        startMinutes: 270,
        endMinutes: 420,
        waypoints: [
          { x: 78, y: 39, pauseSec: 5.0, label: 'Masjid Al-Ikhlas' },
          { x: 70, y: 46, pauseSec: 3.0, label: 'Pelataran Masjid' },
        ],
      },
      {
        id: 'ustaz_pagi',
        startMinutes: 420,
        endMinutes: 690,
        waypoints: [
          { x: 78, y: 39, pauseSec: 3.5, label: 'Masjid Al-Ikhlas' },
          { x: 47, y: 46, pauseSec: 4.0, label: 'Warung Asih' },
          { x: 27, y: 55, pauseSec: 4.0, label: 'Warung Arga' },
        ],
      },
      {
        id: 'ustaz_dzuhur',
        startMinutes: 690,
        endMinutes: 810,
        waypoints: [
          { x: 78, y: 39, pauseSec: 5.5, label: 'Masjid Al-Ikhlas' },
          { x: 64, y: 44, pauseSec: 2.5, label: 'Jalan Masjid' },
        ],
      },
      {
        id: 'ustaz_siang_sore',
        startMinutes: 810,
        endMinutes: 1050,
        waypoints: [
          { x: 27, y: 55, pauseSec: 4.0, label: 'Warung Arga' },
          { x: 47, y: 46, pauseSec: 3.5, label: 'Warung Asih' },
          { x: 78, y: 39, pauseSec: 4.5, label: 'Masjid Al-Ikhlas' },
        ],
      },
      {
        id: 'ustaz_maghrib_isya',
        startMinutes: 1050,
        endMinutes: 270,
        waypoints: [
          { x: 78, y: 39, pauseSec: 5.5, label: 'Masjid Al-Ikhlas' },
          { x: 47, y: 46, pauseSec: 3.0, label: 'Warung Asih' },
          { x: 72, y: 46, pauseSec: 3.5, label: 'Teras Masjid' },
        ],
      },
    ],
    shirtColor: '#f8fafc',
    accentColor: '#059669',
    hatType: 'peci',
    greetings: [
      'Assalamualaikum Jang Arga. Tong hilap upami waktos sholat sumping, warung tutup heula sakedap nya.',
      'Wilujeng siang Arga! Mugia usaha Warung Arga janten berkah kanggo urang sadaya.',
    ],
    greetingsId: [
      'Assalamualaikum Nak Arga. Jangan lupa kalau waktu sholat tiba, warung tutup dulu sebentar ya.',
      'Selamat siang Arga! Semoga usaha Warung Arga menjadi berkah untuk kita semua.',
    ],
    options: [
      {
        text: 'Waalaikumsalam Pak Ustaz, insyaAllah siap nutup warung waktos adzan.',
        textId: 'Waalaikumsalam Pak Ustaz, insyaAllah siap menutup warung saat adzan.',
        tone: 'ramah',
        reputationDelta: 0.09,
        satisfactionDelta: 6,
        reply: 'MasyaAllah, éta pisan nu ngajadikeun Warung Arga dipikanyaah warga kampung.',
        replyId: 'MasyaAllah, itulah yang membuat Warung Arga disayang warga kampung.',
      },
      {
        text: 'Waalaikumsalam, muhun Pa Ustaz, nuhun pangélingna.',
        textId: 'Waalaikumsalam, iya Pak Ustaz, terima kasih pengingatnya.',
        tone: 'biasa',
        reputationDelta: 0.03,
        satisfactionDelta: 2,
        reply: 'Sami-sami Jang Arga, sing lancar rezekina.',
        replyId: 'Sama-sama Nak Arga, semoga lancar rezekinya.',
      },
      {
        text: 'Muhun, tapi mun keur ramé mah hésé nutupna Pa.',
        textId: 'Iya, tapi kalau sedang ramai susah menutupnya Pak.',
        tone: 'ketus',
        reputationDelta: -0.07,
        satisfactionDelta: -5,
        reply: 'Rezeki moal pahili, Jang. Keutamaan sholat tetep nomer hiji.',
        replyId: 'Rezeki tidak akan tertukar, Nak. Keutamaan sholat tetap nomor satu.',
      },
    ],
  },
  {
    id: 'kang_asep',
    name: 'Kang Asep',
    role: 'Warga & Pengantar Pesanan',
    scene: 'kampung_warung',
    x: 26,
    y: 56,
    walkSpeed: 7.2,
    patrolPath: [
      { x: 26, y: 56, pauseSec: 3.5, label: 'Warung Arga' },
      { x: 18, y: 74, pauseSec: 3.5, label: 'Halte Pasar' },
      { x: 48, y: 47, pauseSec: 4.0, label: 'Warung Asih' },
      { x: 75, y: 40, pauseSec: 3.0, label: 'Masjid Al-Ikhlas' },
    ],
    dailySchedule: [
      {
        id: 'asep_pagi',
        startMinutes: 300,
        endMinutes: 540,
        waypoints: [
          { x: 18, y: 74, pauseSec: 3.5, label: 'Halte Pasar' },
          { x: 48, y: 47, pauseSec: 4.0, label: 'Warung Asih' },
          { x: 26, y: 56, pauseSec: 3.5, label: 'Warung Arga' },
        ],
      },
      {
        id: 'asep_siang',
        startMinutes: 540,
        endMinutes: 1020,
        waypoints: [
          { x: 26, y: 56, pauseSec: 3.5, label: 'Warung Arga' },
          { x: 48, y: 47, pauseSec: 3.5, label: 'Warung Asih' },
          { x: 75, y: 40, pauseSec: 3.5, label: 'Masjid Al-Ikhlas' },
          { x: 18, y: 74, pauseSec: 3.5, label: 'Halte Pasar' },
        ],
      },
      {
        id: 'asep_malam',
        startMinutes: 1020,
        endMinutes: 300,
        waypoints: [
          { x: 48, y: 47, pauseSec: 4.5, label: 'Ngopi Warung Asih' },
          { x: 26, y: 56, pauseSec: 3.5, label: 'Warung Arga' },
          { x: 18, y: 74, pauseSec: 3.0, label: 'Halte Kampung' },
        ],
      },
    ],
    shirtColor: '#0369a1',
    accentColor: '#bae6fd',
    hatType: 'topi',
    greetings: [
      'Sampurasun Ga! Abdi keur muter ti Warung Arga ka Warung Asih jeung Masjid, nganteurkeun titipan warga.',
      'Wilujeng ngajalankeun usaha Warung Arga, Ga! Engké wengi hayu nganteur pesenan bareng!',
    ],
    greetingsId: [
      'Permisi Ga! Saya sedang berkeliling dari Warung Arga ke Warung Asih dan Masjid, mengantar titipan warga.',
      'Selamat menjalankan usaha Warung Arga, Ga! Nanti malam ayo antar pesanan bareng!',
    ],
    options: [
      {
        text: 'Rampes Kang Asep! Sing ati-ati di jalan mun meuntas rék ka Masjid.',
        textId: 'Baik Kang Asep! Hati-hati di jalan kalau menyeberang mau ke Masjid.',
        tone: 'ramah',
        reputationDelta: 0.07,
        satisfactionDelta: 5,
        reply: 'Siap Ga! Nuhun geus diperhatikeun, engké Kang Asep sering ngaronda ka Warung Arga.',
        replyId: 'Siap Ga! Terima kasih sudah diperhatikan, nanti Kang Asep sering mampir ke Warung Arga.',
      },
      {
        text: 'Muhun Kang, mugia lancar kirimanana dinten ieu.',
        textId: 'Iya Kang, semoga lancar kirimannya hari ini.',
        tone: 'biasa',
        reputationDelta: 0.02,
        satisfactionDelta: 2,
        reply: 'Aamiin, nuhun pisan Ga!',
        replyId: 'Aamiin, terima kasih banyak Ga!',
      },
      {
        text: 'Ulah lami teuing ngobrol di jalan Kang, bilih telat.',
        textId: 'Jangan terlalu lama mengobrol di jalan Kang, nanti telat.',
        tone: 'ketus',
        reputationDelta: -0.05,
        satisfactionDelta: -3,
        reply: 'Oh muhun Ga, abdi langsung jalan deui atuh.',
        replyId: 'Oh iya Ga, saya langsung jalan lagi deh.',
      },
    ],
  },
  {
    id: 'pak_rt_dedi',
    name: 'Pak RT Dedi',
    role: 'Ketua RT Kampung Sukamaju',
    scene: 'kompleks_warga',
    x: 25,
    y: 51,
    walkSpeed: 6.0,
    patrolPath: [
      { x: 25, y: 51, pauseSec: 4.0, label: 'Imah Pak RT' },
      { x: 14, y: 70, pauseSec: 4.0, label: 'Pos Ronda' },
      { x: 49, y: 42, pauseSec: 3.5, label: 'Rumah Arga' },
    ],
    dailySchedule: [
      {
        id: 'rt_pagi',
        startMinutes: 300,
        endMinutes: 540,
        waypoints: [
          { x: 25, y: 51, pauseSec: 4.0, label: 'Imah Pak RT' },
          { x: 49, y: 42, pauseSec: 3.5, label: 'Rumah Arga' },
        ],
      },
      {
        id: 'rt_siang',
        startMinutes: 540,
        endMinutes: 1050,
        waypoints: [
          { x: 25, y: 51, pauseSec: 3.5, label: 'Imah Pak RT' },
          { x: 49, y: 42, pauseSec: 3.5, label: 'Rumah Arga' },
          { x: 14, y: 70, pauseSec: 3.5, label: 'Pos Ronda' },
        ],
      },
      {
        id: 'rt_malam',
        startMinutes: 1050,
        endMinutes: 300,
        waypoints: [
          { x: 14, y: 70, pauseSec: 5.0, label: 'Ronda Malam' },
          { x: 25, y: 51, pauseSec: 4.0, label: 'Imah Pak RT' },
        ],
      },
    ],
    shirtColor: '#1e3a8a',
    accentColor: '#fbbf24',
    hatType: 'peci',
    greetings: [
      'Halo Arga! Warga kampung keur nyiapkeun gotong royong jeung tradisi adat Sunda bulan ieu.',
      'Eh Arga, kumaha stok gas melon jeung béas di Warung Arga? Aman?',
    ],
    greetingsId: [
      'Halo Arga! Warga kampung sedang menyiapkan gotong royong dan tradisi adat Sunda bulan ini.',
      'Eh Arga, bagaimana stok gas melon dan beras di Warung Arga? Aman?',
    ],
    options: [
      {
        text: 'Aman Pak RT! Mun aya acara adat atanapi urunan, béjaan abdi nya.',
        textId: 'Aman Pak RT! Kalau ada acara adat atau urunan, kabari saya ya.',
        tone: 'ramah',
        reputationDelta: 0.08,
        satisfactionDelta: 6,
        reply: 'Mantap pisan Arga! Warga bangga boga juragan warung nu peduli kampung.',
        replyId: 'Mantap sekali Arga! Warga bangga punya pemilik warung yang peduli kampung.',
      },
      {
        text: 'Aman Pak RT, nembé badé balanja stok ka pasar.',
        textId: 'Aman Pak RT, baru mau belanja stok ke pasar.',
        tone: 'biasa',
        reputationDelta: 0.02,
        satisfactionDelta: 2,
        reply: 'Hati-hati di jalan nya Ga, loba angkot jeung motor liwat!',
        replyId: 'Hati-hati di jalan ya Ga, banyak angkot dan motor lewat!',
      },
      {
        text: 'Aduh Pak RT, omzet keur sepi, ulah waka aya iuran heula atuh.',
        textId: 'Aduh Pak RT, omzet sedang sepi, jangan ada iuran dulu deh.',
        tone: 'ketus',
        reputationDelta: -0.08,
        satisfactionDelta: -6,
        reply: 'Oh kitu... nya engké urang musyawarahkeun deui di Bale Patemon.',
        replyId: 'Oh begitu... ya nanti kita musyawarahkan lagi di Bale Patemon.',
      },
    ],
  },
  {
    id: 'ceu_imas',
    name: 'Ceu Imas',
    role: 'Tetangga & Pembuat Peuyeum',
    scene: 'kompleks_warga',
    x: 68,
    y: 44,
    walkSpeed: 6.4,
    patrolPath: [
      { x: 68, y: 44, pauseSec: 4.0, label: 'Imah Warga Kanan' },
      { x: 52, y: 43, pauseSec: 3.5, label: 'Rumah Arga' },
      { x: 56, y: 61, pauseSec: 3.5, label: 'Imah Warga Bawah' },
    ],
    dailySchedule: [
      {
        id: 'imas_pagi',
        startMinutes: 300,
        endMinutes: 660,
        waypoints: [
          { x: 68, y: 44, pauseSec: 4.0, label: 'Imah Ceu Imas' },
          { x: 52, y: 43, pauseSec: 3.5, label: 'Rumah Arga' },
        ],
      },
      {
        id: 'imas_siang',
        startMinutes: 660,
        endMinutes: 1050,
        waypoints: [
          { x: 68, y: 44, pauseSec: 3.5, label: 'Imah Ceu Imas' },
          { x: 56, y: 61, pauseSec: 3.5, label: 'Imah Warga Bawah' },
          { x: 52, y: 43, pauseSec: 3.5, label: 'Rumah Arga' },
        ],
      },
      {
        id: 'imas_malam',
        startMinutes: 1050,
        endMinutes: 300,
        waypoints: [
          { x: 68, y: 44, pauseSec: 5.0, label: 'Imah Ceu Imas' },
          { x: 56, y: 61, pauseSec: 3.5, label: 'Teras Tetangga' },
        ],
      },
    ],
    shirtColor: '#be185d',
    accentColor: '#fbcfe8',
    hatType: 'kerudung',
    greetings: [
      'Punten Arga! Énjing-énjing tos rapih kieu, badé muka Warung Arga jam 9?',
      'Jang Arga, Ceu Imas resep meuli bala-bala jeung minyak di warung manéh, murah meriah!',
    ],
    greetingsId: [
      'Permisi Arga! Pagi-pagi sudah rapi begini, mau buka Warung Arga jam 9?',
      'Nak Arga, Ceu Imas suka beli bala-bala dan minyak di warung kamu, murah meriah!',
    ],
    options: [
      {
        text: 'Mangga Ceu Imas, engké jam 9 langsung sumping wéh, aya kopi haneut ogé!',
        textId: 'Silakan Ceu Imas, nanti jam 9 langsung datang saja, ada kopi hangat juga!',
        tone: 'ramah',
        reputationDelta: 0.07,
        satisfactionDelta: 5,
        reply: 'Wah siap Ga! Ceu Imas ajak ibu-ibu séjén balanja ka Warung Arga!',
        replyId: 'Wah siap Ga! Ceu Imas ajak ibu-ibu lain belanja ke Warung Arga!',
      },
      {
        text: 'Muhun Ceu, nuhun tos janten langganan.',
        textId: 'Iya Ceu, terima kasih sudah menjadi langganan.',
        tone: 'biasa',
        reputationDelta: 0.02,
        satisfactionDelta: 2,
        reply: 'Sami-sami Arga, sing laris nya.',
        replyId: 'Sama-sama Arga, semoga laris ya.',
      },
      {
        text: 'Tong ngutang waé nya Ceu mun balanja, hehe.',
        textId: 'Jangan ngutang terus ya Ceu kalau belanja, hehe.',
        tone: 'ketus',
        reputationDelta: -0.09,
        satisfactionDelta: -7,
        reply: 'Ih ari si Arga, Ceu Imas mah sok mayar kontan atuh!',
        replyId: 'Ih kamu ini Arga, Ceu Imas selalu bayar tunai kok!',
      },
    ],
  },
  {
    id: 'mang_ujang',
    name: 'Mang Ujang',
    role: 'Tukang Bangunan & Pekerja Kampung',
    scene: 'bumi_ageung',
    x: 26,
    y: 48,
    walkSpeed: 6.6,
    patrolPath: [
      { x: 26, y: 48, pauseSec: 4.5, label: 'Bale Patemon' },
      { x: 46, y: 56, pauseSec: 2.5, label: 'Pelataran Tengah' },
      { x: 66, y: 48, pauseSec: 4.5, label: 'Bumi Ageung' },
      { x: 54, y: 62, pauseSec: 2.5, label: 'Halaman Adat' },
    ],
    dailySchedule: [
      {
        id: 'ujang_pagi',
        startMinutes: 300,
        endMinutes: 720,
        waypoints: [
          { x: 26, y: 48, pauseSec: 4.0, label: 'Bale Patemon' },
          { x: 46, y: 56, pauseSec: 2.5, label: 'Pelataran' },
          { x: 66, y: 48, pauseSec: 4.0, label: 'Bumi Ageung' },
        ],
      },
      {
        id: 'ujang_siang_malam',
        startMinutes: 720,
        endMinutes: 300,
        waypoints: [
          { x: 66, y: 48, pauseSec: 4.0, label: 'Bumi Ageung' },
          { x: 54, y: 62, pauseSec: 3.0, label: 'Halaman Adat' },
          { x: 26, y: 48, pauseSec: 4.5, label: 'Bale Patemon' },
        ],
      },
    ],
    shirtColor: '#b45309',
    accentColor: '#fed7aa',
    hatType: 'topi',
    greetings: [
      'Héy Jang Arga! Mun can jam 9 warung buka, hayu ngabantuan Mang Ujang ngangkut material atawa bersih-bersih Bale Patemon!',
      'Di Bale Patemon jeung Bumi Ageung loba sajarah Sunda, Ga. Urang kudu ngajaga babarengan.',
    ],
    greetingsId: [
      'Hei Nak Arga! Kalau belum jam 9 warung buka, ayo bantu Mang Ujang mengangkut material atau bersih-bersih Bale Patemon!',
      'Di Bale Patemon dan Bumi Ageung banyak sejarah Sunda, Ga. Kita harus menjaga bersama-sama.',
    ],
    options: [
      {
        text: 'Siap Mang Ujang! Urang jaga kabersihan lembur urang sasarengan.',
        textId: 'Siap Mang Ujang! Kita jaga kebersihan kampung kita bersama-sama.',
        tone: 'ramah',
        reputationDelta: 0.07,
        satisfactionDelta: 5,
        reply: 'Tah kitu atuh pemuda Sunda téh! Engké Mang Ujang ngopi di Warung Asih.',
        replyId: 'Nah begitu dong pemuda Sunda! Nanti Mang Ujang ngopi di Warung Asih.',
      },
      {
        text: 'Muhun Mang, ke mun aya waktu luang abdi bantosan.',
        textId: 'Iya Mang, nanti kalau ada waktu luang saya bantu.',
        tone: 'biasa',
        reputationDelta: 0.02,
        satisfactionDelta: 1,
        reply: 'Sip lah Ga, ditungguan!',
        replyId: 'Sip lah Ga, ditunggu!',
      },
      {
        text: 'Ah cape Mang, abdi mah fokus jaga warung wungkul.',
        textId: 'Ah capek Mang, saya fokus jaga warung saja.',
        tone: 'ketus',
        reputationDelta: -0.06,
        satisfactionDelta: -4,
        reply: 'Oh nya teu nanaon Ga, masing-masing wéh.',
        replyId: 'Oh ya tidak apa-apa Ga, masing-masing saja.',
      },
    ],
  },
  {
    id: 'teh_nenden',
    name: 'Teh Nenden',
    role: 'Guru SD Negeri Sukamaju',
    scene: 'sekolah',
    x: 56,
    y: 36,
    walkSpeed: 6.2,
    patrolPath: [
      { x: 56, y: 36, pauseSec: 4.5, label: 'Ruang Kelas' },
      { x: 42, y: 46, pauseSec: 3.0, label: 'Lapangan Upacara' },
      { x: 35, y: 62, pauseSec: 3.5, label: 'Halte Sekolah' },
      { x: 60, y: 54, pauseSec: 3.0, label: 'Halaman Sekolah' },
    ],
    dailySchedule: [
      {
        id: 'nenden_sekolah',
        startMinutes: 360,
        endMinutes: 780,
        waypoints: [
          { x: 56, y: 36, pauseSec: 4.5, label: 'Ruang Kelas' },
          { x: 42, y: 46, pauseSec: 3.0, label: 'Lapangan Upacara' },
          { x: 60, y: 54, pauseSec: 3.0, label: 'Halaman Kanan' },
        ],
      },
      {
        id: 'nenden_sore',
        startMinutes: 780,
        endMinutes: 360,
        waypoints: [
          { x: 42, y: 46, pauseSec: 3.0, label: 'Lapangan Sekolah' },
          { x: 35, y: 62, pauseSec: 4.0, label: 'Halte Sekolah' },
          { x: 56, y: 36, pauseSec: 4.0, label: 'Ruang Guru' },
        ],
      },
    ],
    shirtColor: '#0f766e',
    accentColor: '#ccfbf1',
    hatType: 'kerudung',
    greetings: [
      'Wilujeng énjing Kang Arga! Barudak sakola sok resep jajan surabi jeung teh manis di Warung Arga.',
      'Alhamdulillah murid-murid SD Sukamaju diajarkeun basa Sunda nu sopan unggal poé.',
    ],
    greetingsId: [
      'Selamat pagi Kang Arga! Anak-anak sekolah suka sekali jajan surabi dan teh manis di Warung Arga.',
      'Alhamdulillah murid-murid SD Sukamaju diajarkan bahasa Sunda yang sopan setiap hari.',
    ],
    options: [
      {
        text: 'Wilujeng ngajar Teh Nenden! Di Warung Arga jajananana dijaga bersih & halal.',
        textId: 'Selamat mengajar Teh Nenden! Di Warung Arga jajanannya dijaga bersih & halal.',
        tone: 'ramah',
        reputationDelta: 0.08,
        satisfactionDelta: 6,
        reply: 'Nuhun pisan Kang Arga! Ibu guru ogé engké rék pesen bajigur.',
        replyId: 'Terima kasih banyak Kang Arga! Ibu guru juga nanti mau pesan bajigur.',
      },
      {
        text: 'Muhun Teh, mugia barudakna palinter sadayana.',
        textId: 'Iya Teh, semoga anak-anaknya pintar semuanya.',
        tone: 'biasa',
        reputationDelta: 0.02,
        satisfactionDelta: 2,
        reply: 'Aamiin, nuhun Kang Arga.',
        replyId: 'Aamiin, terima kasih Kang Arga.',
      },
      {
        text: 'Barudak sakola ulah ribut mun jajan di warung nya Teh.',
        textId: 'Anak-anak sekolah jangan ribut kalau jajan di warung ya Teh.',
        tone: 'ketus',
        reputationDelta: -0.07,
        satisfactionDelta: -5,
        reply: 'Euh muhun Kang, engké ku abdi diélingan barudakna.',
        replyId: 'Eh iya Kang, nanti saya ingatkan anak-anaknya.',
      },
    ],
  },
  {
    id: 'aki_jaya',
    name: 'Aki Jaya',
    role: 'Penjaga Hutan Tutupan & Mata Air',
    scene: 'hutan_tutupan',
    x: 26,
    y: 47,
    walkSpeed: 5.2,
    patrolPath: [
      { x: 26, y: 47, pauseSec: 4.5, label: 'Pos Rimba' },
      { x: 56, y: 62, pauseSec: 3.0, label: 'Jembatan Kayu' },
      { x: 66, y: 62, pauseSec: 3.5, label: 'Arah Area Air' },
    ],
    dailySchedule: [
      {
        id: 'aki_siang',
        startMinutes: 300,
        endMinutes: 1020,
        waypoints: [
          { x: 26, y: 47, pauseSec: 4.0, label: 'Pos Rimba' },
          { x: 66, y: 62, pauseSec: 3.5, label: 'Arah Pancuran' },
          { x: 34, y: 58, pauseSec: 2.5, label: 'Tepi Jembatan' },
        ],
      },
      {
        id: 'aki_malam',
        startMinutes: 1020,
        endMinutes: 300,
        waypoints: [
          { x: 26, y: 47, pauseSec: 5.0, label: 'Pos Rimba' },
          { x: 34, y: 58, pauseSec: 3.0, label: 'Jembatan Kayu' },
        ],
      },
    ],
    shirtColor: '#1f2937',
    accentColor: '#d1fae5',
    hatType: 'iket',
    greetings: [
      'Leuweung ruksak, cai béak, manusa sangsara. Jaga Hutan Tutupan jeung Pancuran urang nya, Jang Arga.',
      'Wilujeng sumping di leuweung larangan, Arga. Cai di pancuran beresih pisan poé ieu.',
    ],
    greetingsId: [
      'Hutan rusak, air habis, manusia sengsara. Jaga Hutan Tutupan dan Pancuran kita ya, Nak Arga.',
      'Selamat datang di hutan larangan, Arga. Air di pancuran bersih sekali hari ini.',
    ],
    options: [
      {
        text: 'Sumuhun Ki, abdi moal ngaruksak tangkal, ngan nyandak cai beresih wungkul.',
        textId: 'Baik Ki, saya tidak akan merusak pohon, hanya mengambil air bersih saja.',
        tone: 'ramah',
        reputationDelta: 0.08,
        satisfactionDelta: 5,
        reply: 'Alus pisan, Jang. Alam Sunda bakal méré berkah ka jalma nu nyaah ka leuweung.',
        replyId: 'Bagus sekali, Nak. Alam Sunda akan memberi berkah kepada orang yang menyayangi hutan.',
      },
      {
        text: 'Mangga Ki, abdi ngiring ngiuhan sakedap.',
        textId: 'Permisi Ki, saya ikut berteduh sebentar.',
        tone: 'biasa',
        reputationDelta: 0.02,
        satisfactionDelta: 2,
        reply: 'Pek atuh, sing tenang haté di dieu.',
        replyId: 'Silakan saja, semoga tenang hati di sini.',
      },
      {
        text: 'Abdi rék néangan kai keur suluh, meunang teu Ki?',
        textId: 'Saya mau mencari kayu untuk bakar, boleh tidak Ki?',
        tone: 'ketus',
        reputationDelta: -0.09,
        satisfactionDelta: -6,
        reply: 'Teu kenging! Hutan Tutupan téh leuweung larangan adat, teu meunang ditebang.',
        replyId: 'Tidak boleh! Hutan Tutupan itu hutan larangan adat, tidak boleh ditebang.',
      },
    ],
  },
  {
    id: 'kang_tatang',
    name: 'Mang Tatang',
    role: 'Kusir Delman & Pedagang Pasar',
    scene: 'pasar',
    x: 56,
    y: 34,
    walkSpeed: 5.8,
    patrolPath: [
      { x: 56, y: 34, pauseSec: 4.5, label: 'Kios Grosir Atas' },
      { x: 61, y: 42, pauseSec: 4.0, label: 'Kios Grosir Tengah' },
      { x: 58, y: 52, pauseSec: 3.5, label: 'Area Muat Delman' },
    ],
    dailySchedule: [
      {
        id: 'tatang_pagi',
        startMinutes: 240,
        endMinutes: 780,
        waypoints: [
          { x: 56, y: 34, pauseSec: 4.0, label: 'Kios Grosir Atas' },
          { x: 61, y: 42, pauseSec: 3.5, label: 'Kios Tengah' },
          { x: 58, y: 52, pauseSec: 3.5, label: 'Area Muat Delman' },
        ],
      },
      {
        id: 'tatang_sore',
        startMinutes: 780,
        endMinutes: 240,
        waypoints: [
          { x: 61, y: 42, pauseSec: 4.5, label: 'Kios Tengah' },
          { x: 58, y: 52, pauseSec: 4.0, label: 'Pangkalan Delman' },
        ],
      },
    ],
    shirtColor: '#92400e',
    accentColor: '#fde047',
    hatType: 'topi',
    greetings: [
      'Balanja naon Jang Arga? Mun barangna loba, bisa dikirim maké Delman atawa Becak langsung ka Warung Arga!',
      'Pasar ramé poé ieu, harga sembako keur stabil.',
    ],
    greetingsId: [
      'Belanja apa Nak Arga? Kalau barangnya banyak, bisa dikirim pakai Delman atau Becak langsung ke Warung Arga!',
      'Pasar ramai hari ini, harga sembako sedang stabil.',
    ],
    options: [
      {
        text: 'Siap Mang Tatang! Engké mun balanja karungan, abdi nganggo jasa kirim Delman.',
        textId: 'Siap Mang Tatang! Nanti kalau belanja karungan, saya pakai jasa kirim Delman.',
        tone: 'ramah',
        reputationDelta: 0.06,
        satisfactionDelta: 4,
        reply: 'Beres Jang! Ongkirna ngan Rp 15.000, aman nepi ka hareup warung!',
        replyId: 'Beres Nak! Ongkos kirimnya cuma Rp 15.000, aman sampai depan warung!',
      },
      {
        text: 'Muhun Mang, abdi keur ningalian harga béas jeung minyak.',
        textId: 'Iya Mang, saya sedang melihat-lihat harga beras dan minyak.',
        tone: 'biasa',
        reputationDelta: 0.02,
        satisfactionDelta: 1,
        reply: 'Mangga dipilih wéh nu seger-seger.',
        replyId: 'Silakan dipilih saja yang segar-segar.',
      },
      {
        text: 'Ongkir Delman mahal teuing Mang, turunkeun atuh.',
        textId: 'Ongkir Delman kemahalan Mang, turunkan dong.',
        tone: 'ketus',
        reputationDelta: -0.05,
        satisfactionDelta: -3,
        reply: 'Aduh Jang, jukut kuda ayeuna ogé mahal, geus harga pas éta mah.',
        replyId: 'Aduh Nak, rumput kuda sekarang juga mahal, sudah harga pas itu.',
      },
    ],
  },
];

export const SIDE_JOBS: SideJobDef[] = [
  // Kerja Pagi (05:00 - 09:00 sebelum Warung Arga buka)
  {
    id: 'bersih_masjid',
    title: 'Bersih-bersih Masjid Al-Ikhlas',
    locationLabel: 'Masjid Al-Ikhlas',
    scene: 'kampung_warung',
    period: 'pagi',
    startHour: 5,
    endHour: 9,
    reward: 35000,
    energyCost: 14,
    durationMinutes: 45,
    description: 'Menyapu halaman masjid, merapikan sajadah, dan mengisi bak wudhu sebelum jam 09.00.',
    steps: [
      'Sapu daun kering di pelataran Masjid Al-Ikhlas',
      'Rapikan sajadah dan mukena di rak imam',
      'Periksa pancuran tempat wudhu agar bersih jernih',
    ],
  },
  {
    id: 'bersih_bale',
    title: 'Bersih-bersih Bale Desa / Bale Patemon',
    locationLabel: 'Bale Patemon',
    scene: 'bumi_ageung',
    period: 'pagi',
    startHour: 5,
    endHour: 9,
    reward: 40000,
    energyCost: 16,
    durationMinutes: 50,
    description: 'Membersihkan aula kayu Bale Patemon dan menyusun tikar pandan untuk musyawarah warga.',
    steps: [
      'Pel lantai papan kayu Bale Patemon hingga mengkilap',
      'Gelar tikar pandan untuk tempat duduk sesepuh',
      'Lap gong & gamelan degung di sudut ruangan',
    ],
  },
  {
    id: 'material_ujang',
    title: 'Bantu Angkut Material Mang Ujang',
    locationLabel: 'Kompleks Warga',
    scene: 'kompleks_warga',
    period: 'pagi',
    startHour: 6,
    endHour: 9,
    reward: 45000,
    energyCost: 20,
    durationMinutes: 60,
    description: 'Membantu Mang Ujang memindahkan bata merah dan bambu untuk perbaikan pos ronda.',
    steps: [
      'Susun bambu tali di sisi Pos Ronda',
      'Angkut 20 bata merah ke gerobak kerja',
      'Pasang tiang penyangga atap rumbia',
    ],
  },
  // Kerja Malam (17:00 - 21:00 setelah Warung Arga tutup)
  {
    id: 'tumbuk_saung',
    title: 'Rapikan Saung Lisung & Lumbung',
    locationLabel: 'Sawah & Saung Lisung',
    scene: 'sawah_lisung',
    period: 'malam',
    startHour: 17,
    endHour: 21,
    reward: 35000,
    energyCost: 15,
    durationMinutes: 45,
    description: 'Membantu Abah Karta menumbuk gabah sisa panen dan menutup lumbung padi sore hari.',
    steps: [
      'Tumbuk gabah dengan alu kayu di Saung Lisung',
      'Tampi beras menggunakan nyiru bambu',
      'Kunci pintu lumbung padi sebelum maghrib/malam',
    ],
  },
  {
    id: 'bungkus_peuyeum',
    title: 'Bantu Ceu Imas Bungkus Peuyeum & Opak',
    locationLabel: 'Kompleks Warga',
    scene: 'kompleks_warga',
    period: 'malam',
    startHour: 17,
    endHour: 21,
    reward: 40000,
    energyCost: 14,
    durationMinutes: 45,
    description: 'Membungkus peuyeum Bandung dan opak ketan dengan daun pisang untuk dijual besok pagi.',
    steps: [
      'Lap daun pisang muda hingga bersih',
      'Susun peuyeum manis ke dalam besek bambu',
      'Ikat tali bambu dan beri label harga',
    ],
  },
  {
    id: 'ronda_malam',
    title: 'Jaga Pos Ronda Kampung',
    locationLabel: 'Pos Ronda Kampung',
    scene: 'kompleks_warga',
    period: 'malam',
    startHour: 18,
    endHour: 21,
    reward: 50000,
    energyCost: 18,
    durationMinutes: 60,
    description: 'Keliling kampung memeriksa keamanan rumah warga sambil memukul kentongan bambu.',
    steps: [
      'Pukul kentongan bambu tanda ronda dimulai',
      'Periksa gerbang sekolah dan warung sudah terkunci',
      'Catat laporan keamanan di buku Pos Ronda',
    ],
  },
];

export const TRADITIONS: TraditionDef[] = [
  {
    id: 'Botram',
    dayTrigger: 2,
    title: 'Tradisi Botram Warga Kampung',
    description:
      'Warga Sukamaju menggelar makan bersama di atas daun pisang panjang (Botram) di Bale Patemon untuk mempererat silaturahmi.',
    urunanAmount: 35000,
    reputationGain: 0.2,
    hostNpc: 'Pak RT Dedi',
  },
  {
    id: 'Tingkeban',
    dayTrigger: 4,
    title: 'Upacara Adat Tingkeban (7 Bulanan)',
    description:
      'Keluarga Kang Asep mengadakan syukuran tujuh bulanan kehamilan dengan doa bersama dan rujak tujuh rupa.',
    urunanAmount: 30000,
    reputationGain: 0.18,
    hostNpc: 'Ceu Imas',
  },
  {
    id: 'Sawer',
    dayTrigger: 6,
    title: 'Acara Sawer Pengantin Kampung',
    description:
      'Upacara saweran tradisi Sunda dengan taburan beras kuning, permen, dan uang logam penuh nasihat bijak.',
    urunanAmount: 25000,
    reputationGain: 0.16,
    hostNpc: 'Abah Karta',
  },
  {
    id: 'Ngalaksa',
    dayTrigger: 8,
    title: 'Festival Adat Ngalaksa',
    description:
      'Membuat makanan laksa tradisional dari tepung beras di Saung Lisung sebagai wujud syukur atas berkah panen.',
    urunanAmount: 35000,
    reputationGain: 0.22,
    hostNpc: 'Abah Karta',
  },
  {
    id: 'Ngaruwat Bumi',
    dayTrigger: 10,
    title: 'Upacara Ngaruwat Bumi',
    description:
      'Doa tolak bala dan rasa syukur menjaga kelestarian tanah, sawah, serta Hutan Tutupan di Bumi Ageung.',
    urunanAmount: 45000,
    reputationGain: 0.25,
    hostNpc: 'Aki Jaya',
  },
  {
    id: 'Seren Taun',
    dayTrigger: 12,
    title: 'Perayaan Agung Seren Taun',
    description:
      'Pesta panen raya tahunan masyarakat Sunda dengan arak-arakan padi, angklung buncis, dan kenduri akbar.',
    urunanAmount: 50000,
    reputationGain: 0.3,
    hostNpc: 'Pak RT Dedi',
  },
];

export const CUSTOMER_ARCHETYPES = [
  {
    name: 'Ibu Euis',
    role: 'Ibu Rumah Tangga',
    shirtColor: '#db2777',
    hatType: 'kerudung' as const,
    greeting: 'Punten Arga, Ibu badé balanja kaperluan dapur.',
    greetingId: 'Permisi Arga, Ibu mau belanja keperluan dapur.',
  },
  {
    name: 'Kang Dadan',
    role: 'Pengojek Pangkalan',
    shirtColor: '#16a34a',
    hatType: 'topi' as const,
    greeting: 'Sampurasun Ga! Pangnyiapkeun kopi jeung gorengan nya.',
    greetingId: 'Permisi Ga! Tolong siapkan kopi dan gorengan ya.',
  },
  {
    name: 'Riko',
    role: 'Murid SD Sukamaju',
    shirtColor: '#dc2626',
    hatType: 'none' as const,
    greeting: 'A Arga, abdi mésér jajan sakola!',
    greetingId: 'Kak Arga, saya beli jajan sekolah!',
  },
  {
    name: 'Abah Karta',
    role: 'Petani Sawah',
    shirtColor: '#78350f',
    hatType: 'iket' as const,
    greeting: 'Jang Arga, Abah hoyong meser kopi sareng béas.',
    greetingId: 'Nak Arga, Abah mau membeli kopi dan beras.',
  },
  {
    name: 'Teh Nenden',
    role: 'Guru SD',
    shirtColor: '#0f766e',
    hatType: 'kerudung' as const,
    greeting: 'Wilujeng siang Kang Arga, stok bajigurna aya?',
    greetingId: 'Selamat siang Kang Arga, stok bajigurnya ada?',
  },
  {
    name: 'Mang Ujang',
    role: 'Tukang Bangunan',
    shirtColor: '#b45309',
    hatType: 'topi' as const,
    greeting: 'Ga, istirahat kerja heula! Mésér mie jeung teh manis.',
    greetingId: 'Ga, istirahat kerja dulu! Beli mie dan teh manis.',
  },
];

export function createInitialGameState(slotId = 1): GameState {
  const defaultPrices: Record<string, number> = {};
  for (const item of ITEMS) {
    defaultPrices[item.id] = item.retailPrice;
  }

  const startMinutes = 7 * 60 + 30; // 07.30 WIB pagi (kesempatan kerja pagi sebelum buka jam 09.00)
  const initialWeather = rollInitialSeasonAndWeather(startMinutes);

  return {
    slotId,
    playerName: 'Arga',
    warungName: 'Warung Arga',
    day: 1,
    minutesOfDay: startMinutes,
    money: 350000, // Modal awal realistis Rp 350.000
    debt: 0,
    debtRecords: [],
    energy: 92,
    reputation: 3.4,
    wargaSatisfaction: 72,
    warungLevel: 1,
    warungRenovationLevel: 0,
    rank: 1,
    scene: 'kampung_warung',
    playerPos: { x: 28, y: 58 },
    facing: 'right',
    isInjured: false,
    injuryDaysLeft: 0,
    warungOpen: false,
    warungCloseReason: 'Warung Arga buka jam 09.00 - 17.00 WIB',
    inventory: {
      kopi_kapal: 8,
      teh_manis: 6,
      mie_instan: 6,
      gorengan: 10,
      beras_1kg: 4,
      minyak_1l: 3,
      telur_setengah: 3,
      gas_3kg: 2,
      galon_air: 3,
      surabi: 5,
      peuyeum: 3,
      bajigur: 5,
      jas_hujan: 3,
      payung_lipat: 2,
      bandrek_hangat: 4,
      minyak_angin: 2,
      es_cendol: 4,
      caping_bambu: 2,
    },
    customPrices: defaultPrices,
    prayedToday: ['Subuh'],
    remindedPrayersToday: ['Subuh'],
    completedJobsToday: [],
    greetedNpcsToday: [],
    paidTraditions: [],
    activeTradition: null,
    activePrayerAlert: null,
    reviews: [
      {
        id: 'rev_init_1',
        author: 'Ceu Imas',
        rating: 4,
        comment:
          'Warung Arga bersih, beras jeung minyakna lengkap pisan! (Warung Arga bersih, beras dan minyaknya lengkap sekali!)',
        day: 1,
      },
      {
        id: 'rev_init_2',
        author: 'Abah Karta',
        rating: 4,
        comment:
          'Arga budakna sopan ka kolot, mugia Warung Arga tambah maju. (Arga anaknya sopan kepada orang tua, semoga Warung Arga makin maju.)',
        day: 1,
      },
    ],
    totalSalesCount: 0,
    totalRevenue: 0,
    activityPoints: 0,
    totalSideJobsCount: 0,
    totalGreetingsCount: 0,
    totalPrayersCount: 1,
    totalActivitiesCount: 0,
    fruitPickedToday: false,
    season: initialWeather.season,
    weather: initialWeather.weather,
    weatherRemainingMin: initialWeather.weatherRemainingMin,
    weatherForecast: ensureWeatherForecast(1, initialWeather.season, initialWeather.weather),
    transactions: [],
    dailyMissions: ensureDailyMissions(1, undefined, 0, 1),
    lastSavedAt: new Date().toISOString(),
  };
}
