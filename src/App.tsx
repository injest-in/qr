import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  FileSpreadsheet, 
  WifiOff, 
  CheckCircle2, 
  Layers,
  Sparkles
} from 'lucide-react';
import { DualActionGate } from './components/DualActionGate';
import { QRGenerator } from './components/QRGenerator';
import { ThemeToggle } from './components/ThemeToggle';
import { SpotlightTour } from './components/SpotlightTour';
import { getStoredTheme, setStoredTheme, applyTheme } from './utils/theme';
import type { DualActionPayload, ThemeMode } from './types';

const ScannerModal = lazy(() => import('./components/ScannerModal').then(m => ({ default: m.ScannerModal })));
const BulkCSVModal = lazy(() => import('./components/BulkCSVModal').then(m => ({ default: m.BulkCSVModal })));

interface HashRouteState {
  view: 'hub' | 'pay';
  scanner: boolean;
  staff: boolean;
  batch: boolean;
}

export function App() {
  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);

    // If system theme is selected, listen for OS dark mode changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemChange = () => {
        applyTheme('system');
      };
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }
  }, [theme]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    setStoredTheme(newTheme);
    applyTheme(newTheme);
  };

  // HashRouter parser
  const parseRouteFromHash = (): HashRouteState => {
    const hash = window.location.hash || '';
    const cleanHash = hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
    
    // Check fallback query param ?mode=pay
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');

    if (cleanHash === 'pay' || mode === 'pay') {
      return { view: 'pay', scanner: false, staff: false, batch: false };
    }
    if (cleanHash === 'scan') {
      return { view: 'hub', scanner: true, staff: false, batch: false };
    }
    if (cleanHash === 'staff' || cleanHash === 'scan/staff') {
      return { view: 'hub', scanner: true, staff: true, batch: false };
    }
    if (cleanHash === 'batch' || cleanHash === 'csv') {
      return { view: 'hub', scanner: false, staff: false, batch: true };
    }
    return { view: 'hub', scanner: false, staff: false, batch: false };
  };

  const [routeState, setRouteState] = useState<HashRouteState>(parseRouteFromHash);
  const [testPayload, setTestPayload] = useState<DualActionPayload | undefined>();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Spotlight Tour state (triggers on first visit or on demand)
  const [isTourOpen, setIsTourOpen] = useState(() => {
    try {
      return localStorage.getItem('qr_has_seen_tour') !== 'true';
    } catch {
      return false;
    }
  });

  const handleTourClose = () => {
    setIsTourOpen(false);
    try {
      localStorage.setItem('qr_has_seen_tour', 'true');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      setRouteState(parseRouteFromHash());
    };
    window.addEventListener('hashchange', onHashChange);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker for offline PWA under /qr/
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const swUrl = import.meta.env.BASE_URL + 'sw.js';
        navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL }).catch((err) => {
          console.log('Service Worker skipped/failed:', err);
        });
      });
    }

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigateTo = (hashRoute: string) => {
    window.location.hash = hashRoute;
  };

  const handleOpenDualActionGate = (payload: DualActionPayload) => {
    setTestPayload(payload);
    const params = new URLSearchParams();
    if (payload.pa) params.set('pa', payload.pa);
    if (payload.pn) params.set('pn', payload.pn);
    if (payload.am) params.set('am', payload.am);
    if (payload.tn) params.set('tn', payload.tn);
    if (payload.wa) params.set('wa', payload.wa);
    navigateTo(`/pay?${params.toString()}`);
  };

  const handleBackToGenerator = () => {
    setTestPayload(undefined);
    if (window.location.search) {
      const cleanUrl = window.location.origin + window.location.pathname + '#/';
      window.history.replaceState({}, '', cleanUrl);
    }
    navigateTo('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand: SVG Favicon Icon */}
          <div 
            onClick={handleBackToGenerator}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <img 
                src={`${import.meta.env.BASE_URL}qr-icon.svg`} 
                alt="QR Favicon Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">QR</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/25 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Hub & Zero-Persistence Generator</p>
            </div>
          </div>

          {/* Quick Action Tools & Theme Switcher */}
          <div className="flex items-center gap-2">
            {/* Offline Status Badge */}
            {isOffline ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-lg">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Active</span>
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>100% Client-Side</span>
              </span>
            )}

            {/* Scanner Button (HashRouter: #/scan) */}
            <button
              onClick={() => navigateTo('/scan')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span className="hidden sm:inline">Scanner</span>
            </button>

            {/* Staff Reverse-Ingestion Scanner Button (HashRouter: #/staff) */}
            <button
              onClick={() => navigateTo('/staff')}
              className="hidden lg:inline-flex px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg items-center gap-1.5 transition-colors cursor-pointer"
              title="Staff Reverse-Ingestion Camera Mode"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Staff Mode</span>
            </button>

            {/* Batch CSV Button (HashRouter: #/batch) */}
            <button
              onClick={() => navigateTo('/batch')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Batch CSV</span>
            </button>

            {/* Spotlight Tour Button */}
            <button
              onClick={() => setIsTourOpen(true)}
              className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Take a quick guided tour"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Tour</span>
            </button>

            {/* Theme Toggle (Light / Dark / System) */}
            <ThemeToggle
              currentTheme={theme}
              onThemeChange={handleThemeChange}
            />
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {routeState.view === 'pay' ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <DualActionGate
              onBackToGenerator={handleBackToGenerator}
              customPayload={testPayload}
            />
          </div>
        ) : (
          <div className="flex-1 py-4">
            {/* Zero-Persistence Privacy Sub-header */}
            <div className="max-w-7xl mx-auto px-4 mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Zero-Persistence Privacy: 100% on-device. No data is stored or transmitted.
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px]">
                <span>PWA Ready</span>
                <span>•</span>
                <span>Bookmarkable Deeplinks</span>
                <span>•</span>
                <span>Transparent Canvas</span>
              </div>
            </div>

            {/* Central Generator Hub */}
            <QRGenerator onOpenDualActionGate={handleOpenDualActionGate} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>QR — Zero tracking, zero storage, native intent execution.</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-500">
            FSD Compliant v1.0.0 • Merchant, Business & Personal Tools
          </div>
        </div>
      </footer>

      {/* HashRouter Modals */}
      <Suspense fallback={null}>
        {routeState.scanner && (
          <ScannerModal
            isOpen={routeState.scanner}
            onClose={() => navigateTo('/')}
            staffModeDefault={routeState.staff}
          />
        )}

        {routeState.batch && (
          <BulkCSVModal
            isOpen={routeState.batch}
            onClose={() => navigateTo('/')}
          />
        )}
      </Suspense>

      {/* Spotlight Tour */}
      <SpotlightTour
        isOpen={isTourOpen}
        onClose={handleTourClose}
        onComplete={handleTourClose}
      />
    </div>
  );
}

export default App;
