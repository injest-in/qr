import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { 
  CreditCard, 
  Settings, 
  MapPin, 
  Wifi, 
  UserCheck, 
  Calendar, 
  Link, 
  Layers, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  AlertTriangle, 
  ExternalLink,
  Plus,
  Trash2,
  Navigation,
  Compass,
  Store,
  Palette,
  Eye,
  Sparkles
} from 'lucide-react';
import type { 
  QRMode, 
  QROptions, 
  DualActionPayload, 
  ServiceNowPayload, 
  GenericFormPayload, 
  TransitPayload, 
  UberPayload, 
  WhatsAppCatalogPayload, 
  CalendarPayload, 
  WiFiPayload, 
  VCardPayload,
  PrintTemplateConfig
} from '../types';
import { 
  generateUPIUrl, 
  generateDualActionGateUrl,
  generateServiceNowUrl,
  generateGenericFormUrl,
  generateMapsTransitUrl,
  generateUberIntentUrl,
  generateWACatalogUrl,
  generateWiFiString,
  generateVCardString,
  generateICSString
} from '../utils/qrParsers';
import { analyzeScannability } from '../utils/scannabilityLinter';

const PrintPreviewModal = lazy(() => import('./PrintPreviewModal').then(m => ({ default: m.PrintPreviewModal })));

