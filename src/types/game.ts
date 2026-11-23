export type SceneId =
  | 'kampung_warung'
  | 'warung_interior'
  | 'warung_asih'
  | 'kompleks_warga'
  | 'rumah_ruang_tamu'
  | 'rumah_dapur'
  | 'rumah_kamar'
  | 'sawah_lisung'
  | 'bumi_ageung'
  | 'sekolah'
  | 'hutan_tutupan'
  | 'area_air'
  | 'pasar';

export type RankTierName =
  | 'Warrior'
  | 'Elite'
  | 'Master'
  | 'Grandmaster'
  | 'Epic'
  | 'Legend'
  | 'Mythic';

export interface RankTierInfo {
  tier: RankTierName;
  division: string;
  fullLabel: string;
  points: number;
  minPoints: number;
  nextThreshold: number | null;
  nextTierName: RankTierName | null;
  progressPct: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export type VehicleType = 'mobil' | 'angkot' | 'motor' | 'pedati' | 'delman' | 'becak';

export type SeasonType = 'kemarau' | 'hujan';

export type WeatherCondition = 'terik' | 'cerah' | 'mendung' | 'gerimis' | 'hujan';

export interface WeatherForecastDay {
  day: number;
  season: SeasonType;
  morning: WeatherCondition;
  afternoon: WeatherCondition;
  evening: WeatherCondition;
  rainChancePct: number;
}

export type PrayerName = 'Subuh' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya';

export type TraditionName =
  | 'Seren Taun'
  | 'Ngalaksa'
  | 'Ngaruwat Bumi'
  | 'Tingkeban'
  | 'Sawer'
  | 'Botram';

export type GameScreen = 'COVER' | 'PLAYING';

export type ActiveModal =
  | null
  | 'LOAD_SAVE'
  | 'SETTINGS'
  | 'CHANGELOG'
  | 'DIALOGUE'
  | 'PRAYER_REMINDER'
  | 'TRADITION_EVENT'
  | 'TRANSPORT_PASAR'
  | 'PASAR_SHOP'
  | 'HP_PHONE'
  | 'MAP'
  | 'SIDE_JOB'
  | 'FISHING'
  | 'FRUIT_PICKING'
  | 'ACCIDENT'
  | 'TUTORIAL'
  | 'HUTANG_BUKU';

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  serveMode: 'klik' | 'seret';
  graphicsQuality: 'rendah' | 'sedang' | 'tinggi';
  batterySaver: boolean;
  language: 'id' | 'su';
  rogAllyMode: boolean;
}

export interface ItemDef {
  id: string;
  name: string;
  sundaName: string;
  category: 'warung' | 'ngopi' | 'hasil_alam';
  wholesalePrice: number; // harga kulakan di pasar (Rp)
  retailPrice: number; // harga jual default (Rp)
  energyRestore?: number;
  seasonTag?: 'kemarau' | 'hujan' | 'semua';
  description: string;
  emojiIcon: string;
}

export interface Hotspot {
  id: string;
  label: string;
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  actionType:
    | 'enter_scene'
    | 'open_pasar_transport'
    | 'open_pasar_shop'
    | 'pray_masjid'
    | 'pray_home'
    | 'sleep_bed'
    | 'cook_dapur'
    | 'ngopi_warung'
    | 'fishing'
    | 'fruit_picking'
    | 'forage_hutan'
    | 'clean_air'
    | 'tradition_board';
  targetScene?: SceneId;
  targetSpawn?: { x: number; y: number };
  subtitle?: string;
}

export interface RoadPathDef {
  points: { x: number; y: number }[];
  laneOffset: number;
}

