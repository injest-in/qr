import { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { 
  MessageSquare,
  Mail,
  Phone,
  Link as LinkIcon,
  CreditCard,
  Calendar,
  UserCheck,
  MapPin,
  Wifi,
  Layers,
  Settings,
  Compass,
  Store,
  Download,
  Copy,
  Check,
  Printer,
  AlertTriangle,
  ExternalLink,
  Palette,
  Sparkles,
  Sliders,
  Bookmark,
  SunMoon,
  Navigation
} from 'lucide-react';
import type { 
  QRMode, 
  ToolTier,
  QROptions, 
  DualActionPayload, 
  UPIPayload,
  WhatsAppPayload,
  EmailPayload,
  PhonePayload,
  LinkPayload,
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
  generateWhatsAppUrl,
  generateMailtoUrl,
  generateTelUrl,
  generateDualActionGateUrl,
  generateServiceNowUrl,
  generateGenericFormUrl,
  generateMapsTransitUrl,
  generateUberIntentUrl,
  generateWACatalogUrl,
  generateWiFiString,
  generateVCardString,
  generateICSString,
  serializeToolToHash,
  parseToolFromHash
} from '../utils/qrParsers';
import { detectUserCountry, splitPhoneNumber } from '../utils/countryCodes';
import { analyzeScannability } from '../utils/scannabilityLinter';
import { CountryCodeSelect } from './CountryCodeSelect';
import { QRSettingsModal } from './QRSettingsModal';
import { DEFAULT_QR_OPTIONS } from '../types';

const PrintPreviewModal = lazy(() => import('./PrintPreviewModal').then(m => ({ default: m.PrintPreviewModal })));

const QR_STORAGE_KEY = 'qr_styling_preferences';

function getStoredQROptions(): QROptions {
  try {
    const saved = localStorage.getItem(QR_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_QR_OPTIONS, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_QR_OPTIONS;
}

interface QRGeneratorProps {
  onOpenDualActionGate: (payload: DualActionPayload) => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ onOpenDualActionGate }) => {
  // Auto-detected default country (defaults to India +91)
  const defaultCountry = useMemo(() => detectUserCountry(), []);

  // Parse initial deeplink parameters from URL hash
  const initialHashData = useMemo(() => parseToolFromHash(), []);

  // Determine initial tool mode and tier
  const initialMode: QRMode = useMemo(() => {
    const t = initialHashData.tool;
    if (t === 'whatsapp') return 'whatsapp';
    if (t === 'email' || t === 'mail') return 'email';
    if (t === 'phone' || t === 'call') return 'phone';
    if (t === 'link' || t === 'url') return 'link';
    if (t === 'upi') return 'upi';
    if (t === 'calendar') return 'calendar';
    if (t === 'vcard') return 'vcard';
    if (t === 'maps' || t === 'transit') return 'maps';
    if (t === 'wifi') return 'wifi';
    if (t === 'pay-gate' || t === 'dual-action' || t === 'pay') return 'pay-gate';
    if (t === 'servicenow') return 'servicenow';
    if (t === 'form' || t === 'generic-form') return 'form';
    if (t === 'uber') return 'uber';
    if (t === 'catalog' || t === 'wa-catalog') return 'catalog';
    return 'whatsapp'; // Default initial tool is Simple: WhatsApp
  }, [initialHashData.tool]);

  const [activeTab, setActiveTab] = useState<QRMode>(initialMode);

  // Active Tier derived directly from activeTab
  const activeTier: ToolTier = useMemo(() => {
    if (['whatsapp', 'email', 'phone', 'link', 'upi'].includes(activeTab)) return 'simple';
    if (['calendar', 'vcard', 'maps', 'wifi'].includes(activeTab)) return 'medium';
    return 'advanced';
  }, [activeTab]);

  // FORM STATES (Empty inputs by default, or populated from URL hash)
  const [whatsapp, setWhatsapp] = useState<WhatsAppPayload>(() => {
    const p = initialHashData.params;
    const phoneVal = p.phone || p.num || '';
    const { dialCode, localNumber } = splitPhoneNumber(phoneVal, defaultCountry);
    return {
      countryCode: p.cc ? (p.cc.startsWith('+') ? p.cc : `+${p.cc}`) : dialCode,
      phone: localNumber || phoneVal.replace(/[^0-9]/g, ''),
      message: p.msg || p.text || ''
    };
  });

  const [email, setEmail] = useState<EmailPayload>(() => {
    const p = initialHashData.params;
    return {
      to: p.to || p.email || '',
      subject: p.sub || p.subject || '',
      body: p.body || p.msg || ''
    };
  });

  const [phone, setPhone] = useState<PhonePayload>(() => {
    const p = initialHashData.params;
    const phoneVal = p.num || p.phone || '';
    const { dialCode, localNumber } = splitPhoneNumber(phoneVal, defaultCountry);
    return {
      countryCode: p.cc ? (p.cc.startsWith('+') ? p.cc : `+${p.cc}`) : dialCode,
      phone: localNumber || phoneVal.replace(/[^0-9]/g, '')
    };
  });

  const [link, setLink] = useState<LinkPayload>(() => {
    const p = initialHashData.params;
    return { url: p.url || p.link || '' };
  });

  const [upi, setUpi] = useState<UPIPayload>(() => {
    const p = initialHashData.params;
    return {
      pa: p.pa || '',
      pn: p.pn || '',
      am: p.am || '',
      tn: p.tn || ''
    };
  });

  const [calendar, setCalendar] = useState<CalendarPayload>(() => {
    const p = initialHashData.params;
    return {
      title: p.title || '',
      startDate: p.start || '',
      endDate: p.end || '',
      location: p.loc || '',
      description: p.desc || ''
    };
  });

  const [vcard, setVcard] = useState<VCardPayload>(() => {
    const p = initialHashData.params;
    return {
      firstName: p.fn || '',
      lastName: p.ln || '',
      phone: p.tel || p.phone || '',
      email: p.em || p.email || '',
      organization: p.org || '',
      title: p.title || '',
      url: p.url || '',
      address: p.adr || ''
    };
  });

  const [maps, setMaps] = useState<TransitPayload>(() => {
    const p = initialHashData.params;
    return {
      lat: p.lat || '',
      lng: p.lng || '',
      name: p.name || '',
      travelMode: (p.mode as any) || 'transit'
    };
  });

  const [wifi, setWifi] = useState<WiFiPayload>(() => {
    const p = initialHashData.params;
    return {
      ssid: p.ssid || '',
      password: p.p || p.pass || '',
      encryption: (p.t as any) || 'WPA',
      hidden: p.h === '1' || p.h === 'true'
    };
  });

  const [dualAction, setDualAction] = useState<DualActionPayload>(() => {
    const p = initialHashData.params;
    return {
      pa: p.pa || '',
      pn: p.pn || '',
      am: p.am || '',
      tn: p.tn || '',
      wa: p.wa || ''
    };
  });
  const [dualActionCC, setDualActionCC] = useState<string>(() => {
    const p = initialHashData.params;
    if (p.wa) {
      const { dialCode } = splitPhoneNumber(p.wa, defaultCountry);
      return dialCode;
    }
    return defaultCountry.dialCode;
  });

  const [serviceNow, setServiceNow] = useState<ServiceNowPayload>(() => {
    const p = initialHashData.params;
    return {
      instance: p.instance || '',
      table: p.table || 'incident',
      mode: (p.mode as any) || 'platform',
      portalSysId: p.sys_id || '',
      fields: []
    };
  });

  const [genericForm, setGenericForm] = useState<GenericFormPayload>(() => {
    const p = initialHashData.params;
    return {
      baseUrl: p.url || '',
      fields: []
    };
  });

  const [uber, setUber] = useState<UberPayload>(() => {
    const p = initialHashData.params;
    return {
      dropoffLat: p.lat || '',
      dropoffLng: p.lng || '',
      dropoffNickname: p.nick || ''
    };
  });

  const [waCatalog, setWaCatalog] = useState<WhatsAppCatalogPayload>(() => {
    const p = initialHashData.params;
    return {
      countryCode: p.cc ? p.cc.replace(/[^0-9]/g, '') : defaultCountry.dialCode.replace('+', ''),
      phone: p.phone || ''
    };
  });

  // QR Visual Customization & Persistence
  const [options, setOptions] = useState<QROptions>(getStoredQROptions);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const qrCodeContainerRef = useRef<HTMLDivElement | null>(null);
  const qrCodeInstanceRef = useRef<QRCodeStyling | null>(null);

  // Save options to localStorage when updated
  const handleOptionsChange = (newOptions: QROptions) => {
    setOptions(newOptions);
    try {
      localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(newOptions));
    } catch {
      // ignore
    }
  };

  // Quick Invert Foreground (Dark / Light) for high contrast
  const handleQuickToggleFg = () => {
    const isDark = options.fgColor === '#0f172a' || options.fgColor === '#000000';
    handleOptionsChange({
      ...options,
      fgColor: isDark ? '#ffffff' : '#0f172a'
    });
  };

  // Compute live raw string payload
  const rawPayload = useMemo(() => {
    switch (activeTab) {
      case 'whatsapp': {
        const fullPhone = `${whatsapp.countryCode.replace(/[^0-9]/g, '')}${whatsapp.phone.replace(/[^0-9]/g, '')}`;
        return fullPhone ? generateWhatsAppUrl(fullPhone, whatsapp.message) : '';
      }
      case 'email':
        return email.to ? generateMailtoUrl(email.to, email.subject, email.body) : '';
      case 'phone': {
        const fullPhone = `${phone.countryCode.replace(/[^0-9]/g, '')}${phone.phone.replace(/[^0-9]/g, '')}`;
        return fullPhone ? generateTelUrl(`+${fullPhone}`) : '';
      }
      case 'link':
        return link.url.trim();
      case 'upi':
        return upi.pa || upi.pn ? generateUPIUrl(upi) : '';
      case 'calendar':
        return calendar.title || calendar.startDate ? generateICSString(calendar) : '';
      case 'vcard':
        return generateVCardString(vcard);
      case 'maps':
        return maps.lat && maps.lng ? generateMapsTransitUrl(maps) : '';
      case 'wifi':
        return wifi.ssid ? generateWiFiString(wifi) : '';
      case 'pay-gate':
        return dualAction.pa || dualAction.pn ? generateDualActionGateUrl(dualAction) : '';
      case 'servicenow':
        return serviceNow.instance ? generateServiceNowUrl(serviceNow) : '';
      case 'form':
        return genericForm.baseUrl ? generateGenericFormUrl(genericForm) : '';
      case 'uber':
        return uber.dropoffLat && uber.dropoffLng ? generateUberIntentUrl(uber) : '';
      case 'catalog':
        return waCatalog.phone ? generateWACatalogUrl(waCatalog) : '';
      default:
        return '';
    }
  }, [
    activeTab,
    whatsapp,
    email,
    phone,
    link,
    upi,
    calendar,
    vcard,
    maps,
    wifi,
    dualAction,
    serviceNow,
    genericForm,
    uber,
    waCatalog
  ]);

  // Fallback payload when form is empty: Clean link to injest.in/qr
  const effectivePayload = rawPayload || 'https://injest.in/qr/';

  // Sync state to URL hash for instant bookmarking (debounced)
  const syncHashToUrl = useCallback(() => {
    let params: Record<string, string | number | boolean | undefined> = {};

    switch (activeTab) {
      case 'whatsapp':
        params = { cc: whatsapp.countryCode, phone: whatsapp.phone, msg: whatsapp.message };
        break;
      case 'email':
        params = { to: email.to, sub: email.subject, body: email.body };
        break;
      case 'phone':
        params = { cc: phone.countryCode, num: phone.phone };
        break;
      case 'link':
        params = { url: link.url };
        break;
      case 'upi':
        params = { pa: upi.pa, pn: upi.pn, am: upi.am, tn: upi.tn };
        break;
      case 'calendar':
        params = { title: calendar.title, start: calendar.startDate, end: calendar.endDate, loc: calendar.location, desc: calendar.description };
        break;
      case 'vcard':
        params = { fn: vcard.firstName, ln: vcard.lastName, tel: vcard.phone, em: vcard.email, org: vcard.organization, title: vcard.title, url: vcard.url, adr: vcard.address };
        break;
      case 'maps':
        params = { lat: maps.lat, lng: maps.lng, name: maps.name, mode: maps.travelMode };
        break;
      case 'wifi':
        params = { ssid: wifi.ssid, p: wifi.password, t: wifi.encryption, h: wifi.hidden ? '1' : undefined };
        break;
      case 'pay-gate':
        params = { pa: dualAction.pa, pn: dualAction.pn, am: dualAction.am, tn: dualAction.tn, wa: dualAction.wa };
        break;
      case 'servicenow':
        params = { instance: serviceNow.instance, table: serviceNow.table, mode: serviceNow.mode };
        break;
      case 'form':
        params = { url: genericForm.baseUrl };
        break;
      case 'uber':
        params = { lat: uber.dropoffLat, lng: uber.dropoffLng, nick: uber.dropoffNickname };
        break;
      case 'catalog':
        params = { cc: waCatalog.countryCode, phone: waCatalog.phone };
        break;
    }

    const hashString = serializeToolToHash(activeTab, params);
    if (window.location.hash !== hashString) {
      window.history.replaceState(null, '', hashString);
    }
  }, [
    activeTab,
    whatsapp,
    email,
    phone,
    link,
    upi,
    calendar,
    vcard,
    maps,
    wifi,
    dualAction,
    serviceNow,
    genericForm,
    uber,
    waCatalog
  ]);

  useEffect(() => {
    const timer = setTimeout(syncHashToUrl, 250);
    return () => clearTimeout(timer);
  }, [syncHashToUrl]);

  // Scannability & Contrast Linter Analysis
  const linter = useMemo(() => {
    const bgForLinter = options.isTransparent ? '#ffffff' : options.bgColor;
    return analyzeScannability(
      options.fgColor,
      bgForLinter,
      effectivePayload.length,
      options.errorCorrectionLevel
    );
  }, [options.fgColor, options.bgColor, options.isTransparent, effectivePayload.length, options.errorCorrectionLevel]);

  // Initialize and update QRCodeStyling
  useEffect(() => {
    const backgroundOptionColor = options.isTransparent ? 'transparent' : options.bgColor;

    if (!qrCodeInstanceRef.current) {
      qrCodeInstanceRef.current = new QRCodeStyling({
        width: 320,
        height: 320,
        data: effectivePayload,
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
          color: backgroundOptionColor
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
        data: effectivePayload,
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
          color: backgroundOptionColor
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
  }, [effectivePayload, options]);

  // Geolocation grabber for Maps & Uber
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latStr = pos.coords.latitude.toFixed(6);
        const lngStr = pos.coords.longitude.toFixed(6);
        if (activeTab === 'maps') {
          setMaps(prev => ({ ...prev, lat: latStr, lng: lngStr }));
        } else if (activeTab === 'uber') {
          setUber(prev => ({ ...prev, dropoffLat: latStr, dropoffLng: lngStr }));
        }
      },
      (err) => {
        alert(`Location access denied: ${err.message}`);
      }
    );
  };

  // Downloads
  const handleDownloadPNG = () => {
    if (!qrCodeInstanceRef.current) return;
    qrCodeInstanceRef.current.download({
      name: `qr-${activeTab}-${Date.now()}`,
      extension: 'png'
    });
  };

  const handleDownloadSVG = () => {
    if (!qrCodeInstanceRef.current) return;
    qrCodeInstanceRef.current.download({
      name: `qr-${activeTab}-${Date.now()}`,
      extension: 'svg'
    });
  };

  // Copy Bookmarkable Link
  const handleCopyBookmarkLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  // Copy Raw String Payload
  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(effectivePayload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch {
      // fallback
    }
  };

  // Build print template defaults
  const printConfigDefaults: Partial<PrintTemplateConfig> = useMemo(() => {
    switch (activeTab) {
      case 'upi':
      case 'pay-gate':
        return {
          type: 'standee-a5',
          title: upi.pn || dualAction.pn || 'Scan to Pay',
          subtitle: upi.tn || dualAction.tn || 'Scan with GPay, PhonePe, Paytm, or any UPI App',
          humanReadablePrimary: { label: 'UPI ID', value: upi.pa || dualAction.pa || 'Merchant UPI' },
          humanReadableSecondary: dualAction.wa ? { label: 'WhatsApp Receipt', value: `+${dualAction.wa}` } : undefined
        };
      case 'wifi':
        return {
          type: 'tent-a4',
          title: 'Guest Wi-Fi Access',
          subtitle: 'Point your phone camera to connect instantly',
          humanReadablePrimary: { label: 'Network (SSID)', value: wifi.ssid || 'Guest Wi-Fi' },
          humanReadableSecondary: { label: 'Password', value: wifi.password || 'Open Network' }
        };
      case 'whatsapp':
        return {
          type: 'standee-a5',
          title: 'Chat with Us on WhatsApp',
          subtitle: 'Scan to message our team directly',
          humanReadablePrimary: { label: 'Phone', value: `${whatsapp.countryCode} ${whatsapp.phone}` }
        };
      default:
        return {
          type: 'standee-a5',
          title: 'QR Code',
          subtitle: 'Point your camera to open',
          humanReadablePrimary: { label: 'Action', value: activeTab.toUpperCase() }
        };
    }
  }, [activeTab, upi, dualAction, wifi, whatsapp]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4">
      {/* Tier Selector: Simple | Business & Place | Advanced */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div data-tour="tiers" className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (!['whatsapp', 'email', 'phone', 'link', 'upi'].includes(activeTab)) {
                setActiveTab('whatsapp');
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTier === 'simple'
                ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            ⚡ Simple Tools
          </button>

          <button
            type="button"
            onClick={() => {
              if (!['calendar', 'vcard', 'maps', 'wifi'].includes(activeTab)) {
                setActiveTab('wifi');
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTier === 'medium'
                ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🏢 Business & Place
          </button>

          <button
            type="button"
            onClick={() => {
              if (!['pay-gate', 'servicenow', 'form', 'uber', 'catalog'].includes(activeTab)) {
                setActiveTab('pay-gate');
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTier === 'advanced'
                ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🚀 Advanced Tools
          </button>
        </div>

        {/* Bookmarking & Settings Quick Bar */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            data-tour="bookmark"
            type="button"
            onClick={handleCopyBookmarkLink}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Bookmark or share this QR link with pre-filled inputs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Bookmark className="w-3.5 h-3.5 text-blue-500" />}
            <span>{copiedLink ? 'Link Copied!' : 'Bookmark / Share'}</span>
          </button>

          <button
            data-tour="customize"
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Style</span>
          </button>
        </div>
      </div>

      {/* Tool Tabs within Active Tier */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {activeTier === 'simple' && (
          <>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'email'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Mail to</span>
            </button>

            <button
              onClick={() => setActiveTab('phone')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'phone'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Call to</span>
            </button>

            <button
              onClick={() => setActiveTab('link')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'link'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Website Link</span>
            </button>

            <button
              onClick={() => setActiveTab('upi')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'upi'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>UPI Payment</span>
            </button>
          </>
        )}

        {activeTier === 'medium' && (
          <>
            <button
              onClick={() => setActiveTab('wifi')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'wifi'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span>Guest Wi-Fi</span>
            </button>

            <button
              onClick={() => setActiveTab('vcard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'vcard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Business Card (vCard)</span>
            </button>

            <button
              onClick={() => setActiveTab('maps')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'maps'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Google Maps Directions</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar Event</span>
            </button>
          </>
        )}

        {activeTier === 'advanced' && (
          <>
            <button
              onClick={() => setActiveTab('pay-gate')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'pay-gate'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay via UPI + WhatsApp Receipt</span>
            </button>

            <button
              onClick={() => setActiveTab('servicenow')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'servicenow'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>IT Ticket (ServiceNow)</span>
            </button>

            <button
              onClick={() => setActiveTab('form')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'form'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Form Prefill</span>
            </button>

            <button
              onClick={() => setActiveTab('uber')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'uber'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Uber Ride</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'catalog'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Store Catalog</span>
            </button>
          </>
        )}
      </div>

      {/* Main Grid: Form Inputs Left, Real-time QR Preview & Linter Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Configuration Form */}
        <div data-tour="inputs" className="lg:col-span-7 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-slate-900 dark:text-slate-100">
          
          {/* TOOL 1: WHATSAPP CHAT */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Chat</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Directly opens a WhatsApp chat with your number and an optional pre-filled greeting message.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Phone Number
                </label>
                <div className="flex gap-2">
                  <CountryCodeSelect
                    value={whatsapp.countryCode}
                    onChange={(dialCode) => setWhatsapp({ ...whatsapp, countryCode: dialCode })}
                    className="w-36"
                  />
                  <input
                    type="tel"
                    value={whatsapp.phone}
                    onChange={(e) => setWhatsapp({ ...whatsapp, phone: e.target.value.replace(/[^0-9]/g, '') })}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pre-filled Message <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={whatsapp.message || ''}
                  onChange={(e) => setWhatsapp({ ...whatsapp, message: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Hi, I would like to inquire about your services..."
                />
              </div>
            </div>
          )}

          {/* TOOL 2: EMAIL */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Mail className="w-4 h-4" />
                  <span>Mail to (Email)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Opens user's default email client with recipient, subject, and draft message ready to send.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={email.to}
                  onChange={(e) => setEmail({ ...email, to: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. support@yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject Line <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={email.subject || ''}
                  onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Order Inquiry or Support Request"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message Body <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={email.body || ''}
                  onChange={(e) => setEmail({ ...email, body: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Hello, I am writing to ask about..."
                />
              </div>
            </div>
          )}

          {/* TOOL 3: PHONE CALL */}
          {activeTab === 'phone' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Phone className="w-4 h-4" />
                  <span>Call to (Phone Call)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Allows callers to immediately dial your telephone number with a single scan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <CountryCodeSelect
                    value={phone.countryCode}
                    onChange={(dialCode) => setPhone({ ...phone, countryCode: dialCode })}
                    className="w-36"
                  />
                  <input
                    type="tel"
                    value={phone.phone}
                    onChange={(e) => setPhone({ ...phone, phone: e.target.value.replace(/[^0-9]/g, '') })}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TOOL 4: WEBSITE LINK */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <LinkIcon className="w-4 h-4" />
                  <span>Website Link</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Universal link that immediately opens your homepage, menu, portfolio, or landing page.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => setLink({ url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          )}

          {/* TOOL 5: UPI PAYMENT */}
          {activeTab === 'upi' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <CreditCard className="w-4 h-4" />
                  <span>UPI Payment (Direct Settlement)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Standard direct UPI payment intent for any app (Google Pay, PhonePe, Paytm, BHIM, Navi).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payee UPI ID (VPA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={upi.pa}
                    onChange={(e) => setUpi({ ...upi, pa: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. shop@upi or 9876543210@paytm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payee / Merchant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={upi.pn}
                    onChange={(e) => setUpi({ ...upi, pn: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Artisan Cafe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Amount in ₹ <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={upi.am || ''}
                    onChange={(e) => setUpi({ ...upi, am: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 150.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Note <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={upi.tn || ''}
                    onChange={(e) => setUpi({ ...upi, tn: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Bill #1024 or Coffee"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TOOL 6: GUEST WI-FI */}
          {activeTab === 'wifi' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Wifi className="w-4 h-4" />
                  <span>Guest Wi-Fi Card</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Allows customers or office guests to automatically connect without typing long complex passwords.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifi.ssid}
                    onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. CoffeeShop_Guest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Security / Encryption
                  </label>
                  <select
                    value={wifi.encryption}
                    onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                    <option value="WEP">WEP (Legacy)</option>
                    <option value="nopass">None (Open Network)</option>
                  </select>
                </div>

                {wifi.encryption !== 'nopass' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Wi-Fi Password
                    </label>
                    <input
                      type="text"
                      value={wifi.password || ''}
                      onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. SecretGuestPass123"
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={wifi.hidden}
                  onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })}
                  className="rounded bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>Hidden Network SSID</span>
              </label>
            </div>
          )}

          {/* TOOL 7: VCARD BUSINESS CARD */}
          {activeTab === 'vcard' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <UserCheck className="w-4 h-4" />
                  <span>Digital Business Card (vCard 3.0)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Allows people to immediately save your contact card into Apple Contacts or Google Contacts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={vcard.firstName}
                    onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    placeholder="e.g. Alex"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={vcard.lastName}
                    onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    placeholder="e.g. Morgan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={vcard.phone || ''}
                    onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={vcard.email || ''}
                    onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    placeholder="e.g. alex@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={vcard.organization || ''}
                    onChange={(e) => setVcard({ ...vcard, organization: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={vcard.title || ''}
                    onChange={(e) => setVcard({ ...vcard, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    placeholder="e.g. Lead Architect"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TOOL 8: GOOGLE MAPS DIRECTIONS */}
          {activeTab === 'maps' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <MapPin className="w-4 h-4" />
                  <span>Google Maps Directions</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Launches Google Maps with turn-by-turn navigation directly to your destination.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={maps.lat}
                    onChange={(e) => setMaps({ ...maps, lat: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    placeholder="e.g. 12.9716"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={maps.lng}
                    onChange={(e) => setMaps({ ...maps, lng: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    placeholder="e.g. 77.5946"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Destination Name</label>
                  <input
                    type="text"
                    value={maps.name || ''}
                    onChange={(e) => setMaps({ ...maps, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    placeholder="e.g. Downtown Flagship Store"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Default Travel Mode</label>
                  <select
                    value={maps.travelMode}
                    onChange={(e) => setMaps({ ...maps, travelMode: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="transit">Public Transit</option>
                    <option value="driving">Driving</option>
                    <option value="walking">Walking</option>
                    <option value="bicycling">Bicycling</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-500" />
                <span>Use My Current Device Location</span>
              </button>
            </div>
          )}

          {/* TOOL 9: CALENDAR EVENT */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Calendar className="w-4 h-4" />
                  <span>Calendar Event (.ics / VEVENT)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  1-tap calendar import directly into native Apple Calendar, Google Calendar, or Outlook.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  value={calendar.title}
                  onChange={(e) => setCalendar({ ...calendar, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  placeholder="e.g. Product Launch Keynote or Annual Meetup"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={calendar.startDate}
                    onChange={(e) => setCalendar({ ...calendar, startDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={calendar.endDate}
                    onChange={(e) => setCalendar({ ...calendar, endDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Location <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={calendar.location || ''}
                  onChange={(e) => setCalendar({ ...calendar, location: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  placeholder="e.g. Main Auditorium or Zoom Link"
                />
              </div>
            </div>
          )}

          {/* TOOL 10: PAY VIA UPI + WHATSAPP RECEIPT (DUAL-ACTION GATE) */}
          {activeTab === 'pay-gate' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Pay via UPI + WhatsApp Receipt</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Triggers native UPI payment first, then directs customer to send proof on WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenDualActionGate(dualAction)}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Gate</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payee UPI ID (VPA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dualAction.pa}
                    onChange={(e) => setDualAction({ ...dualAction, pa: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    placeholder="e.g. merchant@upi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Merchant / Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dualAction.pn}
                    onChange={(e) => setDualAction({ ...dualAction, pn: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    placeholder="e.g. Corner Grocery"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Amount in ₹ <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={dualAction.am || ''}
                    onChange={(e) => setDualAction({ ...dualAction, am: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    placeholder="e.g. 250.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Order / Bill Note <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={dualAction.tn || ''}
                    onChange={(e) => setDualAction({ ...dualAction, tn: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    placeholder="e.g. Order #1042"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Merchant WhatsApp Phone (Receipt Proof Destination)
                  </label>
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      value={dualActionCC}
                      onChange={(dialCode) => {
                        setDualActionCC(dialCode);
                        const rawPhone = (dualAction.wa || '').replace(/^[0-9]{1,4}/, '');
                        setDualAction({ ...dualAction, wa: `${dialCode.replace('+', '')}${rawPhone}` });
                      }}
                      className="w-36"
                    />
                    <input
                      type="tel"
                      value={dualAction.wa ? dualAction.wa.replace(/^[0-9]{1,4}/, '') : ''}
                      onChange={(e) => {
                        const cleanDigits = e.target.value.replace(/[^0-9]/g, '');
                        setDualAction({
                          ...dualAction,
                          wa: `${dualActionCC.replace('+', '')}${cleanDigits}`
                        });
                      }}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TOOL 11: SERVICENOW */}
          {activeTab === 'servicenow' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Layers className="w-4 h-4" />
                  <span>ServiceNow Incident & Catalog Prefill</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Prefills fields into ServiceNow records or Service Portal catalog items without authentication tokens.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ServiceNow Instance
                  </label>
                  <input
                    type="text"
                    value={serviceNow.instance}
                    onChange={(e) => setServiceNow({ ...serviceNow, instance: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    placeholder="e.g. dev12345 or company"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Table
                  </label>
                  <input
                    type="text"
                    value={serviceNow.table}
                    onChange={(e) => setServiceNow({ ...serviceNow, table: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    placeholder="incident"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TOOL 12: FORM PREFILL */}
          {activeTab === 'form' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Settings className="w-4 h-4" />
                  <span>Google / Custom Form Prefill</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Prefills answers or tracking tokens into Google Forms, Typeform, or custom survey URLs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Base Form URL
                </label>
                <input
                  type="url"
                  value={genericForm.baseUrl}
                  onChange={(e) => setGenericForm({ ...genericForm, baseUrl: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                />
              </div>
            </div>
          )}

          {/* TOOL 13: UBER RIDE INTENT */}
          {activeTab === 'uber' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Compass className="w-4 h-4" />
                  <span>Uber Ride Intent</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Opens Uber mobile app directly with pickup at user's current location and pre-selected drop-off coordinates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Drop-off Latitude</label>
                  <input
                    type="text"
                    value={uber.dropoffLat}
                    onChange={(e) => setUber({ ...uber, dropoffLat: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    placeholder="e.g. 37.7879"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Drop-off Longitude</label>
                  <input
                    type="text"
                    value={uber.dropoffLng}
                    onChange={(e) => setUber({ ...uber, dropoffLng: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    placeholder="e.g. -122.4075"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Destination Nickname</label>
                  <input
                    type="text"
                    value={uber.dropoffNickname}
                    onChange={(e) => setUber({ ...uber, dropoffNickname: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    placeholder="e.g. Terminal 2 Airport or Union Square"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-500" />
                <span>Use Current Location as Destination</span>
              </button>
            </div>
          )}

          {/* TOOL 14: WHATSAPP STORE CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Store className="w-4 h-4" />
                  <span>WhatsApp Business Store Catalog</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Directs shoppers directly into your WhatsApp Business product showcase catalog.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Business Phone
                </label>
                <div className="flex gap-2">
                  <CountryCodeSelect
                    value={`+${waCatalog.countryCode}`}
                    onChange={(dialCode) => setWaCatalog({ ...waCatalog, countryCode: dialCode.replace('+', '') })}
                    className="w-36"
                  />
                  <input
                    type="tel"
                    value={waCatalog.phone}
                    onChange={(e) => setWaCatalog({ ...waCatalog, phone: e.target.value.replace(/[^0-9]/g, '') })}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right: Live Preview, Scannability Linter & Action Exports */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main QR Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center relative text-slate-900 dark:text-slate-100">
            
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Live QR Vector
              </span>

              {/* Quick High Contrast Invert Toggle */}
              <button
                type="button"
                onClick={handleQuickToggleFg}
                className="text-[11px] font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors"
                title="Toggle QR code color between Dark and Light for high contrast"
              >
                <SunMoon className="w-3 h-3 text-blue-500" />
                <span>Invert Color</span>
              </button>
            </div>

            {/* QR Canvas Container with Transparent Checkerboard */}
            <div 
              data-tour="preview"
              className="p-4 qr-checkerboard rounded-2xl shadow-inner border border-slate-200 dark:border-slate-800 flex items-center justify-center relative group transition-colors"
              style={{
                backgroundColor: options.isTransparent ? '#ffffff' : options.bgColor
              }}
            >
              <div ref={qrCodeContainerRef} />
            </div>

            {/* Background notice */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>
                {options.isTransparent ? 'Transparent Background Active (High-Contrast White Base)' : `Custom Background: ${options.bgColor}`}
              </span>
            </div>

            {/* Scannability Linter Badge */}
            <div className="w-full mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Camera Readability:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                  linter.isContrastSufficient
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : linter.isContrastWarning
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                }`}>
                  {linter.contrastRatio}:1 {linter.isContrastSufficient ? 'PASS' : 'FAIL'}
                </span>
              </div>

              {/* Linter warnings / recommendations */}
              {linter.recommendations.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left text-[11px] space-y-1.5">
                  {linter.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="w-full grid grid-cols-2 gap-2.5 mt-5">
              <button
                onClick={handleDownloadPNG}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all active:scale-98 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={handleDownloadSVG}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Vector SVG</span>
              </button>
            </div>

            {/* Module E: Physical Print-Ready PDF Studio Button */}
            <button
              data-tour="print"
              onClick={() => setIsPrintModalOpen(true)}
              className="w-full mt-2.5 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-98 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print-Ready Standee / Tent Card (PDF)</span>
            </button>

            {/* Secondary Actions */}
            <div className="w-full mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleCopyPayload}
                className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPayload ? 'Copied Payload!' : 'Copy Payload'}</span>
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium transition-colors"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Customize Style</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Visual Customization Modal */}
      <QRSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        onChange={handleOptionsChange}
      />

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
