import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Map as MapIcon,
  Menu,
  Smartphone,
  Star,
  Trophy,
  AlertCircle,
  Sparkles,
  MoonStar,
  Save,
  FolderOpen,
  CheckCircle2,
  Gift,
  Maximize2,
  Minimize2,
  Dices,
  MapPin,
} from 'lucide-react';
import {
  ASSETS,
  DAILY_MISSION_GRAND_BONUS,
  DEFAULT_SETTINGS,
  ITEMS,
  ITEM_MAP,
  NPCS,
  PRAYER_SCHEDULE,
  SCENES,
  SEASON_META,
  SIDE_JOBS,
  TRADITIONS,
  VEHICLE_INFO,
  WEATHER_META,
  advanceDailyMissionProgress,
  appendTransaction,
  computeEffectiveActivityPoints,
  createInitialGameState,
  ensureDailyMissions,
  ensureWeatherForecast,
  formatGameDate,
  formatGameTime,
  formatRupiah,
  getArgaOutfitState,
  getPlayerRankInfo,
  getWarungRenovationInfo,
  rollInitialSeasonAndWeather,
  rollNextWeather,
} from './data/gameData';
import {
  ActiveModal,
  CustomerOrder,
  DailyMissionTaskId,
  DialogueOption,
  GameScreen,
  GameSettings,
  GameState,
  Hotspot,
  NpcDef,
  PrayerName,
  SaveSlotSummary,
  SceneId,
  SideJobDef,
  TraditionDef,
  VehicleType,
} from './types/game';
import { soundEngine } from './utils/audio';
import { emitUiGamepadAction, GamepadActionEvent, useGamepad } from './hooks/useGamepad';
import { CoverScreen } from './components/CoverScreen';
import { SaveSlotsModal } from './components/SaveSlotsModal';
import { SettingsModal } from './components/SettingsModal';
import { GameWorldCanvas } from './components/GameWorldCanvas';
import { WarungInteriorView } from './components/WarungInteriorView';
import { WarungAsihView } from './components/WarungAsihView';
import { HomeInteriorView } from './components/HomeInteriorView';
import { FishingModal, FruitPickingModal, SideJobModal } from './components/MinigamesModal';
import { PasarShopModal, TransportPasarModal } from './components/PasarAndTransportModal';
import {
  AccidentModal,
  AccessCodeModal,
  ChangelogAndGuideModal,
  DialogueModal,
  DisplayModeModal,
  MapModal,
  PhoneModal,
  PrayerReminderModal,
  TraditionModal,
} from './components/ModalsAndOverlays';
import { CulturalStageModal } from './components/CulturalStageModal';
import { KaulinanModal, KaulinanRewardPayload } from './components/KaulinanModal';
import { LandscapeOrientationGuard, OfflineNoticePill } from './components/PWAAndOrientationUI';

const SLOT_STORAGE_PREFIX = 'sunda_life_sim_slot_';
const ACTIVE_SLOT_STORAGE_KEY = 'sunda_life_sim_active_slot';
const SETTINGS_STORAGE_KEY = 'sunda_life_sim_settings';
const ACCESS_CODE_STORAGE_KEY = 'sunda_life_sim_access_granted';

function resolveFeaturedTradition(day: number, paidTraditions: string[]): TraditionDef {
  const cycleDay = ((day - 1) % 12) + 1;
  const todayTrad = TRADITIONS.find((t) => t.dayTrigger === cycleDay);
  if (todayTrad) return todayTrad;
  return (
    TRADITIONS.find((t) => !paidTraditions.includes(`${t.id}_d${day}`)) ??
    TRADITIONS[0]
  );
}

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function readAllSaveSlots(): SaveSlotSummary[] {
  const list: SaveSlotSummary[] = [];
  for (let i = 1; i <= 6; i++) {
    try {
      const raw = localStorage.getItem(`${SLOT_STORAGE_PREFIX}${i}`);
      if (!raw) {
        list.push({ slotId: i, empty: true });
      } else {
        const rawParsed = JSON.parse(raw) as GameState;
        const effectivePts = computeEffectiveActivityPoints(rawParsed);
        const rankInfo = getPlayerRankInfo(effectivePts);
        const warungName =
          !rawParsed.warungName || rawParsed.warungName === 'Warung Asih'
            ? 'Warung Arga'
            : rawParsed.warungName;
        const defaultPrices: Record<string, number> = {};
        for (const it of ITEMS) {
          defaultPrices[it.id] = it.retailPrice;
        }
        const safeDay = Math.max(1, Math.floor(Number(rawParsed.day) || 1));
        const safeMinutesOfDay = Number.isFinite(rawParsed.minutesOfDay)
          ? ((Math.floor(rawParsed.minutesOfDay) % 1440) + 1440) % 1440
          : 450;
        const fallbackWeather = rollInitialSeasonAndWeather(safeMinutesOfDay);
        const parsed: GameState = {
          ...rawParsed,
          slotId: i,
          day: safeDay,
          minutesOfDay: safeMinutesOfDay,
          playerName: 'Arga',
          warungName,
          customPrices: { ...defaultPrices, ...(rawParsed.customPrices ?? {}) },
          warungRenovationLevel: rawParsed.warungRenovationLevel ?? 0,
          activityPoints: effectivePts,
          totalSideJobsCount: rawParsed.totalSideJobsCount ?? 0,
          totalGreetingsCount: rawParsed.totalGreetingsCount ?? 0,
          totalPrayersCount: rawParsed.totalPrayersCount ?? 1,
          totalActivitiesCount: rawParsed.totalActivitiesCount ?? 0,
          season: rawParsed.season ?? fallbackWeather.season,
          weather: rawParsed.weather ?? fallbackWeather.weather,
          weatherRemainingMin:
            typeof rawParsed.weatherRemainingMin === 'number'
              ? rawParsed.weatherRemainingMin
              : fallbackWeather.weatherRemainingMin,
          weatherForecast: ensureWeatherForecast(
            safeDay,
            rawParsed.season ?? fallbackWeather.season,
            rawParsed.weather ?? fallbackWeather.weather,
            rawParsed.weatherForecast
          ),
          transactions: Array.isArray(rawParsed.transactions)
            ? rawParsed.transactions.slice(0, 10)
            : [],
          dailyMissions: ensureDailyMissions(
            safeDay,
            rawParsed.dailyMissions,
            rawParsed.greetedNpcsToday?.length ?? 0,
            rawParsed.prayedToday?.length ?? 0
          ),
        };
        list.push({
          slotId: i,
          empty: false,
          warungName: parsed.warungName,
          playerName: 'Arga',
          level: parsed.warungLevel,
          rankLabel: rankInfo.fullLabel,
          day: parsed.day,
          dateLabel: formatGameDate(parsed.day),
          money: parsed.money,
          state: parsed,
        });
      }
    } catch {
      list.push({ slotId: i, empty: true });
    }
  }
  return list;
}

function advanceClockState(
  prev: GameState,
  deltaMinutes: number
): { next: GameState; autoClosedToast: string | null; weatherToast: string | null } {
  const rawMin = (Number.isFinite(prev.minutesOfDay) ? prev.minutesOfDay : 450) + deltaMinutes;
  const daysPassed = Math.floor(rawMin / 1440);
  const nextMin = ((rawMin % 1440) + 1440) % 1440;

  let nextDay = Math.max(1, Math.floor(Number(prev.day) || 1));
  let nextPrayed = prev.prayedToday;
  let nextReminded = prev.remindedPrayersToday;
  let nextJobs = prev.completedJobsToday;
  let nextGreeted = prev.greetedNpcsToday;
  let nextFruitPicked = prev.fruitPickedToday;
  let nextInjured = prev.isInjured;
  let nextInjuryDays = prev.injuryDaysLeft;
  let nextSeason = prev.season ?? 'kemarau';
  let nextWeather = prev.weather ?? 'cerah';
  let nextWeatherRemaining = (prev.weatherRemainingMin ?? 90) - deltaMinutes;
  let nextForecast = ensureWeatherForecast(prev.day, nextSeason, nextWeather, prev.weatherForecast);
  let nextMissions = ensureDailyMissions(
    prev.day,
    prev.dailyMissions,
    prev.greetedNpcsToday.length,
    prev.prayedToday.length
  );
  let weatherToast: string | null = null;

  if (daysPassed > 0) {
    nextDay += daysPassed;
    nextPrayed = [];
    nextReminded = [];
    nextJobs = [];
    nextGreeted = [];
    nextFruitPicked = false;
    nextMissions = ensureDailyMissions(nextDay, undefined, 0, 0);
    if (nextInjuryDays > 0) {
      nextInjuryDays = Math.max(0, nextInjuryDays - daysPassed);
      if (nextInjuryDays <= 0) nextInjured = false;
    }
    const targetForecast = nextForecast.find((f) => f.day === nextDay);
    if (targetForecast) {
      nextSeason = targetForecast.season;
      nextWeather = targetForecast.morning;
      nextWeatherRemaining = 90 + Math.floor(Math.random() * 60);
    } else if (Math.random() < 0.38) {
      nextSeason = nextSeason === 'hujan' ? 'kemarau' : 'hujan';
    }
    nextForecast = ensureWeatherForecast(nextDay, nextSeason, nextWeather, nextForecast);
  }

  // Cuaca berubah berkala (di Musim Hujan hujan tidak turun terus-menerus, bergantian hujan/gerimis & mendung/cerah)
  if (nextWeatherRemaining <= 0) {
    const rolled = rollNextWeather(nextSeason, nextWeather, nextMin);
    if (rolled.weather !== nextWeather) {
      if (rolled.weather === 'hujan') {
        weatherToast = '🌧️ Hujan mulai turun di Kampung Sukamaju! Warga mencari Jas Hujan & Bandrek di warung.';
      } else if (rolled.weather === 'gerimis') {
        weatherToast = '🌦️ Gerimis turun ringan di kampung.';
      } else if ((nextWeather === 'hujan' || nextWeather === 'gerimis') && (rolled.weather === 'mendung' || rolled.weather === 'cerah')) {
        weatherToast = '⛅ Hujan sudah reda! Langit kampung kembali tenang.';
      } else if (rolled.weather === 'terik' && nextMin >= 10 * 60 && nextMin < 15 * 60) {
        weatherToast = '☀️ Matahari siang bersinar terik! Es Cendol & Teh Manis laris di warung.';
      }
    }
    nextWeather = rolled.weather;
    nextWeatherRemaining = rolled.durationMin;
  }

  let warungOpen = prev.warungOpen;
  let warungCloseReason = prev.warungCloseReason;
  let autoClosedToast: string | null = null;
  if (warungOpen && (nextMin >= 17 * 60 || nextMin < 9 * 60)) {
    warungOpen = false;
    warungCloseReason =
      'Sudah jam 17.00 WIB: Warung Arga tutup, waktunya keliling kampung atau kerja malam!';
    autoClosedToast = warungCloseReason;
  }

  return {
    next: {
      ...prev,
      day: nextDay,
      minutesOfDay: nextMin,
      warungOpen,
      warungCloseReason,
      prayedToday: nextPrayed,
      remindedPrayersToday: nextReminded,
      completedJobsToday: nextJobs,
      greetedNpcsToday: nextGreeted,
      fruitPickedToday: nextFruitPicked,
      isInjured: nextInjured,
      injuryDaysLeft: nextInjuryDays,
      season: nextSeason,
      weather: nextWeather,
      weatherRemainingMin: nextWeatherRemaining,
      weatherForecast: nextForecast,
      dailyMissions: nextMissions,
    },
    autoClosedToast,
    weatherToast,
  };
}

