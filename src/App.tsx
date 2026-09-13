import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  FileSpreadsheet, 
  WifiOff, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import { DualActionGate } from './components/DualActionGate';
import { QRGenerator } from './components/QRGenerator';
import type { DualActionPayload } from './types';

const ScannerModal = lazy(() => import('./components/ScannerModal').then(m => ({ default: m.ScannerModal })));
const BulkCSVModal = lazy(() => import('./components/BulkCSVModal').then(m => ({ default: m.BulkCSVModal })));

interface HashRouteState {
  view: 'hub' | 'pay';
  scanner: boolean;
  staff: boolean;
  batch: boolean;
}

export function App() {
  // HashRouter parser
  const parseRouteFromHash = (): HashRouteState => {
    const hash = window.location.hash || '';
    // Strip #/ or # and grab route segment before query parameters
    const cleanHash = hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
    
    // Also check query parameter fallback ?mode=pay
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

  useEffect(() => {
    // HashRouter listener
    const onHashChange = () => {
      setRouteState(parseRouteFromHash());
    };
    window.addEventListener('hashchange', onHashChange);

    // Monitor online/offline state
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker for offline PWA under /qr/
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const swUrl = import.meta.env.BASE_URL + 'sw.js';
        navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL }).catch((err) => {
          console.log('Service Worker registration skipped or failed:', err);
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
    params.set('pa', payload.pa);
    params.set('pn', payload.pn);
    if (payload.am) params.set('am', payload.am);
    if (payload.tn) params.set('tn', payload.tn);
    if (payload.wa) params.set('wa', payload.wa);
    navigateTo(`/pay?${params.toString()}`);
  };

  const handleBackToGenerator = () => {
    setTestPayload(undefined);
    // If there were query params on window.location.search, remove them
    if (window.location.search) {
      const cleanUrl = window.location.origin + window.location.pathname + '#/';
      window.history.replaceState({}, '', cleanUrl);
    }
    navigateTo('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div 
            onClick={handleBackToGenerator}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <span className="font-mono font-black text-white text-base tracking-tighter">QR</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">QR</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Dual-Action Hub & Zero-Persistence Generator</p>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2">
            {/* Offline Status Badge */}
            {isOffline ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-1 rounded-lg">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Active</span>
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>100% Client-Side</span>
              </span>
            )}

            {/* Scanner Button (HashRouter: #/scan) */}
            <button
              onClick={() => navigateTo('/scan')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Scanner</span>
            </button>

            {/* Staff Reverse-Ingestion Scanner Button (HashRouter: #/staff) */}
            <button
              onClick={() => navigateTo('/staff')}
              className="hidden lg:inline-flex px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg items-center gap-1.5 transition-colors"
              title="Staff Reverse-Ingestion Camera Mode"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Staff Mode</span>
            </button>

            {/* Batch CSV Button (HashRouter: #/batch) */}
            <button
              onClick={() => navigateTo('/batch')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Batch CSV</span>
            </button>
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
            {/* Hero Sub-header */}
            <div className="max-w-7xl mx-auto px-4 mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-300 font-medium">
                  Zero-Persistence Privacy Engine: Data never touches a remote database.
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <span>Chromium • Safari • Firefox</span>
                <span>•</span>
                <span>PWA Standalone Ready</span>
              </div>
            </div>

            {/* Central Generator Hub */}
            <QRGenerator onOpenDualActionGate={handleOpenDualActionGate} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
            <span>QR — Zero tracking, zero storage, native intent execution.</span>
          </div>
          <div className="text-[11px] text-slate-600">
            FSD Compliant v1.0.0 • Micro-Merchant, Enterprise IT & Transit Schemas
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
    </div>
  );
}

export default App;
