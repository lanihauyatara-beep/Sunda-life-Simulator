import React from 'react';
import { Save, Trash2, CheckCircle2, Trophy } from 'lucide-react';
import { SaveSlotSummary } from '../types/game';
import { formatRupiah } from '../data/gameData';

interface SaveSlotsModalProps {
  slots: SaveSlotSummary[];
  focusedSlotIndex: number;
  currentSlotId?: number;
  onSelectSlot: (slotId: number) => void;
  onSaveCurrentToSlot?: (slotId: number) => void;
  onDeleteSlot: (slotId: number) => void;
  onClose: () => void;
}

export const SaveSlotsModal: React.FC<SaveSlotsModalProps> = ({
  slots,
  focusedSlotIndex,
  currentSlotId,
  onSelectSlot,
  onSaveCurrentToSlot,
  onDeleteSlot,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-amber-400 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] p-4 sm:p-6 md:p-8 max-h-[94dvh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-amber-50">
            {onSaveCurrentToSlot ? 'Kelola & Pindah Slot Penyimpanan' : 'Load Save'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Setiap slot tersimpan mandiri di Local Storage browser masing-masing pemain
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
          {slots.map((slot, idx) => {
            const isFocused = focusedSlotIndex === idx;
            const isActive = currentSlotId === slot.slotId;

            if (slot.empty) {
              return (
                <div key={slot.slotId} className="flex items-stretch gap-2">
                  <button
                    onClick={() => onSelectSlot(slot.slotId)}
                    className={`flex-1 text-left px-5 py-4 rounded-xl bg-slate-950/80 border-2 border-amber-400/50 hover:border-amber-300 transition-all ${
                      isFocused ? 'ally-focus bg-slate-800/80' : ''
                    }`}
                  >
                    <div className="font-bold text-amber-100 text-sm">Slot {slot.slotId} · Kosong</div>
                    <div className="text-xs text-slate-400 mt-0.5">+ Mulai permainan baru di Slot {slot.slotId}</div>
                  </button>
                  {onSaveCurrentToSlot && (
                    <button
                      onClick={() => onSaveCurrentToSlot(slot.slotId)}
                      title={`Simpan progress aktif ke Slot ${slot.slotId}`}
                      className="px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 border border-emerald-400 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan</span>
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div key={slot.slotId} className="flex items-stretch gap-2">
                <button
                  onClick={() => onSelectSlot(slot.slotId)}
                  className={`flex-1 text-left px-4 py-3.5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 text-slate-950 border-2 shadow-md transition-all min-w-0 ${
                    isActive ? 'border-white ring-2 ring-emerald-400' : 'border-amber-200'
                  } ${isFocused ? 'ally-focus brightness-105' : 'hover:brightness-105'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm truncate">
                      Slot {slot.slotId} · {slot.warungName}
                    </div>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Aktif
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-amber-950 mt-1 tabular-nums">
                    <span>{slot.dateLabel}</span>
                    <span>·</span>
                    <span>{formatRupiah(slot.money ?? 0)}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-extrabold">
                      <Trophy className="w-3 h-3" /> {slot.rankLabel ?? `Level ${slot.level}`}
                    </span>
                  </div>
                </button>
                {onSaveCurrentToSlot && (
                  <button
                    onClick={() => onSaveCurrentToSlot(slot.slotId)}
                    title={`Timpa & simpan ke Slot ${slot.slotId}`}
                    className="px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 border border-emerald-400 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan</span>
                  </button>
                )}
                <button
                  onClick={() => onDeleteSlot(slot.slotId)}
                  title={`Hapus Slot ${slot.slotId}`}
                  className="px-3.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 border border-rose-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus</span>
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className={`w-full py-3.5 rounded-xl bg-slate-950 border-2 border-amber-400/60 hover:bg-slate-800 text-amber-100 font-bold text-base transition-colors ${
            focusedSlotIndex === 6 ? 'ally-focus' : ''
          }`}
        >
          Kembali [B]
        </button>
      </div>
    </div>
  );
};