export default function App() {
  const [hasAccess, setHasAccess] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ACCESS_CODE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [screen, setScreen] = useState<GameScreen>('COVER');
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [slots, setSlots] = useState<SaveSlotSummary[]>(() => readAllSaveSlots());
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(1));
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Modal contextual payloads
  const [activeNpc, setActiveNpc] = useState<NpcDef | null>(null);
  const [activeSideJob, setActiveSideJob] = useState<SideJobDef | null>(null);
  const [activePrayerAlert, setActivePrayerAlert] = useState<{ prayer: PrayerName; wasWarungOpen: boolean } | null>(null);
  const [activeTradition, setActiveTradition] = useState<TraditionDef | null>(null);
  const [accidentInfo, setAccidentInfo] = useState<{
    vehicle: VehicleType;
    medicalFee: number;
    paidCash: number;
    addedDebt: number;
  } | null>(null);

  // HUD collapsible states & notifications (auto-collapse sidebars on short HP landscape viewports)
  const [missionOpen, setMissionOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight >= 520 : true
  );
  const [jobsOpen, setJobsOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight >= 520 : true
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [coverFocusIdx, setCoverFocusIdx] = useState(0);
  const [slotFocusIdx, setSlotFocusIdx] = useState(0);
  const [pendingLaunch, setPendingLaunch] = useState<
    { type: 'continue' } | { type: 'slot'; slotId: number; label: string } | null
  >(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );

  const nearestActionRef = useRef<{ label: string; execute: () => void } | null>(null);
  const [nearestActionLabel, setNearestActionLabel] = useState<string | null>(null);
  const [argaWorldGesture, setArgaWorldGesture] = useState<'none' | 'wave' | 'salute' | 'nod'>('none');
  const gestureTimerRef = useRef<number | null>(null);
  const [sceneFadeOpacity, setSceneFadeOpacity] = useState<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const fadeTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      fadeTimersRef.current.forEach((id) => window.clearTimeout(id));
      fadeTimersRef.current = [];
      if (gestureTimerRef.current !== null) window.clearTimeout(gestureTimerRef.current);
    };
  }, []);

  const triggerWorldGreeting = useCallback((gesture: 'wave' | 'salute' | 'nod', durationMs = 1500) => {
    setArgaWorldGesture(gesture);
    if (gestureTimerRef.current !== null) window.clearTimeout(gestureTimerRef.current);
    gestureTimerRef.current = window.setTimeout(() => {
      setArgaWorldGesture('none');
      gestureTimerRef.current = null;
    }, durationMs);
  }, []);

  const transitionToScene = useCallback(
    (
      applyFn: () => void,
      sfx: 'door' | 'click' | 'none' = 'click',
      onAfterTransition?: () => void
    ) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      fadeTimersRef.current.forEach((id) => window.clearTimeout(id));
      fadeTimersRef.current = [];

      if (sfx === 'door') soundEngine.doorChime();
      else if (sfx === 'click') soundEngine.click();

      setSceneFadeOpacity(1);
      const t1 = window.setTimeout(() => {
        applyFn();
        const t2 = window.setTimeout(() => {
          setSceneFadeOpacity(0);
          onAfterTransition?.();
          const t3 = window.setTimeout(() => {
            isTransitioningRef.current = false;
          }, 320);
          fadeTimersRef.current.push(t3);
        }, 65);
        fadeTimersRef.current.push(t2);
      }, 260);
      fadeTimersRef.current.push(t1);
    },
    []
  );

  useEffect(() => {
    const syncFullscreen = () => {
      const fsDoc = document as Document & { webkitFullscreenElement?: Element | null };
      setIsFullscreen(Boolean(document.fullscreenElement || fsDoc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen as EventListener);
    };
  }, []);

  const applyFullscreenChoice = useCallback((wantFullscreen: boolean) => {
    try {
      const fsDoc = document as Document & {
        webkitFullscreenElement?: Element | null;
        webkitExitFullscreen?: () => Promise<void> | void;
      };
      const fsEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      const currentlyFs = Boolean(document.fullscreenElement || fsDoc.webkitFullscreenElement);
      if (wantFullscreen) {
        if (!currentlyFs) {
          if (fsEl.requestFullscreen) {
            void fsEl.requestFullscreen().catch(() => {});
          } else if (fsEl.webkitRequestFullscreen) {
            fsEl.webkitRequestFullscreen();
          }
        }
      } else if (currentlyFs) {
        if (document.exitFullscreen) {
          void document.exitFullscreen().catch(() => {});
        } else if (fsDoc.webkitExitFullscreen) {
          fsDoc.webkitExitFullscreen();
        }
      }
    } catch {
      // ignore browser fullscreen restriction
    }
  }, []);

  // Sync audio volume with settings
  useEffect(() => {
    soundEngine.musicVolume = settings.musicVolume / 100;
    soundEngine.sfxVolume = settings.sfxVolume / 100;
    soundEngine.ambientVolume = settings.ambientVolume / 100;
    soundEngine.syncVolumes();
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage quota
    }
  }, [settings]);

  // Unlock browser audio cleanly on first user interaction so ambient crickets/rooster start promptly
  useEffect(() => {
    const onFirstInteract = () => {
      soundEngine.unlock();
    };
    window.addEventListener('pointerdown', onFirstInteract, { passive: true });
    window.addEventListener('keydown', onFirstInteract, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstInteract);
      window.removeEventListener('keydown', onFirstInteract);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const saveGameToSlot = useCallback((stateToSave: GameState, targetSlotId?: number) => {
    try {
      const resolvedSlotId = targetSlotId ?? stateToSave.slotId;
      const updated: GameState = {
        ...stateToSave,
        slotId: resolvedSlotId,
        lastSavedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${SLOT_STORAGE_PREFIX}${resolvedSlotId}`, JSON.stringify(updated));
      localStorage.setItem(ACTIVE_SLOT_STORAGE_KEY, String(resolvedSlotId));
      setSlots(readAllSaveSlots());
    } catch {
      // ignore
    }
  }, []);

  // Auto-save periodically & before page unload into active slot's localStorage
  useEffect(() => {
    if (screen !== 'PLAYING') return;
    const interval = setInterval(() => {
      saveGameToSlot(gameStateRef.current);
    }, 8000);
    const handleBeforeUnload = () => {
      saveGameToSlot(gameStateRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [screen, saveGameToSlot]);

  // Active or latest occupied slot for Cover "LANJUTKAN" button
  const latestSlot = useMemo(() => {
    const filled = slots.filter((s) => !s.empty && s.state);
    if (filled.length === 0) return null;
    try {
      const preferredId = Number(localStorage.getItem(ACTIVE_SLOT_STORAGE_KEY));
      const preferred = filled.find((s) => s.slotId === preferredId);
      if (preferred) return preferred;
    } catch {
      // ignore
    }
    filled.sort(
      (a, b) =>
        new Date(b.state?.lastSavedAt ?? 0).getTime() - new Date(a.state?.lastSavedAt ?? 0).getTime()
    );
    return filled[0];
  }, [slots]);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const rankInfo = useMemo(
    () => getPlayerRankInfo(computeEffectiveActivityPoints(gameState)),
    [gameState]
  );
  const lastRankTierRef = useRef<string>(rankInfo.tier);
  useEffect(() => {
    if (screen !== 'PLAYING') {
      lastRankTierRef.current = rankInfo.tier;
      return;
    }
    if (lastRankTierRef.current !== rankInfo.tier) {
      lastRankTierRef.current = rankInfo.tier;
      soundEngine.angklungSuccess();
      showToast(`NAIK PERINGKAT! Arga sekarang mencapai peringkat ${rankInfo.fullLabel}!`);
    }
  }, [rankInfo.tier, rankInfo.fullLabel, screen, showToast]);

  // Game Clock Loop (+1 minute every 1.1s) + Prayer, Warung Hours & Tradition Triggers
  useEffect(() => {
    if (screen !== 'PLAYING' || activeModal !== null) return;

    const timer = setInterval(() => {
      const prev = gameStateRef.current;
      const { next: advanced, autoClosedToast, weatherToast } = advanceClockState(prev, 1);
      const nextMin = advanced.minutesOfDay;
      const nextDay = advanced.day;

      let warungOpen = advanced.warungOpen;
      let closeReason = advanced.warungCloseReason;
      let nextReminded = advanced.remindedPrayersToday;

      // Prayer time reminder check (wide 75-min catch window so time-jumping actions don't skip reminders)
      let triggeredPrayer: { prayer: PrayerName; wasWarungOpen: boolean } | null = null;
      for (const p of PRAYER_SCHEDULE) {
        if (nextMin >= p.minutes && nextMin <= p.minutes + 75 && !nextReminded.includes(p.name)) {
          nextReminded = [...nextReminded, p.name];
          const wasOpen = warungOpen;
          if (warungOpen) {
            warungOpen = false;
            closeReason = `Warung tutup sementara untuk sholat ${p.name}.`;
          }
          triggeredPrayer = { prayer: p.name, wasWarungOpen: wasOpen };
          break;
        }
      }

      // Tradition Day Check (triggered at realistic event window for that tradition)
      const matchingTradition = TRADITIONS.find(
        (t) => t.dayTrigger === ((nextDay - 1) % 12) + 1 && !advanced.paidTraditions.includes(`${t.id}_d${nextDay}`)
      );
      const isInTraditionWindow = Boolean(
        matchingTradition &&
          nextMin >= matchingTradition.startMinutes &&
          nextMin <= matchingTradition.endMinutes
      );
      const shouldOpenTradition =
        !triggeredPrayer &&
        Boolean(matchingTradition) &&
        isInTraditionWindow &&
        advanced.activeTradition !== matchingTradition?.id;

      setGameState((curr) => {
        const synced = advanceClockState(curr, 1).next;
        return {
          ...synced,
          warungOpen,
          warungCloseReason: closeReason,
          remindedPrayersToday: nextReminded,
          activeTradition:
            shouldOpenTradition && matchingTradition ? matchingTradition.id : synced.activeTradition,
          season: advanced.season,
          weather: advanced.weather,
          weatherRemainingMin: advanced.weatherRemainingMin,
          weatherForecast: advanced.weatherForecast,
        };
      });

      if (advanced.day > prev.day) {
        setToastMsg(`🌅 Hari baru! Sekarang ${formatGameDate(advanced.day)} (Hari ke-${advanced.day}).`);
      } else if (autoClosedToast) {
        setToastMsg(autoClosedToast);
      } else if (weatherToast) {
        setToastMsg(weatherToast);
      }
      if (triggeredPrayer) {
        soundEngine.playAdzan();
        setActivePrayerAlert(triggeredPrayer);
        setActiveModal('PRAYER_REMINDER');
      } else if (shouldOpenTradition && matchingTradition) {
        setActiveTradition(matchingTradition);
        setActiveModal('TRADITION_EVENT');
      }
    }, 650);

    return () => clearInterval(timer);
  }, [screen, activeModal]);

  // Handlers
  const executeLaunchContinue = useCallback(() => {
    if (latestSlot?.state) {
      setGameState(latestSlot.state);
      try {
        localStorage.setItem(ACTIVE_SLOT_STORAGE_KEY, String(latestSlot.slotId));
      } catch {
        // ignore
      }
      showToast(`Selamat datang kembali, Arga! (Slot ${latestSlot.slotId} · ${latestSlot.warungName})`);
    } else {
      const fresh = createInitialGameState(1);
      setGameState(fresh);
      saveGameToSlot(fresh, 1);
      showToast('Selamat datang di Kampung Sunda Sukamaju, Arga!');
    }
    setActiveModal(null);
    setScreen('PLAYING');
  }, [latestSlot, saveGameToSlot, showToast]);

  const executeLaunchSlot = useCallback(
    (slotId: number) => {
      const found = slots.find((s) => s.slotId === slotId);
      if (found && !found.empty && found.state) {
        setGameState(found.state);
        try {
          localStorage.setItem(ACTIVE_SLOT_STORAGE_KEY, String(slotId));
        } catch {
          // ignore
        }
        showToast(`Memuat Slot ${slotId} · ${found.state.warungName}`);
      } else {
        const fresh = createInitialGameState(slotId);
        setGameState(fresh);
        saveGameToSlot(fresh, slotId);
        showToast(`Memulai permainan baru di Slot ${slotId}`);
      }
      setActiveModal(null);
      setScreen('PLAYING');
    },
    [slots, saveGameToSlot, showToast]
  );

  const handleStartOrContinue = useCallback(() => {
    soundEngine.confirm();
    setPendingLaunch({ type: 'continue' });
    setActiveModal('DISPLAY_MODE');
  }, []);

  const handleSelectSlot = useCallback(
    (slotId: number) => {
      soundEngine.confirm();
      if (screen === 'COVER') {
        const found = slots.find((s) => s.slotId === slotId);
        const label =
          found && !found.empty && found.state
            ? `Muat Slot ${slotId} (${found.state.warungName})`
            : `Mulai Permainan Baru di Slot ${slotId}`;
        setPendingLaunch({ type: 'slot', slotId, label });
        setActiveModal('DISPLAY_MODE');
        return;
      }
      executeLaunchSlot(slotId);
    },
    [screen, slots, executeLaunchSlot]
  );

  const handleConfirmDisplayMode = useCallback(
    (wantFullscreen: boolean) => {
      applyFullscreenChoice(wantFullscreen);
      soundEngine.confirm();
      const target = pendingLaunch;
      setPendingLaunch(null);
      if (target?.type === 'slot') {
        executeLaunchSlot(target.slotId);
      } else {
        executeLaunchContinue();
      }
    },
    [applyFullscreenChoice, pendingLaunch, executeLaunchSlot, executeLaunchContinue]
  );

  const handleSaveCurrentToSlot = useCallback(
    (slotId: number) => {
      soundEngine.confirm();
      const updated: GameState = { ...gameStateRef.current, slotId };
      setGameState(updated);
      saveGameToSlot(updated, slotId);
      showToast(`Progress berhasil disimpan ke Slot ${slotId}!`);
    },
    [saveGameToSlot, showToast]
  );

  const handleDeleteSlot = (slotId: number) => {
    soundEngine.click();
    localStorage.removeItem(`${SLOT_STORAGE_PREFIX}${slotId}`);
    setSlots(readAllSaveSlots());
  };

  const handleExitToCover = useCallback(() => {
    soundEngine.stopAdzan();
    soundEngine.stopMorningAndNightRealAudio();
    soundEngine.click();
    saveGameToSlot(gameStateRef.current);
    setActiveModal(null);
    setActiveNpc(null);
    setActiveSideJob(null);
    setActivePrayerAlert(null);
    setActiveTradition(null);
    setAccidentInfo(null);
    setScreen('COVER');
  }, [saveGameToSlot]);

  const handleChangeScene = useCallback(
    (target: SceneId, customSpawn?: { x: number; y: number }, onArrived?: () => void) => {
      if (gameStateRef.current.scene === target && !customSpawn) {
        onArrived?.();
        return;
      }
      const sc = SCENES[target];
      transitionToScene(
        () => {
          setGameState((prev) => {
            const { next } = advanceClockState(prev, 3);
            return {
              ...next,
              scene: target,
              playerPos: customSpawn ?? sc.defaultSpawn,
            };
          });
        },
        sc.isIndoor ? 'door' : 'click',
        onArrived
      );
    },
    [transitionToScene]
  );

  const handleTriggerHotspot = useCallback(
    (hs: Hotspot) => {
      soundEngine.click();
      if (hs.actionType === 'enter_scene' && hs.targetScene) {
        handleChangeScene(hs.targetScene, hs.targetSpawn);
        return;
      }
      if (hs.actionType === 'open_pasar_transport') {
        setActiveModal('TRANSPORT_PASAR');
        return;
      }
      if (hs.actionType === 'open_pasar_shop') {
        setActiveModal('PASAR_SHOP');
        return;
      }
      if (hs.actionType === 'fishing') {
        setActiveModal('FISHING');
        return;
      }
      if (hs.actionType === 'fruit_picking') {
        setActiveModal('FRUIT_PICKING');
        return;
      }
      if (hs.actionType === 'cultural_stage') {
        setActiveModal('CULTURAL_STAGE');
        return;
      }
      if (hs.actionType === 'traditional_games') {
        setActiveModal('TRADITIONAL_GAMES');
        return;
      }
      if (hs.actionType === 'tradition_board') {
        const nextTrad = resolveFeaturedTradition(gameState.day, gameState.paidTraditions);
        setActiveTradition(nextTrad);
        setActiveModal('TRADITION_EVENT');
        return;
      }
      if (hs.actionType === 'pray_masjid') {
        soundEngine.prayerBell();
        const curPrayer =
          [...PRAYER_SCHEDULE].reverse().find((p) => gameState.minutesOfDay >= p.minutes) ?? PRAYER_SCHEDULE[0];
        setGameState((prev) => {
          const { next } = advanceClockState(prev, 12);
          const nextPrayed = next.prayedToday.includes(curPrayer.name)
            ? next.prayedToday
            : [...next.prayedToday, curPrayer.name];
          return {
            ...next,
            energy: Math.min(100, next.energy + 10),
            reputation: Math.min(5, Number((next.reputation + 0.04).toFixed(2))),
            prayedToday: nextPrayed,
            activityPoints: computeEffectiveActivityPoints(prev) + 10,
            totalPrayersCount: (next.totalPrayersCount ?? 0) + 1,
            dailyMissions: ensureDailyMissions(
              next.day,
              next.dailyMissions,
              next.greetedNpcsToday.length,
              nextPrayed.length
            ),
          };
        });
        showToast(`Alhamdulillah, Arga sholat ${curPrayer.name} di Masjid Al-Ikhlas (+10 Poin Keaktifan).`);
        return;
      }
      if (hs.actionType === 'forage_hutan') {
        if (gameState.energy < 10) {
          soundEngine.error();
          showToast('Energi Arga terlalu lelah! Mampir ke Warung Asih atau istirahat dulu.');
          return;
        }
        soundEngine.rustleLeaves();
        setGameState((prev) => {
          const { next } = advanceClockState(prev, 20);
          return {
            ...next,
            energy: Math.max(0, next.energy - 8),
            activityPoints: computeEffectiveActivityPoints(prev) + 5,
            totalActivitiesCount: (next.totalActivitiesCount ?? 0) + 1,
            inventory: {
              ...next.inventory,
              herbal_hutan: (next.inventory.herbal_hutan ?? 0) + 1,
            },
            dailyMissions: advanceDailyMissionProgress(
              next.dailyMissions,
              next.day,
              'forage_herbal',
              1,
              next.greetedNpcsToday.length,
              next.prayedToday.length
            ),
          };
        });
        showToast('Arga menemukan Rempah & Madu Hutan dari pinggiran Hutan Tutupan! (+5 Poin)');
        return;
      }
      if (hs.actionType === 'clean_air') {
        soundEngine.splashWater();
        setGameState((prev) => {
          const { next } = advanceClockState(prev, 15);
          return {
            ...next,
            energy: Math.min(100, next.energy + 15),
            activityPoints: computeEffectiveActivityPoints(prev) + 4,
            totalActivitiesCount: (next.totalActivitiesCount ?? 0) + 1,
          };
        });
        showToast('Segar! Air pancuran bambu pegunungan memulihkan +15% Energi Arga (+4 Poin).');
      }
    },
    [gameState.energy, gameState.minutesOfDay, gameState.paidTraditions, gameState.day, handleChangeScene, showToast]
  );

  const handleTalkNpc = useCallback((npc: NpcDef) => {
    soundEngine.click();
    setActiveNpc(npc);
    setActiveModal('DIALOGUE');
  }, []);

  const handleDialogueChoice = (
    opt: DialogueOption,
    salamBonusPoints = 0,
    salamAppropriate = false
  ) => {
    if (opt.reputationDelta >= 0) soundEngine.confirm();
    else soundEngine.error();

    const extraRep = salamAppropriate ? 0.02 : 0;
    const ptsGain = (opt.tone === 'ramah' ? 8 : opt.tone === 'biasa' ? 5 : 2) + salamBonusPoints;

    setGameState((prev) => {
      const { next } = advanceClockState(prev, 5);
      const nextRep = Math.max(
        1,
        Math.min(5, Number((next.reputation + opt.reputationDelta + extraRep).toFixed(2)))
      );
      const nextSat = Math.max(10, Math.min(100, next.wargaSatisfaction + opt.satisfactionDelta));
      const npcId = activeNpc?.id;
      const greeted =
        npcId && !next.greetedNpcsToday.includes(npcId) ? [...next.greetedNpcsToday, npcId] : next.greetedNpcsToday;
      return {
        ...next,
        reputation: nextRep,
        wargaSatisfaction: nextSat,
        greetedNpcsToday: greeted,
        activityPoints: computeEffectiveActivityPoints(prev) + ptsGain,
        totalGreetingsCount: (next.totalGreetingsCount ?? 0) + 1,
        dailyMissions: ensureDailyMissions(
          next.day,
          next.dailyMissions,
          greeted.length,
          next.prayedToday.length
        ),
      };
    });

    if (salamAppropriate && salamBonusPoints > 0) {
      showToast(`Bahasa Sunda sopan & tepat! +${salamBonusPoints} Poin Etika Salam.`);
    }
  };

  const handleVehicleCollision = useCallback((vehicleType: VehicleType) => {
    soundEngine.crash();
    const prev = gameStateRef.current;
    const info = VEHICLE_INFO[vehicleType];
    const medicalFee = info.medicalCost;
    const paidCash = Math.min(prev.money, medicalFee);
    const addedDebt = Math.max(0, medicalFee - paidCash);
    const nextDebtRecords =
      addedDebt > 0
        ? [
            ...prev.debtRecords,
            {
              id: `debt_${Date.now()}`,
              reason: `Biaya Puskesmas (tertabrak ${info.label})`,
              amount: addedDebt,
              dayCreated: prev.day,
            },
          ]
        : prev.debtRecords;

    setGameState((curr) => ({
      ...curr,
      money: Math.max(0, curr.money - paidCash),
      debt: curr.debt + addedDebt,
      debtRecords: nextDebtRecords,
      warungOpen: false,
      isInjured: true,
      injuryDaysLeft: 1,
      energy: Math.max(25, curr.energy - 30),
      transactions: appendTransaction(curr.transactions, {
        day: curr.day,
        minutesOfDay: curr.minutesOfDay,
        type: 'expense',
        category: 'kesehatan',
        title: `Biaya Puskesmas (Tertabrak ${info.label})`,
        detail:
          addedDebt > 0
            ? `Tunai ${formatRupiah(paidCash)}, Hutang ${formatRupiah(addedDebt)}`
            : 'Dibayar tunai',
        amount: paidCash > 0 ? paidCash : medicalFee,
      }),
    }));
    setAccidentInfo({ vehicle: vehicleType, medicalFee, paidCash, addedDebt });
    setActiveModal('ACCIDENT');
  }, []);

  const handleToggleWarungOpen = () => {
    const hour = gameState.minutesOfDay / 60;
    if (!gameState.warungOpen && (hour < 9 || hour >= 17)) {
      soundEngine.error();
      showToast('Warung Arga hanya boleh buka pukul 09.00 – 17.00 WIB!');
      return;
    }
    soundEngine.confirm();
    setGameState((prev) => ({
      ...prev,
      warungOpen: !prev.warungOpen,
      warungCloseReason: !prev.warungOpen ? null : 'Ditutup sementara oleh Arga',
    }));
  };

  const handleRenovateWarung = () => {
    const curr = gameStateRef.current;
    const info = getWarungRenovationInfo(curr);
    if (!info.nextTier) return;
    if (!info.canAfford) {
      soundEngine.error();
      showToast(`Saldo kurang! Butuh ${formatRupiah(info.nextTier.cost)} untuk renovasi.`);
      return;
    }
    if (!info.meetsRank && !info.moneyExceedsCost) {
      soundEngine.error();
      showToast(
        `Syarat renovasi: capai Rank ${info.nextTier.recommendedRanks[0]} atau saldo melampaui ${formatRupiah(info.nextTier.cost)}.`
      );
      return;
    }

    const tier = info.nextTier;
    soundEngine.angklungSuccess();
    soundEngine.cash();
    setGameState((prev) => {
      const { next } = advanceClockState(prev, 25);
      return {
        ...next,
        money: next.money - tier.cost,
        warungRenovationLevel: tier.level,
        warungLevel: Math.max(next.warungLevel, tier.level + 1),
        reputation: Math.min(5, Number((next.reputation + 0.12).toFixed(2))),
        activityPoints: computeEffectiveActivityPoints(prev) + 25,
        transactions: appendTransaction(next.transactions, {
          day: next.day,
          minutesOfDay: next.minutesOfDay,
          type: 'expense',
          category: 'warung',
          title: `Renovasi Warung (${tier.name})`,
          detail: `Terbuka ${tier.slotCount} slot etalase barang`,
          amount: tier.cost,
        }),
      };
    });
    showToast(
      `Renovasi berhasil! ${tier.name} aktif dengan ${tier.slotCount} slot barang unik (+25 Poin)!`
    );
  };

  const handleServeWarungItem = (_orderId: string, itemId: string) => {
    soundEngine.click();
    setGameState((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [itemId]: Math.max(0, (prev.inventory[itemId] ?? 0) - 1),
      },
    }));
  };

  const handleFinishCustomerOrder = (order: CustomerOrder, success: boolean) => {
    if (success) {
      soundEngine.cash();
      let earned = 0;
      let anyOverpriced = false;
      let allFairOrAffordable = true;
      for (const it of order.items) {
        const def = ITEM_MAP[it.itemId];
        const unitPrice = gameState.customPrices[it.itemId] ?? def?.retailPrice ?? 0;
        earned += unitPrice * it.qty;
        if (def) {
          if (unitPrice > def.retailPrice * 1.35) {
            anyOverpriced = true;
          }
          if (unitPrice > def.retailPrice) {
            allFairOrAffordable = false;
          }
        }
      }

      const repDelta = anyOverpriced ? -0.02 : allFairOrAffordable ? 0.04 : 0.02;
      const satDelta = anyOverpriced ? -2 : allFairOrAffordable ? 2 : 1;

      setGameState((prev) => {
        const { next } = advanceClockState(prev, 8);
        const nextSales = next.totalSalesCount + 1;
        const nextLevel = 1 + Math.floor(nextSales / 8);
        const itemTotal = order.items.reduce((acc, it) => acc + it.qty, 0);
        return {
          ...next,
          money: next.money + earned,
          totalRevenue: next.totalRevenue + earned,
          totalSalesCount: nextSales,
          warungLevel: nextLevel,
          activityPoints: computeEffectiveActivityPoints(prev) + 14,
          reputation: Math.max(1, Math.min(5, Number((next.reputation + repDelta).toFixed(2)))),
          wargaSatisfaction: Math.max(10, Math.min(100, next.wargaSatisfaction + satDelta)),
          energy: Math.max(5, next.energy - 2),
          transactions: appendTransaction(next.transactions, {
            day: next.day,
            minutesOfDay: next.minutesOfDay,
            type: 'income',
            category: 'warung',
            title: `Penjualan Warung (${order.customerName})`,
            detail: `${itemTotal} barang terjual`,
            amount: earned,
          }),
          dailyMissions: advanceDailyMissionProgress(
            next.dailyMissions,
            next.day,
            'sell_items',
            itemTotal,
            next.greetedNpcsToday.length,
            next.prayedToday.length
          ),
        };
      });

      if (anyOverpriced) {
        showToast(
          `${order.customerName} membayar ${formatRupiah(earned)}, tapi merasa harga agak kemahalan!`
        );
      } else {
        showToast(`${order.customerName} puas! Warung Arga menerima ${formatRupiah(earned)} (+14 Poin).`);
      }
    } else {
      soundEngine.error();
      setGameState((prev) => ({
        ...prev,
        reputation: Math.max(1, Number((prev.reputation - 0.05).toFixed(2))),
        wargaSatisfaction: Math.max(10, prev.wargaSatisfaction - 3),
      }));
      showToast(`${order.customerName} kecewa menunggu terlalu lama.`);
    }
  };

  const handleConsumeNgopi = (itemId: string) => {
    const def = ITEM_MAP[itemId];
    if (!def) return;
    if (gameState.money < def.retailPrice) {
      soundEngine.error();
      showToast('Uang tunai Arga tidak cukup!');
      return;
    }
    soundEngine.cookingSizzle();
    setGameState((prev) => {
      const { next } = advanceClockState(prev, 12);
      return {
        ...next,
        money: next.money - def.retailPrice,
        energy: Math.min(100, next.energy + (def.energyRestore ?? 20)),
        activityPoints: computeEffectiveActivityPoints(prev) + 4,
        totalActivitiesCount: (next.totalActivitiesCount ?? 0) + 1,
        transactions: appendTransaction(next.transactions, {
          day: next.day,
          minutesOfDay: next.minutesOfDay,
          type: 'expense',
          category: 'konsumsi',
          title: `Jajan Warung Asih (${def.name})`,
          detail: `Energi +${def.energyRestore ?? 20}%`,
          amount: def.retailPrice,
        }),
      };
    });
    showToast(`Nikmat! Arga menyantap ${def.name} di Warung Asih (+${def.energyRestore}% Energi, +4 Poin).`);
  };

  const handleSleepAtHome = (mode: 'auto' | 'nap' | 'next_day' = 'auto') => {
    const prev = gameStateRef.current;
    const hour = prev.minutesOfDay / 60;
    const isSleepWindow = hour >= 18 || hour < 4.5;
    const doFullSleep = mode === 'next_day' || (mode === 'auto' && (isSleepWindow || prev.isInjured));
    soundEngine.angklungSuccess();

    if (doFullSleep) {
      const nextDay = hour >= 4.5 ? prev.day + 1 : prev.day;
      const rolling = ensureWeatherForecast(
        prev.day,
        prev.season,
        prev.weather,
        prev.weatherForecast
      );
      const nextDayForecast = rolling.find((f) => f.day === nextDay);
      const nextSeason = nextDayForecast?.season ?? prev.season;
      const morningWeather = nextDayForecast
        ? {
            weather: nextDayForecast.morning,
            durationMin: 95 + Math.floor(Math.random() * 55),
          }
        : rollNextWeather(nextSeason, 'cerah', 4 * 60 + 30);
      const updatedForecast = ensureWeatherForecast(
        nextDay,
        nextSeason,
        morningWeather.weather,
        rolling
      );
      const nextState: GameState = {
        ...prev,
        day: nextDay,
        minutesOfDay: 4 * 60 + 30, // Bangun pagi 04.30 WIB!
        energy: 100,
        isInjured: false,
        injuryDaysLeft: 0,
        warungOpen: false,
        prayedToday: [],
        remindedPrayersToday: [],
        completedJobsToday: [],
        greetedNpcsToday: [],
        fruitPickedToday: false,
        season: nextSeason,
        weather: morningWeather.weather,
        weatherRemainingMin: morningWeather.durationMin,
        weatherForecast: updatedForecast,
        dailyMissions: ensureDailyMissions(nextDay, undefined, 0, 0),
        activityPoints: computeEffectiveActivityPoints(prev) + 12,
      };
      setGameState(nextState);
      saveGameToSlot(nextState);
      soundEngine.playRooster(0.75);
      showToast(
        `Selamat pagi, ${formatGameDate(nextDay)}! Jam 04.30 WIB · ${SEASON_META[nextSeason].label} (${WEATHER_META[morningWeather.weather].label}). Energi 100% (+12 Poin).`
      );
    } else {
      setGameState((curr) => {
        const { next } = advanceClockState(curr, 90);
        return {
          ...next,
          energy: Math.min(100, next.energy + 30),
        };
      });
      showToast('Arga beristirahat sejenak (+1.5 Jam, +30% Energi). Tidur malam dimulai pukul 18.00 WIB.');
    }
  };

  const handleCookDapur = (mealType: 'kopi' | 'liwet' | 'tutug_oncom') => {
    const cost = mealType === 'kopi' ? 2500 : mealType === 'tutug_oncom' ? 5000 : 7500;
    const gain = mealType === 'kopi' ? 20 : mealType === 'tutug_oncom' ? 38 : 50;
    const mealLabel =
      mealType === 'kopi' ? 'Kopi' : mealType === 'tutug_oncom' ? 'Tutug Oncom' : 'Nasi Liwet';
    if (gameState.money < cost) {
      soundEngine.error();
      showToast('Uang belanja dapur tidak cukup!');
      return;
    }
    soundEngine.cookingSizzle();
    setGameState((prev) => {
      const { next } = advanceClockState(prev, 15);
      return {
        ...next,
        money: next.money - cost,
        energy: Math.min(100, next.energy + gain),
        transactions: appendTransaction(next.transactions, {
          day: next.day,
          minutesOfDay: next.minutesOfDay,
          type: 'expense',
          category: 'konsumsi',
          title: `Masak di Dapur (${mealLabel})`,
          detail: `Energi +${gain}%`,
          amount: cost,
        }),
      };
    });
    showToast(`Masakan dapur (${mealLabel}) selesai! Energi Arga pulih +${gain}%.`);
  };

  const handleSelectPasarRide = (fare: number, minutes: number, vehicleName: string) => {
    if (gameState.money < fare) {
      soundEngine.error();
      showToast('Saldo Arga tidak cukup untuk naik kendaraan ini!');
      return;
    }
    soundEngine.marketDepart(vehicleName);
    if (fare > 0) soundEngine.cash();
    const goingToPasar = gameState.scene !== 'pasar';
    const destScene: SceneId = goingToPasar ? 'pasar' : 'kampung_warung';
    setActiveModal(null);
    transitionToScene(() => {
      setGameState((prev) => {
        const { next } = advanceClockState(prev, minutes);
        return {
          ...next,
          money: next.money - fare,
          scene: destScene,
          playerPos: SCENES[destScene].defaultSpawn,
          transactions:
            fare > 0
              ? appendTransaction(next.transactions, {
                  day: next.day,
                  minutesOfDay: next.minutesOfDay,
                  type: 'expense',
                  category: 'transport',
                  title: `Ongkos ${vehicleName}`,
                  detail: goingToPasar ? 'Perjalanan ke Pasar' : 'Pulang ke Kampung',
                  amount: fare,
                })
              : next.transactions,
        };
      });
      showToast(
        fare === 0
          ? `Arga berjalan kaki pulang dan tiba di ${goingToPasar ? 'Pasar Tradisional Sunda' : 'Kampung Sukamaju'}.`
          : `Arga naik ${vehicleName} (${formatRupiah(fare)}) dan tiba di ${
              goingToPasar ? 'Pasar Tradisional Sunda' : 'Kampung Sukamaju'
            }.`
      );
    }, 'none');
  };

  const handlePasarCheckout = (
    cart: Record<string, number>,
    totalCost: number,
    ongkir: number,
    courierName: string
  ) => {
    soundEngine.cash();
    const totalQty = Object.values(cart).reduce((acc, q) => acc + (q > 0 ? q : 0), 0);
    setGameState((prev) => {
      const { next } = advanceClockState(prev, 15);
      const nextInv = { ...next.inventory };
      for (const [id, qty] of Object.entries(cart)) {
        if (qty > 0) nextInv[id] = (nextInv[id] ?? 0) + qty;
      }
      return {
        ...next,
        money: next.money - totalCost,
        inventory: nextInv,
        activityPoints: computeEffectiveActivityPoints(prev) + 8,
        totalActivitiesCount: (next.totalActivitiesCount ?? 0) + 1,
        transactions: appendTransaction(next.transactions, {
          day: next.day,
          minutesOfDay: next.minutesOfDay,
          type: 'expense',
          category: 'pasar',
          title: 'Belanja Kulakan Pasar',
          detail: `${totalQty} barang${ongkir > 0 ? ` + ongkir ${courierName}` : ''}`,
          amount: totalCost,
        }),
      };
    });
    setActiveModal(null);
    showToast(
      `Kulakan sukses (${formatRupiah(totalCost)}${
        ongkir > 0 ? `, termasuk ongkir ${courierName} ${formatRupiah(ongkir)}` : ''
      })! Stok masuk ke Warung Arga (+8 Poin).`
    );
  };

  const handleCompleteSideJob = (job: SideJobDef) => {
    soundEngine.cash();
    setGameState((prev) => {
      const { next } = advanceClockState(prev, job.durationMinutes);
      return {
        ...next,
        money: next.money + job.reward,
        energy: Math.max(5, next.energy - job.energyCost),
        completedJobsToday: next.completedJobsToday.includes(job.id)
          ? next.completedJobsToday
          : [...next.completedJobsToday, job.id],
        activityPoints: computeEffectiveActivityPoints(prev) + 18,
        totalSideJobsCount: (next.totalSideJobsCount ?? 0) + 1,
        reputation: Math.min(5, Number((next.reputation + 0.04).toFixed(2))),
        wargaSatisfaction: Math.min(100, next.wargaSatisfaction + 3),
        transactions: appendTransaction(next.transactions, {
          day: next.day,
          minutesOfDay: next.minutesOfDay,
          type: 'income',
          category: 'kerja',
          title: `Upah ${job.title}`,
          detail: job.locationLabel,
          amount: job.reward,
        }),
        dailyMissions: advanceDailyMissionProgress(
          next.dailyMissions,
          next.day,
          'side_job',
          1,
          next.greetedNpcsToday.length,
          next.prayedToday.length
        ),
      };
    });
    setActiveModal(null);
    setActiveSideJob(null);
    showToast(`Kerja selesai! Arga mendapat upah ${formatRupiah(job.reward)} (+18 Poin Keaktifan).`);
  };

  const handleClaimDailyMission = (taskId: DailyMissionTaskId) => {
    const missions = ensureDailyMissions(
      gameState.day,
      gameState.dailyMissions,
      gameState.greetedNpcsToday.length,
      gameState.prayedToday.length
    );
    const task = missions.tasks.find((t) => t.id === taskId);
    if (!task || task.claimed || task.progress < task.target) return;

    soundEngine.angklungSuccess();
    setGameState((prev) => {
      const synced = ensureDailyMissions(
        prev.day,
        prev.dailyMissions,
        prev.greetedNpcsToday.length,
        prev.prayedToday.length
      );
      return {
        ...prev,
        money: prev.money + task.rewardMoney,
        activityPoints: computeEffectiveActivityPoints(prev) + task.rewardPoints,
        dailyMissions: {
          ...synced,
          tasks: synced.tasks.map((t) => (t.id === taskId ? { ...t, claimed: true } : t)),
        },
        transactions: appendTransaction(prev.transactions, {
          day: prev.day,
          minutesOfDay: prev.minutesOfDay,
          type: 'income',
          category: 'misi',
          title: `Misi Harian: ${task.label}`,
          detail: `Hadiah +${task.rewardPoints} Poin Keaktifan`,
          amount: task.rewardMoney,
        }),
      };
    });
    showToast(
      `Misi Harian selesai! +${task.rewardPoints} Poin & ${formatRupiah(task.rewardMoney)}.`
    );
  };

  const handleClaimDailyBonus = () => {
    const missions = ensureDailyMissions(
      gameState.day,
      gameState.dailyMissions,
      gameState.greetedNpcsToday.length,
      gameState.prayedToday.length
    );
    const allDone = missions.tasks.every((t) => t.progress >= t.target);
    if (!allDone || missions.bonusClaimed) return;

    soundEngine.angklungSuccess();
    setGameState((prev) => {
      const synced = ensureDailyMissions(
        prev.day,
        prev.dailyMissions,
        prev.greetedNpcsToday.length,
        prev.prayedToday.length
      );
      return {
        ...prev,
        money: prev.money + DAILY_MISSION_GRAND_BONUS.money,
        activityPoints:
          computeEffectiveActivityPoints(prev) + DAILY_MISSION_GRAND_BONUS.points,
        dailyMissions: {
          ...synced,
          bonusClaimed: true,
        },
        transactions: appendTransaction(prev.transactions, {
          day: prev.day,
          minutesOfDay: prev.minutesOfDay,
          type: 'income',
          category: 'misi',
          title: 'Bonus Misi Harian (3/3 Selesai)',
          detail: `+${DAILY_MISSION_GRAND_BONUS.points} Poin Keaktifan`,
          amount: DAILY_MISSION_GRAND_BONUS.money,
        }),
      };
    });
    showToast(
      `Luar biasa! Bonus 3/3 Misi Harian: +${DAILY_MISSION_GRAND_BONUS.points} Poin & ${formatRupiah(
        DAILY_MISSION_GRAND_BONUS.money
      )}!`
    );
  };

  // Available Side Jobs based on current time (before 09:00 and after 17:00)
  const currentHour = gameState.minutesOfDay / 60;
  const visibleSideJobs = useMemo(() => {
    if (currentHour < 9) {
      return SIDE_JOBS.filter((j) => j.period === 'pagi');
    }
    if (currentHour >= 17) {
      return SIDE_JOBS.filter((j) => j.period === 'malam');
    }
    return SIDE_JOBS.filter((j) => j.period === 'malam');
  }, [currentHour]);

  // Controller & Keyboard Event Handler
  const handleGamepadButton = useCallback(
    (btn: GamepadActionEvent extends never ? never : keyof GamepadActionEvent) => {
      if (!hasAccess) return;
      if (screen === 'COVER') {
        if (activeModal === 'LOAD_SAVE') {
          if (btn === 'DPAD_DOWN' || btn === 'DPAD_RIGHT') {
            setSlotFocusIdx((i) => (i + 1) % 7);
          } else if (btn === 'DPAD_UP' || btn === 'DPAD_LEFT') {
            setSlotFocusIdx((i) => (i + 6) % 7);
          } else if (btn === 'A') {
            if (slotFocusIdx === 6) setActiveModal(null);
            else handleSelectSlot(slotFocusIdx + 1);
          } else if (btn === 'B') {
            setActiveModal(null);
          }
          return;
        }
        if (activeModal === 'DISPLAY_MODE') {
          if (btn === 'B') {
            setPendingLaunch(null);
            setActiveModal(null);
          } else if (btn === 'A' || btn === 'X' || btn === 'Y') {
            emitUiGamepadAction(btn);
          }
          return;
        }
        if (activeModal === 'SETTINGS' || activeModal === 'CHANGELOG') {
          if (btn === 'B' || btn === 'A') setActiveModal(null);
          return;
        }

        if (btn === 'DPAD_DOWN') setCoverFocusIdx((i) => (i + 1) % 4);
        else if (btn === 'DPAD_UP') setCoverFocusIdx((i) => (i + 3) % 4);
        else if (btn === 'A') {
          if (coverFocusIdx === 0) handleStartOrContinue();
          else if (coverFocusIdx === 1) setActiveModal('LOAD_SAVE');
          else if (coverFocusIdx === 2) setActiveModal('SETTINGS');
          else setActiveModal('CHANGELOG');
        }
        return;
      }

      // PLAYING state
      if (activeModal === 'LOAD_SAVE') {
        if (btn === 'DPAD_DOWN' || btn === 'DPAD_RIGHT') {
          setSlotFocusIdx((i) => (i + 1) % 7);
        } else if (btn === 'DPAD_UP' || btn === 'DPAD_LEFT') {
          setSlotFocusIdx((i) => (i + 6) % 7);
        } else if (btn === 'A') {
          if (slotFocusIdx === 6) setActiveModal(null);
          else handleSelectSlot(slotFocusIdx + 1);
        } else if (btn === 'B') {
          setActiveModal(null);
        }
        return;
      }

      if (activeModal !== null) {
        if (btn === 'B') {
          if (activeModal === 'ACCIDENT') {
            emitUiGamepadAction('B');
          } else {
            setActiveModal(null);
            if (activeModal === 'DIALOGUE') setActiveNpc(null);
            if (activeModal === 'PRAYER_REMINDER') {
              soundEngine.stopAdzan();
              setActivePrayerAlert(null);
            }
            if (activeModal === 'SIDE_JOB') setActiveSideJob(null);
          }
        } else if (
          btn === 'A' ||
          btn === 'X' ||
          btn === 'Y' ||
          btn === 'DPAD_UP' ||
          btn === 'DPAD_DOWN' ||
          btn === 'DPAD_LEFT' ||
          btn === 'DPAD_RIGHT' ||
          btn === 'LB' ||
          btn === 'RB'
        ) {
          emitUiGamepadAction(btn);
        }
        return;
      }

      if (
        gameState.scene === 'warung_interior' ||
        gameState.scene === 'warung_asih' ||
        gameState.scene === 'rumah_ruang_tamu' ||
        gameState.scene === 'rumah_dapur' ||
        gameState.scene === 'rumah_kamar'
      ) {
        if (
          btn === 'A' ||
          btn === 'DPAD_UP' ||
          btn === 'DPAD_DOWN' ||
          btn === 'DPAD_LEFT' ||
          btn === 'DPAD_RIGHT' ||
          btn === 'LB' ||
          btn === 'RB'
        ) {
          emitUiGamepadAction(btn);
          return;
        }
        if (btn === 'Y' && gameState.scene === 'rumah_kamar') {
          emitUiGamepadAction('Y');
          return;
        }
      }

      if (btn === 'A') {
        if (nearestActionRef.current) {
          nearestActionRef.current.execute();
        }
      } else if (btn === 'B') {
        if (gameState.scene === 'warung_interior') {
          handleChangeScene('kampung_warung', { x: 28, y: 58 });
        } else if (gameState.scene === 'warung_asih') {
          handleChangeScene('kampung_warung', { x: 47, y: 47 });
        } else if (
          gameState.scene === 'rumah_ruang_tamu' ||
          gameState.scene === 'rumah_dapur' ||
          gameState.scene === 'rumah_kamar'
        ) {
          handleChangeScene('kompleks_warga', { x: 49, y: 42 });
        }
      } else if (btn === 'X') {
        setActiveModal('HP_PHONE');
      } else if (btn === 'Y') {
        setActiveModal('MAP');
      } else if (btn === 'START') {
        setActiveModal('SETTINGS');
      }
    },
    [hasAccess, screen, activeModal, coverFocusIdx, slotFocusIdx, gameState.scene, handleStartOrContinue, handleSelectSlot, handleChangeScene]
  );

  const { status: gamepadStatus, moveVecRef } = useGamepad({
    enabled: hasAccess,
    onButtonPress: handleGamepadButton,
  });

  const currentSceneDef = SCENES[gameState.scene];
  const npcsInCurrentScene = useMemo(() => NPCS.filter((n) => n.scene === gameState.scene), [gameState.scene]);
  const isSleepReminder = currentHour >= 18 || currentHour < 4.5;
  const argaOutfitInfo = useMemo(
    () => getArgaOutfitState(gameState, activeModal === 'PRAYER_REMINDER'),
    [gameState, activeModal]
  );

  // Contextual environmental ambient loop (rain intensification, pasar bustle, river babble, village crickets)
  const ambientTimeBucket = Math.floor(gameState.minutesOfDay / 30);
  useEffect(() => {
    soundEngine.updateEnvironment({
      active: screen === 'PLAYING',
      sceneId: gameState.scene,
      isIndoor: currentSceneDef.isIndoor,
      weather: gameState.weather,
      minutesOfDay: ambientTimeBucket * 30,
    });
  }, [screen, gameState.scene, currentSceneDef.isIndoor, gameState.weather, ambientTimeBucket]);

  // Render Cover Screen
  if (screen === 'COVER') {
    return (
      <>
        <LandscapeOrientationGuard />
        <OfflineNoticePill />
        <CoverScreen
          latestSlot={latestSlot}
          focusedIndex={coverFocusIdx}
          gamepadConnected={gamepadStatus.connected}
          onContinueOrStart={handleStartOrContinue}
          onOpenLoadSave={() => {
            soundEngine.click();
            setActiveModal('LOAD_SAVE');
          }}
          onOpenSettings={() => {
            soundEngine.click();
            setActiveModal('SETTINGS');
          }}
          onOpenChangelog={() => {
            soundEngine.click();
            setActiveModal('CHANGELOG');
          }}
        />
        {activeModal === 'LOAD_SAVE' && (
          <SaveSlotsModal
            slots={slots}
            focusedSlotIndex={slotFocusIdx}
            onSelectSlot={handleSelectSlot}
            onDeleteSlot={handleDeleteSlot}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'SETTINGS' && (
          <SettingsModal
            settings={settings}
            onUpdate={setSettings}
            onReplayTutorial={() => setActiveModal('CHANGELOG')}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'CHANGELOG' && <ChangelogAndGuideModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'DISPLAY_MODE' && pendingLaunch && (
          <DisplayModeModal
            launchLabel={
              pendingLaunch.type === 'slot'
                ? pendingLaunch.label
                : latestSlot?.state
                ? `Lanjutkan Slot ${latestSlot.slotId} (${latestSlot.warungName})`
                : 'Mulai Petualangan Baru (Slot 1)'
            }
            onSelectDisplayMode={handleConfirmDisplayMode}
            onCancel={() => {
              soundEngine.click();
              setPendingLaunch(null);
              setActiveModal(null);
            }}
          />
        )}
        {!hasAccess && (
          <AccessCodeModal
            onUnlock={() => {
              try {
                localStorage.setItem(ACCESS_CODE_STORAGE_KEY, 'true');
              } catch {
                // ignore storage quota
              }
              setHasAccess(true);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-slate-950 select-none">
      <LandscapeOrientationGuard />
      <OfflineNoticePill />
      {/* Main Scene Switcher: Warung Arga vs Warung Asih vs Home Interior vs Outdoor World */}
      {gameState.scene === 'warung_interior' ? (
        <WarungInteriorView
          gameState={gameState}
          settings={settings}
          onToggleWarungOpen={handleToggleWarungOpen}
          onServeItem={handleServeWarungItem}
          onFinishOrder={handleFinishCustomerOrder}
          onVisitWarungAsih={() => handleChangeScene('warung_asih')}
          onUpdatePrice={(itemId, newPrice) =>
            setGameState((prev) => ({
              ...prev,
              customPrices: { ...prev.customPrices, [itemId]: newPrice },
            }))
          }
          onRenovateWarung={handleRenovateWarung}
          onOpenDebtBook={() => setActiveModal('HP_PHONE')}
          onExitWarung={() => handleChangeScene('kampung_warung', { x: 28, y: 58 })}
        />
      ) : gameState.scene === 'warung_asih' ? (
        <WarungAsihView
          gameState={gameState}
          onConsumeMenu={handleConsumeNgopi}
          onExitWarungAsih={() => handleChangeScene('kampung_warung', { x: 47, y: 47 })}
        />
      ) : gameState.scene === 'rumah_ruang_tamu' ||
        gameState.scene === 'rumah_dapur' ||
        gameState.scene === 'rumah_kamar' ? (
        <HomeInteriorView
          gameState={gameState}
          onChangeRoom={(room) => handleChangeScene(room)}
          onSleep={handleSleepAtHome}
          onCookMeal={handleCookDapur}
          onPrayAtHome={() => {
            soundEngine.prayerBell();
            const curPrayer =
              [...PRAYER_SCHEDULE].reverse().find((p) => gameState.minutesOfDay >= p.minutes) ?? PRAYER_SCHEDULE[0];
            setGameState((prev) => {
              const { next } = advanceClockState(prev, 10);
              const nextPrayed = next.prayedToday.includes(curPrayer.name)
                ? next.prayedToday
                : [...next.prayedToday, curPrayer.name];
              return {
                ...next,
                energy: Math.min(100, next.energy + 8),
                prayedToday: nextPrayed,
                activityPoints: computeEffectiveActivityPoints(prev) + 8,
                totalPrayersCount: (next.totalPrayersCount ?? 0) + 1,
                dailyMissions: ensureDailyMissions(
                  next.day,
                  next.dailyMissions,
                  next.greetedNpcsToday.length,
                  nextPrayed.length
                ),
              };
            });
            showToast(`Arga menunaikan sholat ${curPrayer.name} di sajadah kamar (+8% Energi, +8 Poin).`);
          }}
          onOpenDebtBook={() => setActiveModal('HP_PHONE')}
          onExitHouse={() => handleChangeScene('kompleks_warga', { x: 49, y: 42 })}
        />
      ) : (
        <GameWorldCanvas
          scene={currentSceneDef}
          minutesOfDay={gameState.minutesOfDay}
          weather={gameState.weather}
          playerPos={gameState.playerPos}
          facing={gameState.facing}
          isInjured={gameState.isInjured}
          outfitMode={argaOutfitInfo.mode}
          npcsInScene={npcsInCurrentScene}
          greetedNpcsToday={gameState.greetedNpcsToday}
          moveVecRef={moveVecRef}
          isPaused={activeModal !== null}
          batterySaver={settings.batterySaver}
          graphicsQuality={settings.graphicsQuality}
          cameraMode={settings.cameraMode ?? 'third_person'}
          argaGesture={argaWorldGesture}
          onUpdatePlayerPos={(pos, facing) =>
            setGameState((prev) => ({ ...prev, playerPos: pos, facing }))
          }
          onTriggerHotspot={handleTriggerHotspot}
          onTalkNpc={handleTalkNpc}
          onChangeScene={handleChangeScene}
          onVehicleCollision={handleVehicleCollision}
          onNearestActionChange={(act) => {
            nearestActionRef.current = act;
            const nextLabel = act?.label ?? null;
            setNearestActionLabel((prevLabel) => (prevLabel === nextLabel ? prevLabel : nextLabel));
          }}
        />
      )}

      {/* TOP GAMEPLAY HUD BAR (hidden when modal/dialogue is open for a clean view) */}
      {activeModal === null && (
      <header className="absolute top-0 inset-x-0 z-30 bg-gradient-to-b from-slate-950/90 via-slate-950/65 to-transparent px-2.5 sm:px-4 py-1.5 sm:py-2.5 [@media(max-height:520px)]:py-1 flex flex-wrap items-center justify-between gap-2 sm:gap-3 pointer-events-none">
        {/* Left: Clock, Date, Weather & Location */}
        <div className="flex items-center gap-2.5 sm:gap-4 pointer-events-auto">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="font-mono-num text-lg sm:text-2xl lg:text-3xl [@media(max-height:520px)]:text-lg font-bold leading-none text-white drop-shadow">
                {formatGameTime(gameState.minutesOfDay)}
              </div>
              {(() => {
                const wMeta = WEATHER_META[gameState.weather];
                const isNightLamps = currentHour >= 18.5 || currentHour < 5.1;
                return (
                  <span
                    title={`${SEASON_META[gameState.season].label}: ${wMeta.label}${isNightLamps ? ' · Lampu Kampung Menyala' : ''}`}
                    className={`px-1.5 sm:px-2 py-0.5 rounded-md border text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${wMeta.badgeBg} ${wMeta.badgeText}`}
                  >
                    {isNightLamps && !wMeta.isRainy ? '🌙' : wMeta.emoji}{' '}
                    <span className="hidden sm:inline">{wMeta.label} · </span>
                    {SEASON_META[gameState.season].shortLabel}
                    {isNightLamps ? ' · 💡' : ''}
                  </span>
                );
              })()}
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-amber-200 tracking-wide mt-0.5">
              {formatGameDate(gameState.day)} · Hari ke-{gameState.day}
            </div>
            <div className="text-[9px] sm:text-[10px] font-extrabold text-sky-300 uppercase tracking-wider truncate max-w-[130px] sm:max-w-[190px]">
              {currentSceneDef.name}
            </div>
          </div>

          {/* Reputation Stars */}
          <div className="hidden lg:block">
            <div className="text-[10px] font-bold text-amber-300 tracking-wider uppercase">
              REPUTASI WARUNG
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(gameState.reputation)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-600 fill-slate-700'
                  }`}
                />
              ))}
              <span className="text-xs font-mono-num font-bold text-amber-200 ml-1">
                {gameState.reputation.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Energy Meter */}
          <div className="min-w-[80px] sm:min-w-[110px]">
            <div className="text-[9px] sm:text-[10px] font-bold text-slate-200 tracking-wider uppercase font-mono-num">
              ENERGI {Math.round(gameState.energy)}%
            </div>
            <div className="w-20 sm:w-28 h-2 sm:h-2.5 rounded-full bg-slate-800 border border-slate-700 overflow-hidden mt-0.5 sm:mt-1">
              <div
                style={{ width: `${Math.max(0, Math.min(100, gameState.energy))}%` }}
                className={`h-full transition-all ${
                  gameState.energy > 50
                    ? 'bg-emerald-400'
                    : gameState.energy > 25
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Right: Money (Rupiah), Rank Tier, Map, Save, Slots, Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto">
          <button
            onClick={() => setActiveModal('HP_PHONE')}
            title="Klik untuk melihat detail peringkat keaktifan di HP Arga"
            className={`hidden sm:flex flex-col items-end px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl border ${rankInfo.badgeBg} ${rankInfo.badgeBorder} hover:brightness-110 transition-all`}
          >
            <div className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-wider">
              PERINGKAT · {rankInfo.points} PTS
            </div>
            <div className={`font-display text-[11px] sm:text-sm font-extrabold flex items-center gap-1 ${rankInfo.badgeText}`}>
              <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {rankInfo.fullLabel}
            </div>
          </button>

          {/* Money Display in Real Rupiah */}
          <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 [@media(max-height:520px)]:py-0.5 rounded-xl bg-slate-950/90 border-2 border-emerald-400/75 shadow-lg">
            <div className="text-[8px] sm:text-[10px] font-bold text-emerald-300 uppercase leading-none">Uang Arga</div>
            <div className="font-mono-num text-xs sm:text-base lg:text-lg font-extrabold text-emerald-400 leading-tight">
              {formatRupiah(gameState.money)}
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.click();
              if (gameState.scene !== 'sekolah' && gameState.scene !== 'kompleks_warga') {
                handleChangeScene('sekolah', undefined, () => {
                  setActiveModal('TRADITIONAL_GAMES');
                });
                showToast('Arga langsung menuju Arena Kaulinan di Lapangan SD Negeri Sukamaju!');
              } else {
                setActiveModal('TRADITIONAL_GAMES');
              }
            }}
            title="Langsung ke Arena Kaulinan (SD Sukamaju / Kompleks Warga) untuk bermain & menambah Poin"
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg"
          >
            <Dices className="w-4 h-4" />
            <span className="hidden md:inline">Kaulinan</span>
          </button>

          <button
            onClick={() => setActiveModal('MAP')}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg"
          >
            <MapIcon className="w-4 h-4" />
            <span className="hidden md:inline">Peta [Y]</span>
          </button>

          <button
            onClick={() => {
              saveGameToSlot(gameState);
              soundEngine.confirm();
              showToast(`Permainan tersimpan di Slot ${gameState.slotId}!`);
            }}
            title={`Simpan ke Slot ${gameState.slotId}`}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-400/60 text-amber-300 shadow"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundEngine.click();
              setActiveModal('LOAD_SAVE');
            }}
            title="Kelola & Pindah Slot Save"
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-400/60 text-amber-200 shadow"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundEngine.click();
              applyFullscreenChoice(!isFullscreen);
            }}
            title={isFullscreen ? 'Keluar Layar Penuh (Mode Biasa)' : 'Mode Layar Penuh (Fullscreen)'}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-400/60 text-amber-200 shadow"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setActiveModal('SETTINGS')}
            title="Pengaturan"
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-400/60 text-amber-100 shadow"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>
      )}

      {/* LEFT FLOATING PANEL: AGENDA & MISI HARIAN ARGA */}
      {activeModal === null && gameState.scene !== 'warung_interior' && gameState.scene !== 'warung_asih' && (() => {
        const dailyMissions = ensureDailyMissions(
          gameState.day,
          gameState.dailyMissions,
          gameState.greetedNpcsToday.length,
          gameState.prayedToday.length
        );
        const completedMissionsCount = dailyMissions.tasks.filter(
          (t) => t.progress >= t.target
        ).length;
        const allMissionsDone = completedMissionsCount === dailyMissions.tasks.length;

        return (
          <aside className="absolute top-14 sm:top-20 [@media(max-height:520px)]:top-12 left-2 sm:left-3 z-20 w-52 sm:w-64 lg:w-72 bg-slate-950/88 backdrop-blur-md border border-amber-400/45 rounded-xl shadow-2xl overflow-hidden">
            <button
              onClick={() => setMissionOpen((v) => !v)}
              className="w-full px-3 py-1.5 sm:py-2 flex items-center justify-between bg-slate-900/80 text-[11px] sm:text-xs font-bold text-amber-300 border-b border-slate-800"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AGENDA ARGA</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/40 text-[9px] font-mono-num text-amber-200">
                  Misi {completedMissionsCount}/3
                </span>
              </span>
              {missionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {missionOpen && (
              <div className="p-2.5 sm:p-3 text-[11px] sm:text-xs text-slate-200 space-y-2 max-h-48 sm:max-h-72 overflow-y-auto">
                <div>
                  <span className="font-bold text-amber-200">Warung Arga (09.00–17.00):</span>{' '}
                  {currentHour >= 9 && currentHour < 17 ? (
                    <span className="text-emerald-300 font-semibold">Jam Buka! Masuk &amp; layani pembeli.</span>
                  ) : (
                    <span className="text-slate-300">Tutup. Ambil kerja sampingan / ke Pasar / Warung Asih.</span>
                  )}
                </div>
                {isSleepReminder && (
                  <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-400/60 text-indigo-200 flex items-start gap-1.5">
                    <MoonStar className="w-4 h-4 shrink-0 text-indigo-300 mt-0.5" />
                    <span>Waktu istirahat malam (18.00–04.30). Pulang ke kamar untuk tidur keesokan hari!</span>
                  </div>
                )}
                {gameState.isInjured && (
                  <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-400/60 text-rose-200 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
                    <span>Kaki Arga masih pemulihan. Hati-hati menyeberang jalan!</span>
                  </div>
                )}

                {(() => {
                  const cycleDay = ((gameState.day - 1) % 12) + 1;
                  const todayTradition = TRADITIONS.find((t) => t.dayTrigger === cycleDay);
                  if (!todayTradition) return null;
                  const paidToday = gameState.paidTraditions.includes(
                    `${todayTradition.id}_d${gameState.day}`
                  );
                  const isNow =
                    gameState.minutesOfDay >= todayTradition.startMinutes &&
                    gameState.minutesOfDay <= todayTradition.endMinutes;
                  const isAtVenue = gameState.scene === todayTradition.scene;
                  return (
                    <div className="p-2 rounded-lg bg-amber-950/55 border border-amber-400/55 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                          Acara Warga Hari Ini
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            paidToday
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isNow
                              ? 'bg-emerald-400 text-slate-950'
                              : 'bg-slate-800 text-amber-200'
                          }`}
                        >
                          {paidToday ? 'Sudah Ikut' : isNow ? 'Berlangsung' : 'Terjadwal'}
                        </span>
                      </div>
                      <div className="font-bold text-amber-50 text-[11px] leading-snug">
                        {todayTradition.title}
                      </div>
                      <div className="text-[10px] text-slate-300 leading-tight">
                        🕒 {todayTradition.timeLabel}
                        <br />
                        📍 {todayTradition.locationLabel}
                      </div>
                      <button
                        onClick={() => {
                          soundEngine.click();
                          if (!isAtVenue) {
                            handleChangeScene(todayTradition.scene, undefined, () => {
                              setActiveTradition(todayTradition);
                              setActiveModal('TRADITION_EVENT');
                            });
                            showToast(`Arga langsung menuju ${todayTradition.locationLabel}!`);
                          } else {
                            setActiveTradition(todayTradition);
                            setActiveModal('TRADITION_EVENT');
                          }
                        }}
                        className="w-full py-1 px-2 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>{isAtVenue ? 'Lihat Detail Acara' : 'Ke Tempat Acara'}</span>
                      </button>
                    </div>
                  );
                })()}

                {/* Misi Harian (3 Tugas Kecil) */}
                <div className="pt-1.5 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    <span>Misi Harian</span>
                    <span className="font-mono-num text-emerald-300">
                      {completedMissionsCount}/3 Selesai
                    </span>
                  </div>

                  {dailyMissions.tasks.map((task) => {
                    const isDone = task.progress >= task.target;
                    const pct = Math.min(100, Math.round((task.progress / task.target) * 100));
                    return (
                      <div
                        key={task.id}
                        className={`rounded-lg border px-2 py-1.5 ${
                          task.claimed
                            ? 'bg-emerald-950/35 border-emerald-500/35 opacity-80'
                            : isDone
                            ? 'bg-amber-950/45 border-amber-400/70'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-semibold text-[11px] text-slate-100 leading-tight flex items-center gap-1">
                            {task.claimed && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            )}
                            <span>{task.label}</span>
                          </span>
                          <span className="font-mono-num text-[10px] font-bold text-amber-200 shrink-0">
                            {task.progress}/{task.target}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden my-1">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full transition-all ${
                              isDone ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span className="text-slate-400 font-mono-num">
                            +{task.rewardPoints} Poin · {formatRupiah(task.rewardMoney)}
                          </span>
                          {task.claimed ? (
                            <span className="text-emerald-400 font-bold">Diklaim</span>
                          ) : isDone ? (
                            <button
                              onClick={() => handleClaimDailyMission(task.id)}
                              className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px]"
                            >
                              Klaim
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  {/* Grand Bonus saat 3/3 Misi Harian selesai */}
                  {allMissionsDone && !dailyMissions.bonusClaimed && (
                    <button
                      onClick={handleClaimDailyBonus}
                      className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-amber-400 to-emerald-400 hover:brightness-105 text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 shadow"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>
                        Klaim Bonus 3/3 (+{DAILY_MISSION_GRAND_BONUS.points} Poin &amp;{' '}
                        {formatRupiah(DAILY_MISSION_GRAND_BONUS.money)})
                      </span>
                    </button>
                  )}
                  {dailyMissions.bonusClaimed && (
                    <div className="text-center text-[10px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 rounded-lg py-1">
                      Bonus Misi Harian 3/3 sudah diklaim!
                    </div>
                  )}
                </div>

                <div className="text-[10px] sm:text-[11px] text-slate-400">
                  Sapa warga hari ini: {gameState.greetedNpcsToday.length}/{NPCS.length} · Kepuasan:{' '}
                  {gameState.wargaSatisfaction}%
                </div>
              </div>
            )}
          </aside>
        );
      })()}

      {/* RIGHT FLOATING PANEL: KERJA SAMPINGAN TRADISIONAL SUNDA */}
      {activeModal === null && gameState.scene !== 'warung_interior' && gameState.scene !== 'warung_asih' && (
        <aside className="absolute top-14 sm:top-20 [@media(max-height:520px)]:top-12 right-2 sm:right-3 z-20 w-52 sm:w-64 lg:w-72 bg-slate-950/85 backdrop-blur-md border border-amber-400/45 rounded-xl shadow-2xl overflow-hidden">
          <button
            onClick={() => setJobsOpen((v) => !v)}
            className="w-full px-3 py-1.5 sm:py-2 flex items-center justify-between bg-slate-900/80 text-[11px] sm:text-xs font-bold text-amber-300 border-b border-slate-800"
          >
            <span>KERJA SAMPINGAN SUNDA</span>
            {jobsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {jobsOpen && (
            <div className="p-2 sm:p-2.5 space-y-2 max-h-40 sm:max-h-64 overflow-y-auto">
              {visibleSideJobs.map((job) => {
                const alreadyDone = gameState.completedJobsToday.includes(job.id);
                const inWindow = currentHour >= job.startHour && currentHour < job.endHour;
                return (
                  <div
                    key={job.id}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs"
                  >
                    <div className="font-bold text-slate-100 leading-snug">{job.title}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>
                        {String(job.startHour).padStart(2, '0')}.00–{String(job.endHour).padStart(2, '0')}.00 ·{' '}
                        {job.locationLabel}
                      </span>
                      <span className="font-mono-num font-bold text-emerald-300">{formatRupiah(job.reward)}</span>
                    </div>

                    {alreadyDone ? (
                      <div className="mt-2 text-[11px] font-bold text-emerald-400">Sudah dikerjakan hari ini</div>
                    ) : inWindow ? (
                      <button
                        onClick={() => {
                          if (gameState.energy < job.energyCost) {
                            soundEngine.error();
                            showToast(
                              `Energi Arga tidak cukup (${Math.round(gameState.energy)}%, butuh ${job.energyCost}%). Ngopi di Warung Asih atau istirahat dulu!`
                            );
                            return;
                          }
                          if (gameState.scene !== job.scene) {
                            handleChangeScene(job.scene, undefined, () => {
                              setActiveSideJob(job);
                              setActiveModal('SIDE_JOB');
                            });
                            showToast(`Arga langsung menuju ${job.locationLabel}...`);
                          } else {
                            setActiveSideJob(job);
                            setActiveModal('SIDE_JOB');
                          }
                        }}
                        className="mt-2 w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
                      >
                        {gameState.scene === job.scene ? 'Ikuti Kerja' : `Ke ${job.locationLabel}`}
                      </button>
                    ) : (
                      <div className="mt-2 w-full py-1.5 rounded-lg bg-slate-800 text-slate-400 font-semibold text-center text-[11px]">
                        Tersedia pukul {String(job.startHour).padStart(2, '0')}.00–
                        {String(job.endHour).padStart(2, '0')}.00
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      )}

      {/* TOAST BANNER */}
      {activeModal === null && toastMsg && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-xl bg-slate-950/95 border-2 border-amber-400 text-amber-100 text-xs sm:text-sm font-bold shadow-2xl text-center max-w-md">
          {toastMsg}
        </div>
      )}

      {/* BOTTOM RIGHT: HP & CONTEXTUAL ACTION BUTTON ([A]) */}
      {activeModal === null &&
        gameState.scene !== 'warung_interior' &&
        gameState.scene !== 'warung_asih' &&
        gameState.scene !== 'rumah_ruang_tamu' &&
        gameState.scene !== 'rumah_dapur' &&
        gameState.scene !== 'rumah_kamar' && (
          <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-30 flex items-end gap-2 sm:gap-3">
            {settings.rogAllyMode && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-[11px] text-slate-300">
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                <span>
                  {gamepadStatus.connected ? 'Controller Terhubung' : 'Controller Siap'} · [A] Aksi · [X] HP · [Y] Peta
                </span>
              </div>
            )}

            <button
              onClick={() => setActiveModal('HP_PHONE')}
              className="flex flex-col items-center group"
            >
              <div className="relative w-10 h-13 sm:w-12 sm:h-16 [@media(max-height:520px)]:w-9 [@media(max-height:520px)]:h-12 rounded-xl bg-gradient-to-b from-amber-300 via-emerald-500 to-slate-900 border-2 border-amber-200 shadow-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow" />
                {gameState.debt > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border border-white">
                    !
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-white drop-shadow mt-0.5 sm:mt-1">HP [X]</span>
            </button>

            {nearestActionLabel && (
              <button
                onClick={() => nearestActionRef.current?.execute()}
                className="px-4 sm:px-6 py-2.5 sm:py-3.5 [@media(max-height:520px)]:py-2 [@media(max-height:520px)]:px-4 rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 hover:brightness-105 text-slate-950 border-2 border-amber-200 font-display font-bold text-sm sm:text-base shadow-[0_5px_0_#92400e,0_12px_20px_rgba(0,0,0,0.5)] active:translate-y-0.5 transition-all"
              >
                {nearestActionLabel} [A]
              </button>
            )}
          </div>
        )}

      {/* ALL GAMEPLAY MODALS */}
      {activeModal === 'DIALOGUE' && activeNpc && (
        <DialogueModal
          npc={activeNpc}
          minutesOfDay={gameState.minutesOfDay}
          outfitMode={argaOutfitInfo.mode}
          onSelectOption={handleDialogueChoice}
          onClose={() => {
            setActiveModal(null);
            setActiveNpc(null);
            triggerWorldGreeting('wave', 1500);
          }}
        />
      )}

      {activeModal === 'PRAYER_REMINDER' && activePrayerAlert && (
        <PrayerReminderModal
          prayerName={activePrayerAlert.prayer}
          wasWarungOpen={activePrayerAlert.wasWarungOpen}
          masterSarungUnlocked={argaOutfitInfo.masterSarungUnlocked}
          onPrayNow={(where) => {
            soundEngine.angklungSuccess();
            const prayer = activePrayerAlert.prayer;
            setActiveModal(null);
            setActivePrayerAlert(null);
            transitionToScene(() => {
              setGameState((prev) => {
                const { next } = advanceClockState(prev, 12);
                const nextPrayed = next.prayedToday.includes(prayer)
                  ? next.prayedToday
                  : [...next.prayedToday, prayer];
                return {
                  ...next,
                  scene: where === 'masjid' ? 'kampung_warung' : 'rumah_kamar',
                  playerPos: where === 'masjid' ? { x: 76, y: 47 } : { x: 35, y: 65 },
                  energy: Math.min(100, next.energy + (where === 'masjid' ? 10 : 8)),
                  reputation:
                    where === 'masjid'
                      ? Math.min(5, Number((next.reputation + 0.05).toFixed(2)))
                      : next.reputation,
                  prayedToday: nextPrayed,
                  activityPoints: computeEffectiveActivityPoints(prev) + 10,
                  totalPrayersCount: (next.totalPrayersCount ?? 0) + 1,
                  dailyMissions: ensureDailyMissions(
                    next.day,
                    next.dailyMissions,
                    next.greetedNpcsToday.length,
                    nextPrayed.length
                  ),
                };
              });
              showToast(
                `Alhamdulillah, Arga menunaikan sholat ${prayer} ${
                  where === 'masjid' ? 'di Masjid Al-Ikhlas' : 'di Sajadah Rumah'
                } (+10 Poin).`
              );
            }, 'none');
          }}
          onAcknowledgeCloseOnly={() => {
            setActiveModal(null);
            setActivePrayerAlert(null);
          }}
        />
      )}

      {activeModal === 'TRADITION_EVENT' && activeTradition && (
        <TraditionModal
          tradition={activeTradition}
          currentScene={gameState.scene}
          day={gameState.day}
          minutesOfDay={gameState.minutesOfDay}
          money={gameState.money}
          alreadyPaid={gameState.paidTraditions.includes(`${activeTradition.id}_d${gameState.day}`)}
          onGoToLocation={(targetScene) => {
            const trad = activeTradition;
            setActiveModal(null);
            handleChangeScene(targetScene, undefined, () => {
              if (trad) {
                setActiveTradition(trad);
                setActiveModal('TRADITION_EVENT');
              }
            });
            showToast(`Arga langsung menuju ${trad.locationLabel}!`);
          }}
          onPayUrunan={(trad) => {
            soundEngine.angklungSuccess();
            setGameState((prev) => ({
              ...prev,
              money: prev.money - trad.urunanAmount,
              reputation: Math.min(5, Number((prev.reputation + trad.reputationGain).toFixed(2))),
              wargaSatisfaction: Math.min(100, prev.wargaSatisfaction + 10),
              activityPoints: computeEffectiveActivityPoints(prev) + 35,
              totalActivitiesCount: (prev.totalActivitiesCount ?? 0) + 1,
              paidTraditions: [...prev.paidTraditions, `${trad.id}_d${prev.day}`],
              transactions: appendTransaction(prev.transactions, {
                day: prev.day,
                minutesOfDay: prev.minutesOfDay,
                type: 'expense',
                category: 'tradisi',
                title: `Urunan Tradisi ${trad.id}`,
                detail: `Bersama ${trad.hostNpc}`,
                amount: trad.urunanAmount,
              }),
              reviews: [
                {
                  id: `rev_${Date.now()}`,
                  author: trad.hostNpc,
                  rating: 5,
                  comment: `Hatur nuhun (Terima kasih) Arga sudah urunan acara ${trad.id}! Warga makin senang.`,
                  day: prev.day,
                },
                ...prev.reviews,
              ],
            }));
            setActiveModal(null);
            showToast(`Terima kasih! Arga ikut urunan ${trad.id} (${formatRupiah(trad.urunanAmount)}, +35 Poin).`);
          }}
          onSkip={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'ACCIDENT' && accidentInfo && (
        <AccidentModal
          vehicleType={accidentInfo.vehicle}
          medicalFee={accidentInfo.medicalFee}
          paidCash={accidentInfo.paidCash}
          addedDebt={accidentInfo.addedDebt}
          onContinue={() => {
            setActiveModal(null);
            setAccidentInfo(null);
            handleChangeScene('rumah_kamar');
          }}
        />
      )}

      {activeModal === 'TRANSPORT_PASAR' && (
        <TransportPasarModal
          isAtPasar={gameState.scene === 'pasar'}
          money={gameState.money}
          minutesOfDay={gameState.minutesOfDay}
          onSelectRide={handleSelectPasarRide}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'PASAR_SHOP' && (
        <PasarShopModal
          money={gameState.money}
          minutesOfDay={gameState.minutesOfDay}
          inventory={gameState.inventory}
          season={gameState.season}
          weather={gameState.weather}
          onCheckout={handlePasarCheckout}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'MAP' && (
        <MapModal
          currentScene={gameState.scene}
          onTravel={(sc) => {
            setActiveModal(null);
            handleChangeScene(sc);
          }}
          onOpenPasarTransport={() => setActiveModal('TRANSPORT_PASAR')}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'HP_PHONE' && (
        <PhoneModal
          gameState={gameState}
          onPayDebt={(amount) => {
            soundEngine.cash();
            setGameState((prev) => ({
              ...prev,
              money: prev.money - amount,
              debt: Math.max(0, prev.debt - amount),
              debtRecords: prev.debt - amount <= 0 ? [] : prev.debtRecords,
              transactions: appendTransaction(prev.transactions, {
                day: prev.day,
                minutesOfDay: prev.minutesOfDay,
                type: 'expense',
                category: 'hutang',
                title: 'Cicil / Lunasi Hutang',
                detail:
                  prev.debt - amount <= 0
                    ? 'Hutang lunas!'
                    : `Sisa ${formatRupiah(prev.debt - amount)}`,
                amount,
              }),
            }));
            showToast(`Hutang dibayar sebesar ${formatRupiah(amount)}!`);
          }}
          onOpenTraditions={() => {
            const nextTrad = resolveFeaturedTradition(gameState.day, gameState.paidTraditions);
            setActiveTradition(nextTrad);
            setActiveModal('TRADITION_EVENT');
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'SIDE_JOB' && activeSideJob && (
        <SideJobModal
          job={activeSideJob}
          onComplete={handleCompleteSideJob}
          onClose={() => {
            setActiveModal(null);
            setActiveSideJob(null);
          }}
        />
      )}

      {activeModal === 'FISHING' && (
        <FishingModal
          energy={gameState.energy}
          onCatchFish={(fishId, energyUsed) => {
            soundEngine.angklungSuccess();
            setGameState((prev) => {
              const { next } = advanceClockState(prev, 12);
              return {
                ...next,
                energy: Math.max(0, next.energy - energyUsed),
                activityPoints: computeEffectiveActivityPoints(prev) + 6,
                totalActivitiesCount: (next.totalActivitiesCount ?? 0) + 1,
                inventory: {
                  ...next.inventory,
                  [fishId]: (next.inventory[fishId] ?? 0) + 1,
                },
                dailyMissions: advanceDailyMissionProgress(
                  next.dailyMissions,
                  next.day,
                  'catch_fish',
                  1,
                  next.greetedNpcsToday.length,
                  next.prayedToday.length
                ),
              };
            });
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'FRUIT_PICKING' && (
        <FruitPickingModal
          alreadyPicked={gameState.fruitPickedToday}
          onFinishPick={(count) => {
            soundEngine.angklungSuccess();
            setGameState((prev) => {
              const { next } = advanceClockState(prev, 15);
              return {
                ...next,
                fruitPickedToday: true,
                energy: Math.max(0, next.energy - 6),
                activityPoints: computeEffectiveActivityPoints(prev) + 10,
                totalActivitiesCount: (next.totalActivitiesCount ?? 0) + 1,
                inventory: {
                  ...next.inventory,
                  buah_kebun: (next.inventory.buah_kebun ?? 0) + count,
                },
              };
            });
            setActiveModal(null);
            showToast(`${count} Buah Kebun segar berhasil masuk stok Warung Arga! (+10 Poin)`);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'LOAD_SAVE' && (
        <SaveSlotsModal
          slots={slots}
          focusedSlotIndex={slotFocusIdx}
          currentSlotId={gameState.slotId}
          onSelectSlot={handleSelectSlot}
          onSaveCurrentToSlot={handleSaveCurrentToSlot}
          onDeleteSlot={handleDeleteSlot}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'SETTINGS' && (
        <SettingsModal
          settings={settings}
          onUpdate={setSettings}
          onReplayTutorial={() => setActiveModal('CHANGELOG')}
          onExitGame={handleExitToCover}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'CULTURAL_STAGE' && (
        <CulturalStageModal
          minutesOfDay={gameState.minutesOfDay}
          onCompleteActivity={(mode, title, rewardMoney, rewardPoints) => {
            soundEngine.cash();
            setGameState((prev) => {
              const { next } = advanceClockState(prev, 25);
              return {
                ...next,
                money: next.money + rewardMoney,
                reputation: Math.min(5, Number((next.reputation + 0.06).toFixed(2))),
                wargaSatisfaction: Math.min(100, next.wargaSatisfaction + 4),
                activityPoints: computeEffectiveActivityPoints(prev) + rewardPoints,
                totalActivitiesCount: (next.totalActivitiesCount ?? 0) + 1,
                transactions: appendTransaction(next.transactions, {
                  day: next.day,
                  minutesOfDay: next.minutesOfDay,
                  type: 'income',
                  category: 'tradisi',
                  title: mode === 'angklung' ? `Pentas Angklung (${title})` : `Apresiasi Wayang Golek`,
                  detail: `Bumi Ageung · +${rewardPoints} Poin`,
                  amount: rewardMoney,
                }),
                dailyMissions: advanceDailyMissionProgress(
                  next.dailyMissions,
                  next.day,
                  'cultural_stage',
                  1,
                  next.greetedNpcsToday.length,
                  next.prayedToday.length
                ),
              };
            });
            setActiveModal(null);
            showToast(
              `Luar biasa! ${title} di Bumi Ageung sukses (+${formatRupiah(rewardMoney)}, +${rewardPoints} Poin)!`
            );
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'TRADITIONAL_GAMES' && (
        <KaulinanModal
          minutesOfDay={gameState.minutesOfDay}
          totalActivityPoints={computeEffectiveActivityPoints(gameState)}
          onAwardPoints={(payload: KaulinanRewardPayload) => {
            soundEngine.angklungSuccess();
            setGameState((prev) => {
              const { next } = advanceClockState(prev, 15);
              return {
                ...next,
                money: next.money + payload.bonusMoney,
                reputation: Math.min(5, Number((next.reputation + 0.03).toFixed(2))),
                wargaSatisfaction: Math.min(100, next.wargaSatisfaction + 2),
                activityPoints: computeEffectiveActivityPoints(prev) + payload.points,
                totalActivitiesCount: (next.totalActivitiesCount ?? 0) + 1,
                transactions:
                  payload.bonusMoney > 0
                    ? appendTransaction(next.transactions, {
                        day: next.day,
                        minutesOfDay: next.minutesOfDay,
                        type: 'income',
                        category: 'tradisi',
                        title: `Kaulinan ${payload.gameTitle}`,
                        detail: `${payload.resultLabel} · +${payload.points} Poin`,
                        amount: payload.bonusMoney,
                      })
                    : next.transactions,
                dailyMissions: advanceDailyMissionProgress(
                  next.dailyMissions,
                  next.day,
                  'traditional_games',
                  1,
                  next.greetedNpcsToday.length,
                  next.prayedToday.length
                ),
              };
            });
            showToast(
              `${payload.gameTitle}: ${payload.resultLabel}! (+${payload.points} Poin Keaktifan${
                payload.bonusMoney > 0 ? ` & ${formatRupiah(payload.bonusMoney)}` : ''
              })`
            );
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'CHANGELOG' && <ChangelogAndGuideModal onClose={() => setActiveModal(null)} />}

      {/* Smooth Cinematic Fade-to-Black Scene Transition Curtain */}
      <div
        aria-hidden="true"
        style={{ opacity: sceneFadeOpacity }}
        className="fixed inset-0 z-[120] bg-black pointer-events-none transition-opacity duration-300 ease-in-out"
      />
    </div>
  );
}