interface QRGeneratorProps {
  onOpenDualActionGate: (payload: DualActionPayload) => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ onOpenDualActionGate }) => {
  const [activeTab, setActiveTab] = useState<QRMode>('dual-action');

  // Payload states
  const [dualAction, setDualAction] = useState<DualActionPayload>({
    pa: 'coffeehub@upi',
    pn: 'Artisan Coffee Co.',
    am: '180.00',
    tn: 'Cold Brew & Croissant',
    wa: '919876543210'
  });
  const [encodeDualActionGate, setEncodeDualActionGate] = useState(true);

  const [serviceNow, setServiceNow] = useState<ServiceNowPayload>({
    instance: 'dev98765',
    table: 'incident',
    mode: 'platform',
    portalSysId: '',
    fields: [
      { key: 'short_description', value: 'Conference Room Display Offline' },
      { key: 'urgency', value: '2' },
      { key: 'category', value: 'Hardware' }
    ]
  });

  const [genericForm, setGenericForm] = useState<GenericFormPayload>({
    baseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc.../viewform',
    fields: [
      { key: 'entry.1000001', value: 'Table-12' },
      { key: 'entry.1000002', value: 'Dinner' }
    ]
  });

  const [transit, setTransit] = useState<TransitPayload>({
    lat: '37.7749',
    lng: '-122.4194',
    name: 'San Francisco Civic Center',
    travelMode: 'transit'
  });

  const [uber, setUber] = useState<UberPayload>({
    dropoffLat: '37.7879',
    dropoffLng: '-122.4075',
    dropoffNickname: 'Union Square'
  });

  const [waCatalog, setWaCatalog] = useState<WhatsAppCatalogPayload>({
    countryCode: '91',
    phone: '9876543210'
  });

  const [wifi, setWifi] = useState<WiFiPayload>({
    ssid: 'Guest_HighSpeed_WiFi',
    password: 'SecurePassword123!',
    encryption: 'WPA',
    hidden: false
  });

  const [vcard, setVcard] = useState<VCardPayload>({
    firstName: 'Alex',
    lastName: 'Morgan',
    organization: 'FinTech Innovations',
    title: 'Lead Architect',
    phone: '+1 555-0199',
    email: 'alex.morgan@fintech.example',
    url: 'https://fintech.example',
    address: '100 Market St, San Francisco, CA'
  });

  const [calendar, setCalendar] = useState<CalendarPayload>({
    title: 'Product Launch Keynote',
    description: 'Annual flagship keynote showcasing SwissArmy QR 2.0',
    location: 'Main Auditorium & Live Stream',
    startDate: '2026-10-15T10:00',
    endDate: '2026-10-15T11:30'
  });

  const [rawUrl, setRawUrl] = useState('https://swissarmy-qr.example.com');

  // QR Visual Customization
  const [options, setOptions] = useState<QROptions>({
    fgColor: '#0f172a',
    bgColor: '#ffffff',
    useGradient: false,
    gradientColor2: '#3b82f6',
    gradientType: 'linear',
    dotsType: 'rounded',
    cornersSquareType: 'extra-rounded',
    cornersDotType: 'dot',
    errorCorrectionLevel: 'M',
    margin: 4,
    logoMargin: 2
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const qrCodeContainerRef = useRef<HTMLDivElement | null>(null);
  const qrCodeInstanceRef = useRef<QRCodeStyling | null>(null);

  // Compute Raw String Payload
  const rawPayload = useMemo(() => {
    switch (activeTab) {
      case 'dual-action':
        return encodeDualActionGate
          ? generateDualActionGateUrl(dualAction)
          : generateUPIUrl(dualAction);
      case 'servicenow':
        return generateServiceNowUrl(serviceNow);
      case 'generic-form':
        return generateGenericFormUrl(genericForm);
      case 'transit':
        return generateMapsTransitUrl(transit);
      case 'uber':
        return generateUberIntentUrl(uber);
      case 'wa-catalog':
        return generateWACatalogUrl(waCatalog);
      case 'wifi':
        return generateWiFiString(wifi);
      case 'vcard':
        return generateVCardString(vcard);
      case 'calendar':
        return generateICSString(calendar);
      case 'url':
        return rawUrl;
      default:
        return '';
    }
  }, [
    activeTab,
    dualAction,
    encodeDualActionGate,
    serviceNow,
    genericForm,
    transit,
    uber,
    waCatalog,
    wifi,
    vcard,
    calendar,
    rawUrl
  ]);

  // Scannability & Contrast Linter Analysis
  const linter = useMemo(() => {
    return analyzeScannability(
      options.fgColor,
      options.bgColor,
      rawPayload.length,
      options.errorCorrectionLevel
    );
  }, [options.fgColor, options.bgColor, rawPayload.length, options.errorCorrectionLevel]);

  // Initialize and update QRCodeStyling
  useEffect(() => {
    if (!qrCodeInstanceRef.current) {
      qrCodeInstanceRef.current = new QRCodeStyling({
        width: 320,
        height: 320,
        data: rawPayload || 'https://swissarmy-qr.example.com',
        image: options.logoDataUrl,
        dotsOptions: {
          color: options.fgColor,
          type: options.dotsType,
          gradient: options.useGradient ? {
            type: options.gradientType,
            rotation: 45,
            colorStops: [
              { offset: 0, color: options.fgColor },
              { offset: 1, color: options.gradientColor2 }
            ]
          } : undefined
        },
        backgroundOptions: {
          color: options.bgColor
        },
        cornersSquareOptions: {
          color: options.fgColor,
          type: options.cornersSquareType
        },
        cornersDotOptions: {
          color: options.fgColor,
          type: options.cornersDotType
        },
        qrOptions: {
          errorCorrectionLevel: options.errorCorrectionLevel
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: options.logoMargin
        }
      });

      if (qrCodeContainerRef.current) {
        qrCodeContainerRef.current.innerHTML = '';
        qrCodeInstanceRef.current.append(qrCodeContainerRef.current);
      }
    } else {
      qrCodeInstanceRef.current.update({
        data: rawPayload || 'https://swissarmy-qr.example.com',
        image: options.logoDataUrl,
        dotsOptions: {
          color: options.fgColor,
          type: options.dotsType,
          gradient: options.useGradient ? {
            type: options.gradientType,
            rotation: 45,
            colorStops: [
              { offset: 0, color: options.fgColor },
              { offset: 1, color: options.gradientColor2 }
            ]
          } : undefined
        },
        backgroundOptions: {
          color: options.bgColor
        },
        cornersSquareOptions: {
          color: options.fgColor,
          type: options.cornersSquareType
        },
        cornersDotOptions: {
          color: options.fgColor,
          type: options.cornersDotType
        },
        qrOptions: {
          errorCorrectionLevel: options.errorCorrectionLevel
        },
        imageOptions: {
          margin: options.logoMargin
        }
      });
    }

    // Refresh raw data URL for downloads & print preview
    qrCodeInstanceRef.current.getRawData('png').then((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob as Blob);
        setQrDataUrl(url);
      }
    });
  }, [rawPayload, options]);

  // Geolocation grabber for transit
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latStr = pos.coords.latitude.toFixed(6);
        const lngStr = pos.coords.longitude.toFixed(6);
        if (activeTab === 'transit') {
          setTransit(prev => ({ ...prev, lat: latStr, lng: lngStr }));
        } else if (activeTab === 'uber') {
          setUber(prev => ({ ...prev, dropoffLat: latStr, dropoffLng: lngStr }));
        }
      },
      (err) => {
        alert(`Location access denied or unavailable: ${err.message}`);
      }
    );
  };

  // Contrast auto-fix
  const handleFixContrast = () => {
    setOptions(prev => ({
      ...prev,
      fgColor: '#0f172a',
      bgColor: '#ffffff',
      useGradient: false
    }));
  };

  // Downloads
  const handleDownloadPNG = () => {
    if (!qrCodeInstanceRef.current) return;
    qrCodeInstanceRef.current.download({
      name: `swissarmy-qr-${activeTab}-${Date.now()}`,
      extension: 'png'
    });
  };

  const handleDownloadSVG = () => {
    if (!qrCodeInstanceRef.current) return;
    qrCodeInstanceRef.current.download({
      name: `swissarmy-qr-${activeTab}-${Date.now()}`,
      extension: 'svg'
    });
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(rawPayload);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  // Build print template defaults based on active mode
  const printConfigDefaults: Partial<PrintTemplateConfig> = useMemo(() => {
    switch (activeTab) {
      case 'dual-action':
        return {
          type: 'standee-a5',
          title: `Pay ${dualAction.pn}`,
          subtitle: dualAction.tn || 'Scan with any UPI App (GPay, PhonePe, Paytm)',
          humanReadablePrimary: { label: 'UPI ID', value: dualAction.pa },
          humanReadableSecondary: dualAction.wa ? { label: 'WhatsApp Receipt', value: `+${dualAction.wa}` } : undefined
        };
      case 'wifi':
        return {
          type: 'tent-a4',
          title: 'Guest Wi-Fi Access',
          subtitle: 'Point your camera to connect automatically',
          humanReadablePrimary: { label: 'Network (SSID)', value: wifi.ssid },
          humanReadableSecondary: { label: 'Password', value: wifi.password || 'None (Open)' }
        };
      case 'servicenow':
        return {
          type: 'asset-tag-2x1',
          title: 'IT ASSET SERVICE TAG',
          subtitle: 'Scan to Report Incident in ServiceNow',
          humanReadablePrimary: { label: 'Instance', value: serviceNow.instance },
          humanReadableSecondary: { label: 'Table', value: serviceNow.table }
        };
      default:
        return {
          type: 'standee-a5',
          title: 'SwissArmy QR Code',
          subtitle: 'Scan with camera for instant action',
          humanReadablePrimary: { label: 'Action', value: activeTab.toUpperCase() }
        };
    }
  }, [activeTab, dualAction, wifi, serviceNow]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Category Nav Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('dual-action')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'dual-action'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Dual-Action (UPI + WhatsApp)</span>
        </button>

        <button
          onClick={() => setActiveTab('servicenow')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'servicenow'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ServiceNow Prefill</span>
        </button>

        <button
          onClick={() => setActiveTab('generic-form')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'generic-form'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Google / Custom Forms</span>
        </button>

        <button
          onClick={() => setActiveTab('transit')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'transit'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Google Maps Transit</span>
        </button>

        <button
          onClick={() => setActiveTab('uber')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'uber'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Uber Ride Intent</span>
        </button>

        <button
          onClick={() => setActiveTab('wa-catalog')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'wa-catalog'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>WhatsApp Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('wifi')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'wifi'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Wifi className="w-4 h-4" />
          <span>Wi-Fi Card</span>
        </button>

        <button
          onClick={() => setActiveTab('vcard')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'vcard'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>vCard Contact</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'calendar'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Event (.ics)</span>
        </button>

        <button
          onClick={() => setActiveTab('url')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'url'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Link className="w-4 h-4" />
          <span>Web URL</span>
        </button>
      </div>

      {/* Main Grid: Form Left, Real-time QR Preview & Linter Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Configuration Form */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* TAB 1: DUAL-ACTION HUB (UPI + WHATSAPP) */}
          {activeTab === 'dual-action' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Dual-Action Payment & WhatsApp Proof
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generates a dual-intent gate for seamless UPI settlement and instant WhatsApp proof.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenDualActionGate(dualAction)}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Gate</span>
                </button>
              </div>

              {/* Mode: Gate vs Direct UPI */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Dual-Action Landing Gate (`/pay`)</span>
                  <span className="text-[11px] text-slate-400">Directs scans to landing hub with both Pay & WhatsApp receipt buttons</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={encodeDualActionGate}
                    onChange={(e) => setEncodeDualActionGate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Payee UPI VPA <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={dualAction.pa}
                    onChange={(e) => setDualAction({ ...dualAction, pa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="merchant@upi or phone@okaxis"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Payee Business / Name <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={dualAction.pn}
                    onChange={(e) => setDualAction({ ...dualAction, pn: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                    placeholder="e.g. Apex Store"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Amount (INR) <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dualAction.am}
                    onChange={(e) => setDualAction({ ...dualAction, am: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="e.g. 250.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    WhatsApp Phone with Country Code
                  </label>
                  <input
                    type="text"
                    value={dualAction.wa}
                    onChange={(e) => setDualAction({ ...dualAction, wa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="e.g. 919876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Transaction Note / Ref
                </label>
                <input
                  type="text"
                  value={dualAction.tn}
                  onChange={(e) => setDualAction({ ...dualAction, tn: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  placeholder="e.g. Table #4 Lunch or Invoice #902"
                />
              </div>
            </div>
          )}

          {/* TAB 2: SERVICENOW PREFILL */}
          {activeTab === 'servicenow' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">ServiceNow Autofill Engine (FR-B1)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generates direct incident/ticket creation links with pre-filled fields (`sysparm_query`).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Instance Subdomain <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={serviceNow.instance}
                    onChange={(e) => setServiceNow({ ...serviceNow, instance: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="e.g. dev12345 or company"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Table
                  </label>
                  <input
                    type="text"
                    value={serviceNow.table}
                    onChange={(e) => setServiceNow({ ...serviceNow, table: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="incident"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    UI Target
                  </label>
                  <select
                    value={serviceNow.mode}
                    onChange={(e) => setServiceNow({ ...serviceNow, mode: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="platform">Platform UI (incident.do)</option>
                    <option value="portal">Service Portal (/sp catalog item)</option>
                  </select>
                </div>
              </div>

              {serviceNow.mode === 'portal' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Catalog Item `sys_id`
                  </label>
                  <input
                    type="text"
                    value={serviceNow.portalSysId || ''}
                    onChange={(e) => setServiceNow({ ...serviceNow, portalSysId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="32-character sys_id of Catalog Item"
                  />
                </div>
              )}

              {/* Dynamic Field Mapping */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Prefill Fields ({serviceNow.fields.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setServiceNow({
                      ...serviceNow,
                      fields: [...serviceNow.fields, { key: '', value: '' }]
                    })}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Field</span>
                  </button>
                </div>

                {serviceNow.fields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => {
                        const next = [...serviceNow.fields];
                        next[idx].key = e.target.value;
                        setServiceNow({ ...serviceNow, fields: next });
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
                      placeholder="field_name (e.g. cmdb_ci)"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        const next = [...serviceNow.fields];
                        next[idx].value = e.target.value;
                        setServiceNow({ ...serviceNow, fields: next });
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      placeholder="value"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = serviceNow.fields.filter((_, i) => i !== idx);
                        setServiceNow({ ...serviceNow, fields: next });
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: GENERIC FORM AUTOFILL */}
          {activeTab === 'generic-form' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Generic Form Autofill Engine (FR-B2)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Maps query parameters (`?entry.123=val` or `?name=val`) into web forms and surveys.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Form Base URL
                </label>
                <input
                  type="url"
                  value={genericForm.baseUrl}
                  onChange={(e) => setGenericForm({ ...genericForm, baseUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    URL Query Parameters ({genericForm.fields.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setGenericForm({
                      ...genericForm,
                      fields: [...genericForm.fields, { key: '', value: '' }]
                    })}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Parameter</span>
                  </button>
                </div>

                {genericForm.fields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => {
                        const next = [...genericForm.fields];
                        next[idx].key = e.target.value;
                        setGenericForm({ ...genericForm, fields: next });
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
                      placeholder="entry.12345678"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        const next = [...genericForm.fields];
                        next[idx].value = e.target.value;
                        setGenericForm({ ...genericForm, fields: next });
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      placeholder="default value"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = genericForm.fields.filter((_, i) => i !== idx);
                        setGenericForm({ ...genericForm, fields: next });
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TRANSIT & MAPS */}
          {activeTab === 'transit' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Google Maps Transit Directions (FR-C1)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Launches native Google Maps directly into public transit routing for venues & events.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Destination Latitude</label>
                  <input
                    type="text"
                    value={transit.lat}
                    onChange={(e) => setTransit({ ...transit, lat: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="37.774929"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Destination Longitude</label>
                  <input
                    type="text"
                    value={transit.lng}
                    onChange={(e) => setTransit({ ...transit, lng: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="-122.419416"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Venue / Destination Name</label>
                  <input
                    type="text"
                    value={transit.name || ''}
                    onChange={(e) => setTransit({ ...transit, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                    placeholder="e.g. City Convention Center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Travel Mode</label>
                  <select
                    value={transit.travelMode}
                    onChange={(e) => setTransit({ ...transit, travelMode: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="transit">Public Transit (Bus / Train / Subway)</option>
                    <option value="driving">Driving</option>
                    <option value="walking">Walking</option>
                    <option value="bicycling">Bicycling</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Use Current Device Location</span>
              </button>
            </div>
          )}

          {/* TAB 5: UBER RIDE INTENT */}
          {activeTab === 'uber' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Uber 1-Click Ride Intent (FR-C2)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Launches native Uber app with preset drop-off destination and pickup set to current location.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Drop-off Latitude</label>
                  <input
                    type="text"
                    value={uber.dropoffLat}
                    onChange={(e) => setUber({ ...uber, dropoffLat: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="37.7879"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Drop-off Longitude</label>
                  <input
                    type="text"
                    value={uber.dropoffLng}
                    onChange={(e) => setUber({ ...uber, dropoffLng: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="-122.4075"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Drop-off Location Nickname</label>
                  <input
                    type="text"
                    value={uber.dropoffNickname}
                    onChange={(e) => setUber({ ...uber, dropoffNickname: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                    placeholder="e.g. Terminal 2 Departure"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Use Current Device Location</span>
              </button>
            </div>
          )}

          {/* TAB 6: WHATSAPP CATALOG */}
          {activeTab === 'wa-catalog' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">WhatsApp Business Catalog Link (FR-C3)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Directs customers straight to your WhatsApp store products and catalog page.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Country Code</label>
                  <input
                    type="text"
                    value={waCatalog.countryCode}
                    onChange={(e) => setWaCatalog({ ...waCatalog, countryCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="91"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Business Phone Number</label>
                  <input
                    type="text"
                    value={waCatalog.phone}
                    onChange={(e) => setWaCatalog({ ...waCatalog, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="9876543210"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: WI-FI CARD */}
          {activeTab === 'wifi' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Guest Wi-Fi Access Card</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  1-tap connection for phones with automatic human-readable failover credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Network Name (SSID) <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={wifi.ssid}
                    onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="e.g. Office_Guest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Security / Encryption</label>
                  <select
                    value={wifi.encryption}
                    onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                    <option value="WEP">WEP (Legacy)</option>
                    <option value="nopass">None (Open Network)</option>
                  </select>
                </div>

                {wifi.encryption !== 'nopass' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Wi-Fi Password</label>
                    <input
                      type="text"
                      value={wifi.password || ''}
                      onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                      placeholder="Pre-Shared Key"
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={wifi.hidden}
                  onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>Hidden Network SSID</span>
              </label>
            </div>
          )}

          {/* TAB 8: VCARD */}
          {activeTab === 'vcard' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Digital Business Card (vCard 3.0)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allows contacts to immediately save your address card into Apple Contacts or Google Contacts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={vcard.firstName}
                    onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={vcard.lastName}
                    onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={vcard.phone || ''}
                    onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={vcard.email || ''}
                    onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company</label>
                  <input
                    type="text"
                    value={vcard.organization || ''}
                    onChange={(e) => setVcard({ ...vcard, organization: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={vcard.title || ''}
                    onChange={(e) => setVcard({ ...vcard, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: CALENDAR EVENT */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">RFC 5545 Calendar Event (.ics / VEVENT)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  1-tap calendar import directly into native calendar apps.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  value={calendar.title}
                  onChange={(e) => setCalendar({ ...calendar, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={calendar.startDate}
                    onChange={(e) => setCalendar({ ...calendar, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={calendar.endDate}
                    onChange={(e) => setCalendar({ ...calendar, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={calendar.location || ''}
                  onChange={(e) => setCalendar({ ...calendar, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  placeholder="Venue or Zoom URL"
                />
              </div>
            </div>
          )}

          {/* TAB 10: PLAIN URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Standard Web URL / Text</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Universal QR payload for direct web links or arbitrary text payloads.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target URL or Text</label>
                <textarea
                  rows={4}
                  value={rawUrl}
                  onChange={(e) => setRawUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          )}

          {/* VISUAL STYLING & CUSTOMIZATION ACCORDION */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                Visual Styling & Dot Matrix (FR-D1)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Foreground</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={options.fgColor}
                    onChange={(e) => setOptions({ ...options, fgColor: e.target.value })}
                    className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-[11px] text-slate-300">{options.fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={options.bgColor}
                    onChange={(e) => setOptions({ ...options, bgColor: e.target.value })}
                    className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-[11px] text-slate-300">{options.bgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dot Matrix Style</label>
                <select
                  value={options.dotsType}
                  onChange={(e) => setOptions({ ...options, dotsType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-300 text-xs"
                >
                  <option value="rounded">Rounded</option>
                  <option value="dots">Dots (Circular)</option>
                  <option value="classy">Classy</option>
                  <option value="classy-rounded">Classy Rounded</option>
                  <option value="square">Square (Classic)</option>
                  <option value="extra-rounded">Extra Rounded</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Corner Eye Style</label>
                <select
                  value={options.cornersSquareType}
                  onChange={(e) => setOptions({ ...options, cornersSquareType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-300 text-xs"
                >
                  <option value="extra-rounded">Extra Rounded</option>
                  <option value="dot">Circular Dot</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>

            {/* Error Correction Level */}
            <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-medium">Error Correction Level (ECL):</span>
              <div className="flex gap-1">
                {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setOptions({ ...options, errorCorrectionLevel: lvl })}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                      options.errorCorrectionLevel === lvl
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview, Scannability Linter & Action Exports */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main QR Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center relative">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Live Vector Rendering
            </span>

            {/* QR Canvas Container */}
            <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 flex items-center justify-center">
              <div ref={qrCodeContainerRef} />
            </div>

            {/* Scannability Linter Badge (FR-D2 & FR-D3) */}
            <div className="w-full mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400 font-medium">WCAG Contrast Scannability:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                  linter.isContrastSufficient
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : linter.isContrastWarning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {linter.contrastRatio}:1 {linter.isContrastSufficient ? 'PASS' : 'FAIL'}
                </span>
              </div>

              {/* Linter warnings / recommendations */}
              {linter.recommendations.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-[11px] space-y-1.5">
                  {linter.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-amber-300/90">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                  {(linter.isContrastFailing || linter.isContrastWarning) && (
                    <button
                      type="button"
                      onClick={handleFixContrast}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline font-medium block"
                    >
                      Auto-fix: Reset to optimal contrast (21:1)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="w-full grid grid-cols-2 gap-2.5 mt-5">
              <button
                onClick={handleDownloadPNG}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>PNG (1200px)</span>
              </button>

              <button
                onClick={handleDownloadSVG}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Vector SVG</span>
              </button>
            </div>

            {/* Module E: Physical Print-Ready PDF Studio Button */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="w-full mt-2.5 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Print-Ready Standee / Tent Card (PDF)</span>
            </button>

            {/* Copy Payload String & Quick Test */}
            <div className="w-full mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
              <button
                onClick={handleCopyPayload}
                className="hover:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied Payload!' : 'Copy Payload String'}</span>
              </button>

              {activeTab === 'dual-action' && (
                <button
                  onClick={() => onOpenDualActionGate(dualAction)}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <span>Test Gate</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview Studio Modal */}
      <Suspense fallback={null}>
        {isPrintModalOpen && (
          <PrintPreviewModal
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
            qrImageDataUrl={qrDataUrl}
            defaultConfig={printConfigDefaults}
          />
        )}
      </Suspense>
    </div>
  );
};
