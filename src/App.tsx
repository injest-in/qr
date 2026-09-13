import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  FileSpreadsheet, 
  WifiOff, 
  Layers, 
  Sparkles, 
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import { DualActionGate } from './components/DualActionGate';
import { QRGenerator } from './components/QRGenerator';
import { ThemeToggle } from './components/ThemeToggle';
import { SpotlightTour } from './components/SpotlightTour';
import { MadeInBharatBadge } from './components/MadeInBharatBadge';
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

  // Mobile overflow tools menu state
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);

  // Close mobile tools menu on outside click
  useEffect(() => {
    if (!isToolsMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isToolsMenuOpen]);

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
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Brand: SVG Favicon Icon */}
          <div 
            onClick={handleBackToGenerator}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <img 
                src={`${import.meta.env.BASE_URL}qr-icon.svg`} 
                alt="QR Favicon Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">QR</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/25 rounded">
                  v1.0
                </span>
                <MadeInBharatBadge variant="pill" />
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                Simple &amp; Private QR Maker
              </p>
            </div>
          </div>

          {/* Quick Action Tools & Theme Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Offline Status Badge */}
            {isOffline && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-lg">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Active</span>
              </span>
            )}

            {/* Scanner Button (HashRouter: #/scan) */}
            <button
              onClick={() => navigateTo('/scan')}
              className="p-1.5 sm:px-3 sm:py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Camera QR Scanner"
            >
              <Camera className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span className="hidden sm:inline">Scanner</span>
            </button>

            {/* Staff Reverse-Ingestion Scanner Button (HashRouter: #/staff) */}
            <button
              onClick={() => navigateTo('/staff')}
              className="hidden sm:inline-flex px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg items-center gap-1.5 transition-colors cursor-pointer"
              title="Staff Reverse-Ingestion Camera Mode"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Staff Mode</span>
            </button>

            {/* Batch CSV Button (Desktop Only) */}
            <button
              onClick={() => navigateTo('/batch')}
              className="hidden sm:inline-flex px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg items-center gap-1.5 transition-colors cursor-pointer"
              title="Bulk Batch CSV Studio"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Batch CSV</span>
            </button>

            {/* Spotlight Tour Button */}
            <button
              onClick={() => setIsTourOpen(true)}
              className="hidden sm:inline-flex p-1.5 sm:px-2.5 sm:py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold rounded-lg items-center gap-1.5 transition-colors cursor-pointer"
              title="Take a quick guided tour"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Tour</span>
            </button>

            {/* Open-Source GitHub Link (Desktop Only) */}
            <a
              href="https://github.com/injest-in/qr"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold rounded-lg items-center gap-1.5 transition-colors cursor-pointer"
              title="View open-source repository on GitHub"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>

            {/* Theme Toggle (Mobile Dropdown | Desktop Segmented Pill) */}
            <ThemeToggle
              currentTheme={theme}
              onThemeChange={handleThemeChange}
            />

            {/* Mobile More Tools Menu (sm:hidden) */}
            <div className="relative sm:hidden" ref={toolsMenuRef}>
              <button
                type="button"
                onClick={() => setIsToolsMenuOpen(prev => !prev)}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                  isToolsMenuOpen
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="More Studio Tools"
                aria-label="More studio tools menu"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {isToolsMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Studio Tools &amp; Actions
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      navigateTo('/staff');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300 transition-colors text-left cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="font-semibold">Staff Mode</div>
                      <div className="text-[10px] text-slate-400">Reverse-ingestion inspector</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      navigateTo('/batch');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-left cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-semibold">Batch CSV Studio</div>
                      <div className="text-[10px] text-slate-400">Bulk generation from CSV</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsTourOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <div className="font-semibold">Feature Tour</div>
                      <div className="text-[10px] text-slate-400">Guided spotlight walkthrough</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <a
                    href="https://github.com/injest-in/qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsToolsMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Audit Code (GitHub)</div>
                      <div className="text-[10px] text-slate-400">100% Open Source (MIT)</div>
                    </div>
                  </a>
                </div>
              )}
            </div>
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
            {/* Friendly Privacy Sub-header */}
            <div className="max-w-7xl mx-auto px-4 mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center flex-wrap gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  100% Private &amp; On-Device: Your data never leaves this browser.
                </span>
                <a
                  href="https://github.com/injest-in/qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  title="Inspect source code and audit zero telemetry on GitHub"
                >
                  <span>Audit Code</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                <a
                  href="https://github.com/injest-in/qr/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  title="Licensed under MIT"
                >
                  MIT License
                </a>
                <span>•</span>
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
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>QR — 100% private, zero tracking, works directly on your device.</span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <a
              href="https://github.com/injest-in/qr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium"
              title="View source repository and audit code on GitHub"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Open Source</span>
            </a>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap justify-center">
            <MadeInBharatBadge variant="footer" />
            <span>•</span>
            <a
              href="https://github.com/injest-in/qr/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 dark:hover:text-slate-200 underline decoration-slate-300 dark:decoration-slate-700"
            >
              MIT License
            </a>
            <span>•</span>
            <span>Free Forever</span>
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
      {isTourOpen && (
        <SpotlightTour
          isOpen={isTourOpen}
          onClose={handleTourClose}
          onComplete={handleTourClose}
        />
      )}
    </div>
  );
}

export default App;
