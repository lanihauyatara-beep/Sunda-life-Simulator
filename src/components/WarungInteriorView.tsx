import React, { useEffect, useState } from 'react';
import {
  Coffee,
  DoorOpen,
  Package,
  Store,
  Tag,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hammer,
  Lock,
  Sparkles,
  Trophy,
  Banknote,
  Coins,
} from 'lucide-react';
import {
  ASSETS,
  CUSTOMER_ARCHETYPES,
  ITEMS,
  ITEM_MAP,
  SEASON_META,
  WARUNG_RENOVATION_TIERS,
  WEATHER_META,
  formatGameTime,
  formatRupiah,
  getWarungRenovationInfo,
} from '../data/gameData';
import { CustomerOrder, GameSettings, GameState } from '../types/game';
import { useUiGamepadAction } from '../hooks/useGamepad';
import { PortraitBadge } from './CharacterAvatar';

// Jeda kedatangan pembeli disimpan per slot agar tidak bisa di-reset hanya dengan keluar-masuk warung
const buyerCooldownBySlot = new Map<number, { readyAt: number; totalMs: number }>();

function computeBuyerDelayMs(
  reputation: number,
  satisfaction: number,
  isInitialOpen: boolean
): number {
  if (isInitialOpen) {
    // Jeda awal saat warung baru dibuka: 3 – 5 detik
    return 3000 + Math.floor(Math.random() * 2000);
  }
  // Jeda antar pembeli: 8 – 15 detik (lebih ramai jika reputasi & kepuasan warga tinggi)
  const popularityBonus = Math.min(
    3000,
    Math.max(0, (reputation - 2.5) * 800 + (satisfaction - 60) * 25)
  );
  const baseMs = 9500 - popularityBonus + Math.floor(Math.random() * 5500);
  return Math.max(7000, Math.min(16000, Math.round(baseMs)));
}

interface WarungInteriorViewProps {
  gameState: GameState;
  settings: GameSettings;
  onToggleWarungOpen: () => void;
  onServeItem: (orderId: string, itemId: string) => void;
  onFinishOrder: (order: CustomerOrder, success: boolean) => void;
  onVisitWarungAsih: () => void;
  onUpdatePrice: (itemId: string, newPrice: number) => void;
  onRenovateWarung: () => void;
  onOpenDebtBook: () => void;
  onExitWarung: () => void;
}

interface TxBubble {
  id: string;
  amount: number;
  customerName: string;
}

