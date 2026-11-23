import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {ASSETS} from './data/gameData';
import {warmOfflineAssets} from './hooks/usePWAInstall';
import './index.css';

// Register offline Service Worker for smooth offline gameplay on PC, Laptop, Tablet & Phone
registerSW({
  immediate: true,
  onOfflineReady() {
    warmOfflineAssets(Object.values(ASSETS));
  },
});

// Warm scene artwork cache in background once loaded
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    warmOfflineAssets(Object.values(ASSETS));
  });
}

createRoot(document.getElementById('root')!).render(<App />);