export interface RectObstacle {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface SceneDef {
  id: SceneId;
  name: string;
  subtitle: string;
  bgImage: string;
  bgPosition?: string;
  isIndoor: boolean;
  hasRoad: boolean;
  roadPath?: RoadPathDef;
  roadYMin?: number; // % from top
  roadYMax?: number; // % from top
  crosswalkX?: number; // % safe crossing zone
  allowedVehicles?: VehicleType[];
  obstacles?: RectObstacle[];
  defaultSpawn: { x: number; y: number };
  hotspots: Hotspot[];
  neighbors: { label: string; scene: SceneId; direction: 'Kiri' | 'Kanan' | 'Atas' | 'Bawah' }[];
}

export interface DialogueOption {
  text: string;
  textId: string; // Terjemahan Bahasa Indonesia
  tone: 'ramah' | 'biasa' | 'ketus';
  reputationDelta: number;
  satisfactionDelta: number;
  reply: string;
  replyId: string; // Terjemahan Bahasa Indonesia
}

export interface NpcWaypoint {
  x: number;
  y: number;
  pauseSec?: number;
  label?: string;
}

export interface NpcScheduleSlot {
  id: string;
  startMinutes: number; // 0..1439
  endMinutes: number;   // 0..1440
  waypoints: NpcWaypoint[];
}

export interface NpcDef {
  id: string;
  name: string;
  role: string;
  scene: SceneId;
  x: number;
  y: number;
  patrolPath?: NpcWaypoint[];
  dailySchedule?: NpcScheduleSlot[];
  walkSpeed?: number; // % per second
  shirtColor: string;
  accentColor: string;
  hatType: 'peci' | 'iket' | 'kerudung' | 'topi' | 'none';
  greetings: string[];
  greetingsId: string[]; // Terjemahan Bahasa Indonesia
  options: DialogueOption[];
  isCustomer?: boolean;
}

export interface SideJobDef {
  id: string;
  title: string;
  locationLabel: string;
  scene: SceneId;
  period: 'pagi' | 'malam'; // pagi: 05.00-09.00, malam: 17.00-21.00
  startHour: number;
  endHour: number;
  reward: number; // Rupiah
  energyCost: number;
  durationMinutes: number;
  description: string;
  steps: string[];
}

export interface TraditionDef {
  id: TraditionName;
  dayTrigger: number; // day % 14 or specific day
  title: string;
  description: string;
  urunanAmount: number;
  reputationGain: number;
  hostNpc: string;
}

export interface CustomerOrder {
  id: string;
  customerName: string;
  customerRole: string;
  shirtColor: string;
  hatType: 'peci' | 'iket' | 'kerudung' | 'topi' | 'none';
  greeting: string;
  greetingId: string;
  items: { itemId: string; qty: number }[];
  fulfilled: Record<string, number>;
  patience: number; // 0..100
  maxPatience: number;
}

export interface MovingVehicle {
  uid: string;
  type: VehicleType;
  progress: number; // 0..1 along roadPath
  x: number; // % 0..100
  y: number; // % 0..100
  angleDeg: number;
  direction: 1 | -1;
  speed: number; // progress units per second
  medicalCost: number;
}

export interface DebtRecord {
  id: string;
  reason: string;
  amount: number;
  dayCreated: number;
}

export interface FinancialTransaction {
  id: string;
  day: number;
  minutesOfDay: number;
  type: 'income' | 'expense';
  category:
    | 'warung'
    | 'pasar'
    | 'kerja'
    | 'transport'
    | 'konsumsi'
    | 'tradisi'
    | 'hutang'
    | 'kesehatan'
    | 'misi';
  title: string;
  detail?: string;
  amount: number;
}

export type DailyMissionTaskId =
  | 'greet_warga'
  | 'sell_items'
  | 'forage_herbal'
  | 'catch_fish'
  | 'side_job'
  | 'pray_jamaah';

export interface DailyMissionTask {
  id: DailyMissionTaskId;
  label: string;
  target: number;
  progress: number;
  rewardPoints: number;
  rewardMoney: number;
  claimed: boolean;
}

export interface DailyMissionsState {
  day: number;
  tasks: DailyMissionTask[];
  bonusClaimed: boolean;
}

export interface ReviewEntry {
  id: string;
  author: string;
  rating: number;
  comment: string;
  day: number;
}

export interface GameState {
  slotId: number;
  playerName: 'Arga';
  warungName: string;
  day: number; // starts 1
  minutesOfDay: number; // 0..1439 (e.g., 360 = 06:00)
  money: number; // Rupiah
  debt: number; // Total hutang Rupiah
  debtRecords: DebtRecord[];
  energy: number; // 0..100
  reputation: number; // 1.0..5.0
  wargaSatisfaction: number; // 0..100
  warungLevel: number;
  warungRenovationLevel?: number; // 0=8 slot awal, 1=12 slot, 2=17 slot, 3=22 slot (semua barang)
  rank: number;
  scene: SceneId;
  playerPos: { x: number; y: number };
  facing: 'left' | 'right';
  isInjured: boolean;
  injuryDaysLeft: number;
  warungOpen: boolean;
  warungCloseReason: string | null;
  inventory: Record<string, number>; // itemId -> qty
  customPrices: Record<string, number>; // itemId -> retailPrice
  prayedToday: PrayerName[];
  remindedPrayersToday: PrayerName[];
  completedJobsToday: string[];
  greetedNpcsToday: string[];
  paidTraditions: string[];
  activeTradition: TraditionName | null;
  activePrayerAlert: PrayerName | null;
  reviews: ReviewEntry[];
  totalSalesCount: number;
  totalRevenue: number;
  activityPoints: number;
  totalSideJobsCount: number;
  totalGreetingsCount: number;
  totalPrayersCount: number;
  totalActivitiesCount: number;
  fruitPickedToday: boolean;
  season: SeasonType;
  weather: WeatherCondition;
  weatherRemainingMin: number;
  weatherForecast?: WeatherForecastDay[];
  transactions?: FinancialTransaction[];
  dailyMissions?: DailyMissionsState;
  lastSavedAt: string;
}

export interface SaveSlotSummary {
  slotId: number;
  empty: boolean;
  warungName?: string;
  playerName?: string;
  level?: number;
  day?: number;
  dateLabel?: string;
  money?: number;
  rankLabel?: string;
  state?: GameState;
}
