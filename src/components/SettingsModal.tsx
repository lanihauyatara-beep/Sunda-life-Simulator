import React from 'react';
import { GameSettings } from '../types/game';
import { PWAInstallButton } from './PWAAndOrientationUI';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (next: GameSettings) => void;
  onReplayTutorial: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onReplayTutorial,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-400 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] p-4 sm:p-5 md:p-7 max-h-[94dvh] overflow-y-auto">
        <div className="flex justify-center mb-5">
          <div className="px-8 py-1.5 rounded-full bg-amber-400 text-slate-950 font-display font-bold text-lg shadow">
            Pengaturan
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* SUARA */}
          <div className="bg-slate-950/85 border border-amber-400/45 rounded-xl p-4">
            <h3 className="text-xs font-bold tracking-wider text-amber-300 uppercase mb-3">SUARA</h3>
            <div className="space-y-3">
              {[
                { key: 'musicVolume' as const, label: 'Musik' },
                { key: 'sfxVolume' as const, label: 'Efek Suara' },
                { key: 'ambientVolume' as const, label: 'Suara Sekitar' },
              ].map((row) => (
                <div key={row.key} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium text-slate-200">{row.label}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings[row.key]}
                    onChange={(e) => onUpdate({ ...settings, [row.key]: Number(e.target.value) })}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="w-12 text-right font-mono-num text-sm font-bold text-amber-200">
                    {settings[row.key]}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PERMAINAN & KONTROLER */}
          <div className="bg-slate-950/85 border border-amber-400/45 rounded-xl p-4">
            <h3 className="text-xs font-bold tracking-wider text-amber-300 uppercase mb-3">PERMAINAN</h3>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-sm font-medium text-slate-200">Cara melayani</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdate({ ...settings, serveMode: 'seret' })}
                  className={`px-4 py-1.5 rounded-lg font-bold text-sm border transition-colors ${
                    settings.serveMode === 'seret'
                      ? 'bg-amber-400 text-slate-950 border-amber-200'
                      : 'bg-slate-900 text-slate-200 border-slate-700'
                  }`}
                >
                  Seret
                </button>
                <button
                  onClick={() => onUpdate({ ...settings, serveMode: 'klik' })}
                  className={`px-4 py-1.5 rounded-lg font-bold text-sm border transition-colors ${
                    settings.serveMode === 'klik'
                      ? 'bg-amber-400 text-slate-950 border-amber-200'
                      : 'bg-slate-900 text-slate-200 border-slate-700'
                  }`}
                >
                  Klik
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Seret = tahan barang lalu seret ke kresek. Klik = cukup klik barangnya (atau tekan [A] di ROG Ally),
              langsung masuk kresek.
            </p>
            <button
              onClick={() => onUpdate({ ...settings, rogAllyMode: !settings.rogAllyMode })}
              className={`w-full py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                settings.rogAllyMode
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              Mode Kontroler ASUS ROG Ally: {settings.rogAllyMode ? 'Aktif (Tampilkan Tombol A/B/X/Y)' : 'Nonaktif'}
            </button>
          </div>

          {/* TAMPILAN */}
          <div className="bg-slate-950/85 border border-amber-400/45 rounded-xl p-4">
            <h3 className="text-xs font-bold tracking-wider text-amber-300 uppercase mb-3">TAMPILAN</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(['rendah', 'sedang', 'tinggi'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdate({ ...settings, graphicsQuality: q })}
                  className={`py-2 rounded-lg font-bold text-sm capitalize border transition-colors ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-400 text-slate-950 border-amber-200'
                      : 'bg-slate-900 text-slate-200 border-amber-400/40'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            <button
              onClick={() => onUpdate({ ...settings, batterySaver: !settings.batterySaver })}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-amber-400/45 text-xs font-bold text-amber-100 mb-3"
            >
              Hemat baterai: {settings.batterySaver ? 'aktif (30 FPS)' : 'mati (60 FPS, lebih mulus)'}
            </button>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-300">Bahasa / Basa</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdate({ ...settings, language: 'id' })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${
                    settings.language === 'id'
                      ? 'bg-amber-400 text-slate-950 border-amber-200'
                      : 'bg-slate-900 text-slate-200 border-slate-700'
                  }`}
                >
                  Indonesia
                </button>
                <button
                  onClick={() => onUpdate({ ...settings, language: 'su' })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${
                    settings.language === 'su'
                      ? 'bg-amber-400 text-slate-950 border-amber-200'
                      : 'bg-slate-900 text-slate-200 border-slate-700'
                  }`}
                >
                  Basa Sunda
                </button>
              </div>
            </div>
          </div>

          {/* LAINNYA */}
          <div className="bg-slate-950/85 border border-amber-400/45 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold tracking-wider text-amber-300 uppercase mb-3">LAINNYA & KONTROL</h3>
              <div className="text-xs text-slate-300 space-y-1.5 mb-3">
                <div>• Analog Kiri / D-Pad / WASD: Gerakkan Arga</div>
                <div>• [A] / Enter / E: Sapa Warga & Interaksi Lokasi</div>
                <div>• [B] / Esc: Tutup Menu / Keluar Ruangan</div>
                <div>• [X] / H: Buka HP / Pengaturan Warung</div>
                <div>• [Y] / M: Buka Peta Kampung Sunda</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <PWAInstallButton />
              </div>
              <button
                onClick={onReplayTutorial}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors"
              >
                Lihat Panduan Lengkap Bermain
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 text-slate-950 font-display font-bold text-lg shadow-lg hover:brightness-105 transition-all"
        >
          Simpan dan Kembali [B]
        </button>
      </div>
    </div>
  );
};
