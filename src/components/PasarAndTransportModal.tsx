import React, { useState } from 'react';
import { Truck, Bus, ShoppingBag, ArrowRightLeft } from 'lucide-react';
import {
  DELIVERY_OPTIONS,
  ITEMS,
  SEASON_META,
  TRANSPORT_TO_PASAR_OPTIONS,
  WEATHER_META,
  formatRupiah,
} from '../data/gameData';
import { SeasonType, VehicleType, WeatherCondition } from '../types/game';
import { useUiGamepadAction } from '../hooks/useGamepad';
import { VehicleSprite } from './VehicleSprite';

interface TransportPasarModalProps {
  isAtPasar: boolean;
  money: number;
  onSelectRide: (fare: number, minutes: number, vehicleName: string) => void;
  onClose: () => void;
}

export const TransportPasarModal: React.FC<TransportPasarModalProps> = ({
  isAtPasar,
  money,
  onSelectRide,
  onClose,
}) => {
  const [focusedIdx, setFocusedIdx] = useState(0);

  useUiGamepadAction((btn) => {
    const len = TRANSPORT_TO_PASAR_OPTIONS.length;
    if (btn === 'DPAD_RIGHT' || btn === 'DPAD_DOWN') {
      setFocusedIdx((i) => (i + 1) % len);
    } else if (btn === 'DPAD_LEFT' || btn === 'DPAD_UP') {
      setFocusedIdx((i) => (i + len - 1) % len);
    } else if (btn === 'A') {
      const opt = TRANSPORT_TO_PASAR_OPTIONS[focusedIdx];
      if (opt && money >= opt.fare) {
        onSelectRide(opt.fare, opt.minutes, opt.name);
      }
    }
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[94dvh] overflow-y-auto">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
          <Bus className="w-4 h-4" />
          <span>Transportasi Kampung ↔ Pasar Tradisional</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-amber-50 mb-1">
          {isAtPasar ? 'Pilih Kendaraan Pulang ke Kampung' : 'Pilih Kendaraan Menuju Pasar'}
        </h2>
        <p className="text-xs text-slate-300 mb-4">
          Letak Pasar Tradisional cukup jauh dari kampung sehingga harus menaiki kendaraan (Angkot Rp 5.000 pergi &
          Rp 5.000 pulang, atau naik Ojek / Becak / Delman). Saldo Arga:{' '}
          <strong className="text-emerald-300 font-mono-num">{formatRupiah(money)}</strong>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {TRANSPORT_TO_PASAR_OPTIONS.map((opt, idx) => {
            const affordable = money >= opt.fare;
            const isFocused = focusedIdx === idx;
            return (
              <button
                key={opt.id}
                disabled={!affordable}
                onMouseEnter={() => setFocusedIdx(idx)}
                onClick={() => onSelectRide(opt.fare, opt.minutes, opt.name)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  affordable
                    ? 'bg-slate-950/85 border-amber-400/60 hover:border-amber-300 hover:bg-slate-800'
                    : 'bg-slate-950/40 border-slate-800 opacity-50 cursor-not-allowed'
                } ${isFocused ? 'ally-focus' : ''}`}
              >
                <div className="w-20 shrink-0 flex items-center justify-center">
                  <VehicleSprite type={opt.vehicle as VehicleType} direction={1} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-amber-100">{opt.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{opt.note}</div>
                  <div className="flex items-center justify-between mt-2 text-xs font-mono-num">
                    <span className="text-emerald-300 font-bold">{formatRupiah(opt.fare)}</span>
                    <span className="text-slate-300">{opt.minutes} menit</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
        >
          Batal [B]
        </button>
      </div>
    </div>
  );
};

interface PasarShopModalProps {
  money: number;
  inventory: Record<string, number>;
  season: SeasonType;
  weather: WeatherCondition;
  onCheckout: (cart: Record<string, number>, totalCost: number, ongkir: number, courierName: string) => void;
  onClose: () => void;
}

export const PasarShopModal: React.FC<PasarShopModalProps> = ({
  money,
  inventory,
  season,
  weather,
  onCheckout,
  onClose,
}) => {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [deliveryId, setDeliveryId] = useState<string>('sendiri');
  const [focusedIdx, setFocusedIdx] = useState<number>(0);

  const wholesaleItems = ITEMS.filter((i) => i.category === 'warung');
  const totalUnits = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = wholesaleItems.reduce((sum, it) => sum + (cart[it.id] ?? 0) * it.wholesalePrice, 0);
  const selectedDelivery = DELIVERY_OPTIONS.find((d) => d.id === deliveryId) ?? DELIVERY_OPTIONS[0];
  const grandTotal = subtotal + (totalUnits > 0 ? selectedDelivery.ongkir : 0);
  const exceedsCarry = totalUnits > selectedDelivery.maxUnits;
  const canPay = totalUnits > 0 && !exceedsCarry && money >= grandTotal;

  const changeQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      return { ...prev, [id]: next };
    });
  };

  useUiGamepadAction((btn) => {
    const len = wholesaleItems.length;
    if (len === 0) return;
    if (btn === 'DPAD_RIGHT') {
      setFocusedIdx((i) => (i + 1) % len);
    } else if (btn === 'DPAD_LEFT') {
      setFocusedIdx((i) => (i + len - 1) % len);
    } else if (btn === 'DPAD_DOWN') {
      setFocusedIdx((i) => (i + 3) % len);
    } else if (btn === 'DPAD_UP') {
      setFocusedIdx((i) => (i + len - 3) % len);
    } else if (btn === 'A') {
      const item = wholesaleItems[focusedIdx];
      if (item) changeQty(item.id, 1);
    } else if (btn === 'X') {
      const item = wholesaleItems[focusedIdx];
      if (item) changeQty(item.id, -1);
    } else if (btn === 'LB' || btn === 'RB') {
      const dIdx = DELIVERY_OPTIONS.findIndex((d) => d.id === deliveryId);
      const nextIdx =
        btn === 'RB'
          ? (dIdx + 1) % DELIVERY_OPTIONS.length
          : (dIdx + DELIVERY_OPTIONS.length - 1) % DELIVERY_OPTIONS.length;
      setDeliveryId(DELIVERY_OPTIONS[nextIdx].id);
    } else if (btn === 'Y' && canPay) {
      onCheckout(
        cart,
        grandTotal,
        totalUnits > 0 ? selectedDelivery.ongkir : 0,
        selectedDelivery.name
      );
    }
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-amber-400 rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-2xl max-h-[94dvh] flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div>
            <h2 className="font-display text-xl font-bold text-amber-200 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              Kios Grosir Pasar Tradisional Sunda
            </h2>
            <p className="text-xs text-slate-300">
              Kulakan stok Warung Arga dengan harga grosir. Kontroler: [D-Pad] Pilih · [A]/[X] +/- · [LB/RB] Kurir · [Y] Bayar
            </p>
          </div>
          <div className="font-mono-num text-sm font-bold text-emerald-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-emerald-500/40">
            Uang Arga: {formatRupiah(money)}
          </div>
        </div>

        <div
          className={`mb-3 px-3 py-2 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${WEATHER_META[weather].badgeBg} ${WEATHER_META[weather].badgeText}`}
        >
          <span className="font-bold">
            {WEATHER_META[weather].emoji} {SEASON_META[season].label} · {WEATHER_META[weather].label}
          </span>
          <span className="text-[11px] opacity-95">{SEASON_META[season].advice}</span>
        </div>

        {/* Item Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 overflow-y-auto pr-1 mb-4">
          {wholesaleItems.map((it, idx) => {
            const qty = cart[it.id] ?? 0;
            const currentStock = inventory[it.id] ?? 0;
            const isFocused = focusedIdx === idx;
            const isHotSeason =
              (season === 'hujan' && it.seasonTag === 'hujan') ||
              (season === 'kemarau' && it.seasonTag === 'kemarau');
            return (
              <div
                key={it.id}
                onMouseEnter={() => setFocusedIdx(idx)}
                className={`bg-slate-950/85 border rounded-xl p-3 flex items-center justify-between gap-2 transition-all ${
                  isFocused
                    ? 'border-amber-400 ally-focus'
                    : isHotSeason
                    ? 'border-sky-400/60'
                    : 'border-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-amber-100 truncate flex items-center gap-1">
                    <span>
                      {it.emojiIcon} {it.name}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono-num text-emerald-300">
                    Grosir: {formatRupiah(it.wholesalePrice)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                    <span>Stok warung: {currentStock}</span>
                    {it.seasonTag === 'hujan' && (
                      <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                        ☔ Musim Hujan
                      </span>
                    )}
                    {it.seasonTag === 'kemarau' && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                        ☀️ Terik
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => changeQty(it.id, -1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-amber-200 font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono-num text-xs font-bold text-white">{qty}</span>
                  <button
                    onClick={() => changeQty(it.id, 1)}
                    className="w-7 h-7 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery / Ongkir Selector */}
        <div className="bg-slate-950/90 border border-amber-400/50 rounded-xl p-3.5 mb-4">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Truck className="w-4 h-4" />
            <span>Pengiriman Barang Dagangan (Total: {totalUnits} pcs)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {DELIVERY_OPTIONS.map((d) => {
              const active = deliveryId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDeliveryId(d.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    active
                      ? 'bg-amber-400/20 border-amber-400 text-amber-100'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{d.name}</span>
                    <span className="font-mono-num text-amber-300">
                      {d.ongkir === 0 ? 'Gratis' : formatRupiah(d.ongkir)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{d.note}</div>
                </button>
              );
            })}
          </div>
          {exceedsCarry && (
            <div className="text-xs text-rose-400 font-bold mt-2">
              Barang melebihi kapasitas {selectedDelivery.name}! Pilih jasa antar Mamang Becak atau Mamang Delman.
            </div>
          )}
        </div>

        {/* Checkout Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-300 font-mono-num">
            Barang: {formatRupiah(subtotal)} + Ongkir:{' '}
            {formatRupiah(totalUnits > 0 ? selectedDelivery.ongkir : 0)} ={' '}
            <strong className="text-base text-amber-300">{formatRupiah(grandTotal)}</strong>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
            >
              Tutup [B]
            </button>
            <button
              disabled={!canPay}
              onClick={() =>
                onCheckout(
                  cart,
                  grandTotal,
                  totalUnits > 0 ? selectedDelivery.ongkir : 0,
                  selectedDelivery.name
                )
              }
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Bayar & Kirim Stok [Y]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
