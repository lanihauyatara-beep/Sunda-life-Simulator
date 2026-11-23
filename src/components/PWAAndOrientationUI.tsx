import React, { useEffect, useState } from 'react';
import { Download, Maximize2, RotateCw, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg transition-all ${
          compact ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2 text-xs sm:text-sm'
        }`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install Game (Offline)</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center justify-center gap-2 rounded-full bg-slate-900/90 border border-emerald-400/70 text-emerald-200 hover:bg-slate-800 font-bold shadow transition-all ${
            compact ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'
          }`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Install Offline (iOS)</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border-2 border-amber-400 p-5 shadow-2xl text-left">
              <h3 className="font-display text-lg font-bold text-amber-200">
                Pasang di iPhone / iPad (Bisa Main Offline)
              </h3>
              <p className="mt-2 text-xs text-slate-200 leading-relaxed">
                1. Ketuk tombol <strong>Bagikan (Share)</strong> di Safari.<br />
                2. Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.<br />
                3. Buka game dari ikon Layar Utama untuk bermain penuh tanpa browser bar &amp; tetap lancar saat offline.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-amber-400 hover:bg-amber-300 py-2.5 text-sm font-bold text-slate-950"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

/**
 * Enforces landscape orientation when played on a mobile phone (HP).
 * Also provides a one-tap Fullscreen + ScreenOrientation.lock('landscape') trigger.
 */
export const LandscapeOrientationGuard: React.FC = () => {
  const [mustRotate, setMustRotate] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isPortrait = h > w;
      const ua = window.navigator.userAgent.toLowerCase();
      const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const isPhoneSized = Math.min(w, h) <= 620 || /android|iphone|ipod|mobile/i.test(ua);
      // Mobile phone (or compact touch handheld) in portrait orientation -> require landscape
      setMustRotate(isPortrait && (isCoarsePointer || isPhoneSized) && w < 900);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleForceLandscape = async () => {
    try {
      const docEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };
      if (!document.fullscreenElement) {
        if (docEl.requestFullscreen) await docEl.requestFullscreen();
        else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen();
      }
      const orient = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      if (orient && typeof orient.lock === 'function') {
        await orient.lock('landscape');
      }
    } catch {
      // Browser/iOS ignores orientation.lock without user physical rotation; overlay guides user
    }
  };

  if (!mustRotate) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-20 h-20 rounded-2xl bg-amber-400/15 border-2 border-amber-400 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(251,191,36,0.25)]">
        <RotateCw className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '3.2s' }} />
      </div>
      <h2 className="font-display text-2xl font-bold text-amber-200 mb-2">
        Putar Layar HP ke Mode Landscape
      </h2>
      <p className="text-sm text-slate-300 max-w-sm leading-relaxed mb-6">
        <strong>Sunda Life Simulator</strong> wajib dimainkan dalam posisi <strong>Landscape (miring mendatar)</strong>{' '}
        agar kampung Sunda, jalan raya, Warung Arga, dan kontrol sentuh terlihat utuh dan nyaman.
      </p>
      <button
        onClick={handleForceLandscape}
        className="px-6 py-3 rounded-xl bg-gradient-to-b from-amber-300 to-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
      >
        <Maximize2 className="w-4 h-4" />
        <span>Kunci Landscape &amp; Layar Penuh</span>
      </button>
      <p className="text-[11px] text-slate-400 mt-4">
        Aktifkan fitur Putar Otomatis (Auto-Rotate) jika layar belum berputar otomatis.
      </p>
    </div>
  );
};

export const OfflineNoticePill: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[150] px-3 py-1 rounded-full bg-slate-900/95 border border-emerald-400/70 text-emerald-200 text-[11px] font-bold flex items-center gap-1.5 shadow-lg pointer-events-none">
      <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
      <span>Mode Offline · Bermain Lancar dari Cache</span>
    </div>
  );
};