export const WarungInteriorView: React.FC<WarungInteriorViewProps> = ({
  gameState,
  settings,
  onToggleWarungOpen,
  onServeItem,
  onFinishOrder,
  onVisitWarungAsih,
  onUpdatePrice,
  onRenovateWarung,
  onOpenDebtBook,
  onExitWarung,
}) => {
  const [subTab, setSubTab] = useState<'layani' | 'stok' | 'harga' | 'renovasi'>('layani');
  const [currentOrder, setCurrentOrder] = useState<CustomerOrder | null>(null);
  const [statusNote, setStatusNote] = useState<string>('');
  const [waitState, setWaitState] = useState<{ remainingSec: number; progressPct: number } | null>(null);
  const [txBubbles, setTxBubbles] = useState<TxBubble[]>([]);
  const [cashFlash, setCashFlash] = useState(false);

  const hour = gameState.minutesOfDay / 60;
  const withinOperatingHours = hour >= 9 && hour < 17;
  const warungItems = ITEMS.filter((i) => i.category === 'warung' || i.category === 'hasil_alam');
  const renovationInfo = getWarungRenovationInfo(gameState);
  const unlockedIdSet = new Set(renovationInfo.unlockedItemIds);
  const unlockedWarungItems = warungItems.filter((i) => unlockedIdSet.has(i.id));
  const lockedWarungItems = warungItems.filter((i) => !unlockedIdSet.has(i.id));
  const weatherMeta = WEATHER_META[gameState.weather];
  const seasonMeta = SEASON_META[gameState.season];
  const isRainyWeather = gameState.weather === 'hujan' || gameState.weather === 'gerimis';
  const isHujanSeason = gameState.season === 'hujan';
  const isTerikSeason = gameState.season === 'kemarau' || gameState.weather === 'terik';

  const scheduleNextBuyerCooldown = (isInitialOpen: boolean) => {
    const delayMs = computeBuyerDelayMs(
      gameState.reputation,
      gameState.wargaSatisfaction,
      isInitialOpen
    );
    buyerCooldownBySlot.set(gameState.slotId, {
      readyAt: Date.now() + delayMs,
      totalMs: delayMs,
    });
  };

  // Spawn varied Sundanese customers with realistic cooldown ("jeda waktu") while Warung Arga is OPEN!
  useEffect(() => {
    if (!gameState.warungOpen || !withinOperatingHours) {
      setCurrentOrder(null);
      setWaitState(null);
      buyerCooldownBySlot.delete(gameState.slotId);
      return;
    }

    if (currentOrder) {
      setWaitState(null);
      return;
    }

    let entry = buyerCooldownBySlot.get(gameState.slotId);
    if (!entry) {
      const delayMs = computeBuyerDelayMs(
        gameState.reputation,
        gameState.wargaSatisfaction,
        true
      );
      entry = { readyAt: Date.now() + delayMs, totalMs: delayMs };
      buyerCooldownBySlot.set(gameState.slotId, entry);
    }

    const spawnCustomer = () => {
      buyerCooldownBySlot.delete(gameState.slotId);
      setWaitState(null);

      // Sesuaikan permintaan pembeli dengan musim & cuaca (hanya dari slot etalase yang sudah terbuka!)
      const weightedPool: string[] = [];
      for (const item of unlockedWarungItems) {
        const stock = gameState.inventory[item.id] ?? 0;
        if (stock <= 0) continue;

        let weight = 1;
        if (isRainyWeather || isHujanSeason) {
          if (item.seasonTag === 'hujan') weight = isRainyWeather ? 5 : 3;
          else if (item.id === 'kopi_kapal' || item.id === 'mie_instan' || item.id === 'gorengan') weight = 2;
          else if (item.seasonTag === 'kemarau') weight = isRainyWeather ? 0 : 1;
        } else if (isTerikSeason) {
          if (item.seasonTag === 'kemarau') weight = gameState.weather === 'terik' ? 5 : 3;
          else if (item.id === 'galon_air' || item.id === 'buah_kebun') weight = 2;
          else if (item.seasonTag === 'hujan') weight = 0;
        }

        for (let w = 0; w < weight; w++) {
          weightedPool.push(item.id);
        }
      }

      // Saat hujan/musim hujan, sesekali warga tetap mencari Jas Hujan / Payung jika slotnya sudah terbuka
      if (isRainyWeather && unlockedIdSet.has('jas_hujan') && Math.random() < 0.35) {
        weightedPool.push('jas_hujan', 'jas_hujan', 'payung_lipat', 'bandrek_hangat');
      }

      const unlockedIds = unlockedWarungItems.map((it) => it.id);
      const seasonalFallback = (isRainyWeather || isHujanSeason
        ? ['jas_hujan', 'bandrek_hangat', 'kopi_kapal', 'mie_instan']
        : ['es_cendol', 'teh_manis', 'kopi_kapal', 'gorengan']
      ).filter((id) => unlockedIdSet.has(id));
      const fallbackPool =
        seasonalFallback.length > 0 ? seasonalFallback : unlockedIds.slice(0, 4);
      const pool = weightedPool.length > 0 ? weightedPool : fallbackPool;

      const arch = CUSTOMER_ARCHETYPES[Math.floor(Math.random() * CUSTOMER_ARCHETYPES.length)];
      const count = 1 + Math.floor(Math.random() * 2);
      const picked: { itemId: string; qty: number }[] = [];

      for (let c = 0; c < count; c++) {
        const id = pool[Math.floor(Math.random() * pool.length)];
        const existing = picked.find((p) => p.itemId === id);
        if (existing) existing.qty += 1;
        else picked.push({ itemId: id, qty: 1 });
      }

      const asksRainGear = picked.some(
        (p) => p.itemId === 'jas_hujan' || p.itemId === 'payung_lipat' || p.itemId === 'bandrek_hangat'
      );
      const asksSummerGear = picked.some(
        (p) => p.itemId === 'es_cendol' || p.itemId === 'caping_bambu' || p.itemId === 'teh_manis'
      );

      let greeting = arch.greeting;
      let greetingId = arch.greetingId;
      if ((isRainyWeather || isHujanSeason) && asksRainGear) {
        greeting = 'Hujan kieu mah tiis pisan Ga! Aya jas hujan, payung, atanapi bandrek haneut?';
        greetingId = 'Hujan begini dingin sekali Ga! Ada jas hujan, payung, atau bandrek hangat?';
      } else if (gameState.weather === 'terik' && asksSummerGear) {
        greeting = 'Panas mentrang-mentring kieu Ga! Mésér nu seger-seger atanapi caping nya.';
        greetingId = 'Panas terik sekali begini Ga! Beli yang segar-segar atau caping ya.';
      }

      setCurrentOrder({
        id: `ord_${Date.now()}`,
        customerName: arch.name,
        customerRole: arch.role,
        shirtColor: arch.shirtColor,
        hatType: arch.hatType,
        greeting,
        greetingId,
        items: picked,
        fulfilled: {},
        patience: 100,
        maxPatience: 100,
      });
    };

    const tickWait = () => {
      const activeEntry = buyerCooldownBySlot.get(gameState.slotId);
      if (!activeEntry) {
        spawnCustomer();
        return true;
      }
      const remainingMs = Math.max(0, activeEntry.readyAt - Date.now());
      if (remainingMs <= 0) {
        spawnCustomer();
        return true;
      }
      setWaitState({
        remainingSec: Math.ceil(remainingMs / 1000),
        progressPct: Math.min(
          100,
          Math.max(0, ((activeEntry.totalMs - remainingMs) / activeEntry.totalMs) * 100)
        ),
      });
      return false;
    };

    if (tickWait()) return;

    const interval = setInterval(() => {
      if (tickWait()) {
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [gameState.warungOpen, gameState.slotId, withinOperatingHours, currentOrder?.id]);

  // Customer patience countdown
  useEffect(() => {
    if (!currentOrder || !gameState.warungOpen) return;
    const interval = setInterval(() => {
      setCurrentOrder((prev) => {
        if (!prev) return null;
        return { ...prev, patience: Math.max(0, prev.patience - 2.5) };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentOrder?.id, gameState.warungOpen]);

  useEffect(() => {
    if (currentOrder && currentOrder.patience <= 0) {
      const expired = currentOrder;
      scheduleNextBuyerCooldown(false);
      setCurrentOrder(null);
      setStatusNote(`${expired.customerName} pergi. Menunggu jeda pembeli berikutnya...`);
      onFinishOrder(expired, false);
    }
  }, [currentOrder?.patience, currentOrder?.id]);

  const handleGiveItem = (itemId: string) => {
    if (!currentOrder) return;
    const needed = currentOrder.items.find((it) => it.itemId === itemId);
    if (!needed) {
      setStatusNote('Pembeli tidak memesan barang itu!');
      return;
    }
    const already = currentOrder.fulfilled[itemId] ?? 0;
    if (already >= needed.qty) {
      setStatusNote('Jumlah barang pesanan itu sudah cukup.');
      return;
    }
    if ((gameState.inventory[itemId] ?? 0) <= 0) {
      setStatusNote('Stok barang ini kosong! Kulakan ke Pasar dulu.');
      return;
    }

    onServeItem(currentOrder.id, itemId);
    const updatedFulfilled = { ...currentOrder.fulfilled, [itemId]: already + 1 };
    const isComplete = currentOrder.items.every((it) => (updatedFulfilled[it.itemId] ?? 0) >= it.qty);

    if (isComplete) {
      const completedOrder = { ...currentOrder, fulfilled: updatedFulfilled };
      const earned = completedOrder.items.reduce((sum, it) => {
        const def = ITEM_MAP[it.itemId];
        const unitPrice = gameState.customPrices[it.itemId] ?? def?.retailPrice ?? 0;
        return sum + unitPrice * it.qty;
      }, 0);
      const bubbleId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setTxBubbles((prev) => [...prev, { id: bubbleId, amount: earned, customerName: completedOrder.customerName }]);
      setCashFlash(true);
      window.setTimeout(() => setCashFlash(false), 650);
      window.setTimeout(() => {
        setTxBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
      }, 1850);

      scheduleNextBuyerCooldown(false);
      setCurrentOrder(null);
      setStatusNote(`Pesanan ${completedOrder.customerName} selesai! (+${formatRupiah(earned)})`);
      onFinishOrder(completedOrder, true);
    } else {
      setCurrentOrder({ ...currentOrder, fulfilled: updatedFulfilled });
      setStatusNote(`Dimasukkan ke kresek: ${ITEM_MAP[itemId]?.name}`);
    }
  };

  useUiGamepadAction((btn) => {
    if (btn === 'LB' || btn === 'RB') {
      const tabs: ('layani' | 'stok' | 'harga' | 'renovasi')[] = ['layani', 'stok', 'harga', 'renovasi'];
      const curIdx = tabs.indexOf(subTab);
      const nextIdx = btn === 'RB' ? (curIdx + 1) % tabs.length : (curIdx + tabs.length - 1) % tabs.length;
      setSubTab(tabs[nextIdx]);
      return;
    }
    if (btn === 'A' && subTab === 'layani') {
      if (!gameState.warungOpen && withinOperatingHours) {
        onToggleWarungOpen();
        return;
      }
      if (gameState.warungOpen && currentOrder) {
        const nextNeeded = currentOrder.items.find(
          (it) => (currentOrder.fulfilled[it.itemId] ?? 0) < it.qty && (gameState.inventory[it.itemId] ?? 0) > 0
        );
        if (nextNeeded) {
          handleGiveItem(nextNeeded.itemId);
        } else {
          setStatusNote('Stok pesanan pembeli kosong! Keluar & kulakan ke Pasar.');
        }
      }
    }
  });

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col justify-between">
      {/* Background Diorama Dalam Warung Arga */}
      <img
        src={ASSETS.warung_interior}
        alt="Interior Warung Arga"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-slate-950/65" />

      {/* Center Interactive Zone */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start sm:justify-center px-3 sm:px-4 pt-14 sm:pt-20 pb-3 sm:pb-6 overflow-y-auto">
        {/* Warung Arga Status Banner */}
        <div className="w-full max-w-4xl bg-slate-950/90 border-2 border-amber-400/75 rounded-2xl p-4 mb-4 shadow-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                gameState.warungOpen ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-amber-300'
              }`}
            >
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold text-amber-50">
                  Warung Arga · {gameState.warungOpen ? 'BUKA MELAYANI' : 'TUTUP'}
                </h2>
                <span className="text-xs font-mono-num text-amber-300">
                  ({formatGameTime(gameState.minutesOfDay)} WIB)
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${weatherMeta.badgeBg} ${weatherMeta.badgeText}`}
                >
                  {weatherMeta.emoji} {weatherMeta.label} · {seasonMeta.shortLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {isHujanSeason
                    ? 'Musim Hujan: Jas Hujan, Payung & Bandrek sedang laris manis!'
                    : 'Musim Kemarau: Es Cendol, Teh Manis & Caping banyak dicari warga!'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onToggleWarungOpen}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
              gameState.warungOpen
                ? 'bg-rose-500 hover:bg-rose-400 text-white border-rose-300'
                : withinOperatingHours
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-200'
                : 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
            }`}
          >
            {gameState.warungOpen
              ? 'Tutup Warung Arga'
              : withinOperatingHours
              ? 'Buka Warung (09.00-17.00)'
              : 'Di Luar Jam Buka (09.00-17.00)'}
          </button>
        </div>

        {/* Sub-panels */}
        {subTab === 'layani' && (
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
            {/* Customer Slot (Left 5 cols) — also accepts Drag & Drop when Serve Mode = Seret */}
            <div
              onDragOver={(e) => {
                if (settings.serveMode === 'seret' && gameState.warungOpen && currentOrder) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => {
                if (settings.serveMode === 'seret' && gameState.warungOpen && currentOrder) {
                  e.preventDefault();
                  const itemId = e.dataTransfer.getData('text/plain');
                  if (itemId) handleGiveItem(itemId);
                }
              }}
              className={`relative sm:col-span-5 bg-slate-950/90 rounded-2xl p-3 sm:p-4 flex flex-col justify-between min-h-[210px] sm:min-h-[270px] border transition-all duration-300 ${
                cashFlash
                  ? 'border-emerald-400 ring-4 ring-emerald-400/35 shadow-[0_0_32px_rgba(16,185,129,0.45)]'
                  : 'border-amber-400/60'
              }`}
            >
              {/* Iconic Money & Coin Bubble Burst Overlay on Successful Transaction */}
              {txBubbles.length > 0 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-30 overflow-visible"
                >
                  {txBubbles.map((bubble) => {
                    const coinOffsets = [
                      { dx: '-56px', rot: '-22deg', delay: '0ms', icon: 'coin' },
                      { dx: '-28px', rot: '18deg', delay: '70ms', icon: 'note' },
                      { dx: '0px', rot: '-12deg', delay: '120ms', icon: 'coin' },
                      { dx: '30px', rot: '24deg', delay: '60ms', icon: 'coin' },
                      { dx: '56px', rot: '-18deg', delay: '140ms', icon: 'note' },
                    ] as const;
                    return (
                      <div key={bubble.id} className="absolute left-1/2 top-[44%]">
                        {coinOffsets.map((c, idx) => (
                          <div
                            key={idx}
                            style={
                              {
                                '--coin-dx': c.dx,
                                '--coin-rot': c.rot,
                                animationDelay: c.delay,
                              } as React.CSSProperties
                            }
                            className="sunda-coin-bubble absolute left-0 top-0"
                          >
                            <div
                              className={`w-8 h-8 rounded-full border-2 shadow-lg flex items-center justify-center ${
                                c.icon === 'note'
                                  ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                                  : 'bg-amber-400 border-yellow-100 text-amber-950'
                              }`}
                            >
                              {c.icon === 'note' ? (
                                <Banknote className="w-4 h-4" />
                              ) : (
                                <Coins className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        ))}

                        <div className="sunda-money-float absolute left-0 top-0 flex flex-col items-center">
                          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-300 text-slate-950 border-2 border-white shadow-[0_8px_28px_rgba(16,185,129,0.6)] flex items-center gap-2 whitespace-nowrap">
                            <span className="w-6 h-6 rounded-full bg-amber-400 border border-amber-900/30 flex items-center justify-center shadow-inner">
                              <Banknote className="w-3.5 h-3.5 text-emerald-950" />
                            </span>
                            <span className="font-mono-num font-extrabold text-sm sm:text-base">
                              +{formatRupiah(bubble.amount)}
                            </span>
                            <Sparkles className="w-4 h-4 text-amber-700" />
                          </div>
                          <span className="mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 border border-emerald-400/60 text-[10px] font-bold text-emerald-300 whitespace-nowrap shadow">
                            Hatur nuhun, {bubble.customerName}!
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!gameState.warungOpen ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                  <h3 className="font-bold text-amber-100 text-base">Warung Arga Sedang Tutup</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs">
                    {withinOperatingHours
                      ? 'Tekan tombol "Buka Warung" di atas untuk mulai menyambut pembeli kampung.'
                      : 'Warung Arga buka pukul 09.00 – 17.00 WIB. Di luar jam buka, Arga bisa kerja sampingan, kulakan ke Pasar, atau mampir ngopi di Warung Asih!'}
                  </p>
                </div>
              ) : !currentOrder ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-amber-400/15 border-2 border-amber-400/60 flex items-center justify-center text-amber-300 mb-3 animate-pulse">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-amber-100">Jeda Antar Pembeli</p>
                  <p className="text-xs text-slate-300 mt-1">
                    Menunggu warga kampung mampir ke Warung Arga...
                  </p>
                  {waitState && (
                    <div className="w-full max-w-[240px] mt-3 space-y-1.5">
                      <div className="inline-block px-3 py-1 rounded-lg bg-slate-900 border border-amber-400/40 text-xs font-mono-num font-bold text-amber-300">
                        Estimasi tiba: ~{waitState.remainingSec} detik
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${waitState.progressPct}%` }}
                          className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-3 max-w-[260px] leading-relaxed">
                    Manfaatkan waktu jeda untuk cek Stok, Atur Harga, atau mampir ngopi di Warung Asih.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <PortraitBadge
                      name={currentOrder.customerName}
                      shirtColor={currentOrder.shirtColor}
                      hatType={currentOrder.hatType}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-amber-200 text-base truncate">{currentOrder.customerName}</div>
                      <div className="text-xs text-slate-400">{currentOrder.customerRole}</div>
                    </div>
                  </div>

                  {/* Patience bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Kesabaran Pembeli</span>
                      <span className="font-mono-num">{Math.round(currentOrder.patience)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${currentOrder.patience}%` }}
                        className={`h-full transition-all ${
                          currentOrder.patience > 50
                            ? 'bg-emerald-400'
                            : currentOrder.patience > 25
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 mb-3 space-y-1">
                    <p className="text-xs italic text-amber-100">"{currentOrder.greeting}"</p>
                    <p className="text-[11px] text-emerald-300/95">
                      <span className="font-bold">Terjemahan:</span> "{currentOrder.greetingId}"
                    </p>
                  </div>

                  {/* Requested items */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">Pesanan:</div>
                    {currentOrder.items.map((it) => {
                      const def = ITEM_MAP[it.itemId];
                      const done = currentOrder.fulfilled[it.itemId] ?? 0;
                      const price = gameState.customPrices[it.itemId] ?? def?.retailPrice ?? 0;
                      return (
                        <div
                          key={it.itemId}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        >
                          <span className="font-semibold text-slate-100">
                            {def?.emojiIcon} {def?.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num text-amber-300">{formatRupiah(price)}</span>
                            <span
                              className={`font-mono-num font-bold px-2 py-0.5 rounded ${
                                done >= it.qty ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-200'
                              }`}
                            >
                              {done}/{it.qty}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {statusNote && (
                <div className="mt-3 text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusNote}</span>
                </div>
              )}
            </div>

            {/* Rak Dagangan Warung Arga (Right 7 cols) */}
            <div className="sm:col-span-7 bg-slate-950/90 border border-amber-400/60 rounded-2xl p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-display font-bold text-base text-amber-200">
                    Rak &amp; Etalase ({unlockedWarungItems.length}/{warungItems.length} Slot Aktif)
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    {renovationInfo.currentTier.name} · Kepuasan Warga: {gameState.wargaSatisfaction}%
                  </div>
                </div>
                {renovationInfo.nextTier && (
                  <button
                    onClick={() => setSubTab('renovasi')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-colors ${
                      renovationInfo.canRenovate
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-400/50'
                    }`}
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    <span>
                      {renovationInfo.canRenovate ? 'Siap Renovasi!' : 'Buka Slot Baru'}
                    </span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[250px] overflow-y-auto pr-1">
                {unlockedWarungItems.map((item) => {
                  const stock = gameState.inventory[item.id] ?? 0;
                  const price = gameState.customPrices[item.id] ?? item.retailPrice;
                  const isRequested = Boolean(currentOrder?.items.some((x) => x.itemId === item.id));

                  return (
                    <button
                      key={item.id}
                      disabled={!gameState.warungOpen || !currentOrder || stock <= 0}
                      draggable={settings.serveMode === 'seret' && gameState.warungOpen && Boolean(currentOrder) && stock > 0}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', item.id);
                      }}
                      onClick={() => handleGiveItem(item.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isRequested && stock > 0 && gameState.warungOpen
                          ? 'bg-amber-400/20 border-amber-400 hover:bg-amber-400/30 text-white shadow'
                          : stock > 0
                          ? 'bg-slate-900/90 border-slate-700 hover:border-amber-400/60 text-slate-200'
                          : 'bg-slate-950/60 border-slate-800/70 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg">{item.emojiIcon}</span>
                        <span
                          className={`text-[11px] font-mono-num font-bold ${
                            stock > 0 ? 'text-emerald-300' : 'text-rose-400'
                          }`}
                        >
                          Stok: {stock}
                        </span>
                      </div>
                      <div className="text-xs font-bold truncate">{item.name}</div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-[11px] font-mono-num text-amber-300">{formatRupiah(price)}</span>
                        {item.seasonTag === 'hujan' && (
                          <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold">
                            ☔ Hujan
                          </span>
                        )}
                        {item.seasonTag === 'kemarau' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                            ☀️ Terik
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {lockedWarungItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubTab('renovasi')}
                    className="p-2.5 rounded-xl border border-dashed border-slate-700 bg-slate-950/75 hover:border-amber-400/50 text-left opacity-70 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg grayscale">{item.emojiIcon}</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-300">
                        <Lock className="w-3 h-3" /> Terkunci
                      </span>
                    </div>
                    <div className="text-xs font-bold truncate text-slate-400">{item.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Renovasi Warung</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stok Gudang */}
        {subTab === 'stok' && (
          <div className="w-full max-w-3xl bg-slate-950/92 border-2 border-amber-400/75 rounded-2xl p-5 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-amber-200 mb-3">Inventori &amp; Stok Warung Arga</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto">
              {warungItems.map((it) => (
                <div key={it.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{it.emojiIcon}</span>
                    <span className="font-mono-num text-sm font-bold text-emerald-300">
                      {gameState.inventory[it.id] ?? 0} pcs
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-100 mt-1">{it.name}</div>
                  <div className="text-[11px] text-slate-400">{it.sundaName}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Atur Harga */}
        {subTab === 'harga' && (
          <div className="w-full max-w-3xl bg-slate-950/92 border-2 border-amber-400/75 rounded-2xl p-5 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-amber-200 mb-1">Atur Harga Jual Warung Arga</h3>
            <p className="text-xs text-slate-400 mb-3">
              Harga terlalu mahal bisa membuat warga kurang puas; harga wajar menjaga reputasi!
            </p>
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {unlockedWarungItems.map((it) => {
                const curPrice = gameState.customPrices[it.id] ?? it.retailPrice;
                return (
                  <div
                    key={it.id}
                    className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-100">
                        {it.emojiIcon} {it.name}
                      </span>
                      <span className="text-slate-400 ml-2 font-mono-num">
                        (Kulakan: {formatRupiah(it.wholesalePrice)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdatePrice(it.id, Math.max(it.wholesalePrice, curPrice - 500))}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-200 font-bold"
                      >
                        -500
                      </button>
                      <span className="font-mono-num font-bold text-amber-300 w-24 text-center">
                        {formatRupiah(curPrice)}
                      </span>
                      <button
                        onClick={() => onUpdatePrice(it.id, curPrice + 500)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-200 font-bold"
                      >
                        +500
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Renovasi Warung (Buka Slot Barang Baru) */}
        {subTab === 'renovasi' && (
          <div className="w-full max-w-3xl bg-slate-950/92 border-2 border-amber-400/75 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-amber-200 flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-amber-400" />
                  <span>Renovasi &amp; Perluas Etalase Warung</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Perluas rak warung agar Arga bisa menjual lebih banyak jenis barang secara bersamaan. Terbuka jika Rank mencapai <strong className="text-emerald-300">Grandmaster / Legend</strong> atau saldo melampaui biaya renovasi.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-400/50 text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Rank &amp; Saldo Arga</div>
                <div className="text-xs font-bold text-amber-300 flex items-center justify-end gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{renovationInfo.rankInfo.fullLabel}</span>
                </div>
                <div className="font-mono-num text-xs font-bold text-emerald-300">
                  {formatRupiah(gameState.money)}
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[245px] overflow-y-auto pr-1">
              {WARUNG_RENOVATION_TIERS.map((tier) => {
                const isDone = renovationInfo.currentLevel >= tier.level;
                const isNext = renovationInfo.nextTier?.level === tier.level;
                return (
                  <div
                    key={tier.level}
                    className={`rounded-xl border p-3 transition-all ${
                      isDone
                        ? 'bg-emerald-950/40 border-emerald-500/60'
                        : isNext
                        ? 'bg-slate-900 border-amber-400 shadow-lg'
                        : 'bg-slate-950/75 border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 text-amber-200 text-[10px] font-bold">
                          Tahap {tier.level} · {tier.slotCount} Slot
                        </span>
                        <span className="font-display font-bold text-sm text-white">{tier.name}</span>
                      </div>
                      <span className="font-mono-num text-xs font-bold text-amber-300">
                        {tier.cost === 0 ? 'Awal' : formatRupiah(tier.cost)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug mb-2">{tier.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {tier.unlockedItemIds.map((id) => {
                          const it = ITEM_MAP[id];
                          if (!it) return null;
                          return (
                            <span
                              key={id}
                              className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-[10px] text-slate-200"
                            >
                              {it.emojiIcon} {it.name}
                            </span>
                          );
                        })}
                      </div>

                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="w-4 h-4" /> Sudah Aktif
                        </span>
                      ) : isNext ? (
                        <button
                          disabled={!renovationInfo.canRenovate}
                          onClick={onRenovateWarung}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-emerald-400 hover:brightness-105 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {!renovationInfo.canAfford
                              ? `Butuh ${formatRupiah(tier.cost)}`
                              : !renovationInfo.meetsRank && !renovationInfo.moneyExceedsCost
                              ? `Capai Rank ${tier.recommendedRanks[0]} / Saldo > Biaya`
                              : `Renovasi Sekarang (${formatRupiah(tier.cost)})`}
                          </span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Selesaikan Tahap {tier.level - 1} dulu
                        </span>
                      )}
                    </div>

                    {isNext && (
                      <div className="mt-2 pt-1.5 border-t border-slate-800 flex flex-wrap items-center gap-3 text-[10px]">
                        <span className={renovationInfo.meetsRank ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                          {renovationInfo.meetsRank ? '✓' : '○'} Rank: {tier.recommendedRanks[0]}+
                        </span>
                        <span className="text-slate-500">ATAU</span>
                        <span className={renovationInfo.moneyExceedsCost ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                          {renovationInfo.moneyExceedsCost ? '✓' : '○'} Uang Melampaui {formatRupiah(tier.cost)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Dock Bar */}
      <div className="relative z-20 bg-slate-950/90 border-t border-amber-400/40 px-4 py-2.5 flex flex-wrap items-center justify-center gap-2 md:gap-3">
        <button
          onClick={onExitWarung}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/50 text-amber-100 text-xs font-bold flex items-center gap-2"
        >
          <DoorOpen className="w-4 h-4 text-amber-400" />
          <span>Keluar Warung [B]</span>
        </button>

        <button
          onClick={() => setSubTab('layani')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            subTab === 'layani'
              ? 'bg-amber-400 text-slate-950 border-amber-200'
              : 'bg-slate-900 text-slate-200 border-slate-700'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Meja Kasir</span>
        </button>

        <button
          onClick={() => setSubTab('stok')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            subTab === 'stok'
              ? 'bg-amber-400 text-slate-950 border-amber-200'
              : 'bg-slate-900 text-slate-200 border-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stok</span>
        </button>

        <button
          onClick={() => setSubTab('harga')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            subTab === 'harga'
              ? 'bg-amber-400 text-slate-950 border-amber-200'
              : 'bg-slate-900 text-slate-200 border-slate-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Atur Harga</span>
        </button>

        <button
          onClick={() => setSubTab('renovasi')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            subTab === 'renovasi'
              ? 'bg-amber-400 text-slate-950 border-amber-200'
              : renovationInfo.canRenovate
              ? 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border-emerald-400'
              : 'bg-slate-900 text-slate-200 border-slate-700'
          }`}
        >
          <Hammer className="w-4 h-4" />
          <span>Renovasi ({unlockedWarungItems.length}/{warungItems.length})</span>
        </button>

        <button
          onClick={onVisitWarungAsih}
          className="px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-300 text-white text-xs font-bold flex items-center gap-2"
        >
          <Coffee className="w-4 h-4" />
          <span>Ke Warung Asih (Ngopi)</span>
        </button>

        <button
          onClick={onOpenDebtBook}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Buku Hutang</span>
        </button>
      </div>
    </div>
  );
};
