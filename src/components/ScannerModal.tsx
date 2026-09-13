import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle
} from 'lucide-react';
import { parseDecodedQR } from '../utils/qrParsers';
import type { DecodedQRInfo } from '../utils/qrParsers';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffModeDefault?: boolean;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  staffModeDefault = false
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [isStaffMode, setIsStaffMode] = useState(staffModeDefault);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [decodedResult, setDecodedResult] = useState<DecodedQRInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);
  const readerElementId = 'qr-reader-container';

  useEffect(() => {
    setIsStaffMode(staffModeDefault);
  }, [staffModeDefault]);

  // Clean up scanner on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopCameraScanner();
      setDecodedResult(null);
      setErrorMessage(null);
    } else {
      if (activeTab === 'camera') {
        startCameraScanner();
      }
    }

    return () => {
      stopCameraScanner();
    };
  }, [isOpen, activeTab]);

  const startCameraScanner = async () => {
    setErrorMessage(null);
    try {
      if (scannerRef.current) {
        await stopCameraScanner();
      }

      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(readerElementId);
      scannerRef.current = scanner;

      setIsScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleSuccessDecode(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
    } catch (err: any) {
      console.warn('Camera scan failed to initialize:', err);
      setIsScanning(false);
      setErrorMessage(
        err?.message || 'Could not access camera. Please allow camera permissions or switch to File Upload.'
      );
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleSuccessDecode = (text: string) => {
    const parsed = parseDecodedQR(text);
    setDecodedResult(parsed);
    // Pause or stop camera once decoded
    stopCameraScanner();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('file-scanner-temp');
      const text = await scanner.scanFile(file, true);
      handleSuccessDecode(text);
      scanner.clear();
    } catch {
      setErrorMessage('Could not find or decode a QR code in the uploaded image.');
    }
  };

  const handleCopyField = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyAllJSON = async () => {
    if (!decodedResult) return;
    try {
      await navigator.clipboard.writeText(decodedResult.raw);
      setCopiedField('all_raw');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleRescan = () => {
    setDecodedResult(null);
    setErrorMessage(null);
    if (activeTab === 'camera') {
      startCameraScanner();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isStaffMode ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                QR Scanner
                {isStaffMode && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Staff Reverse-Ingestion Mode
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Decode QR codes & extract structured data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Staff Mode Toggle & Source Tabs */}
        <div className="px-5 pt-3 pb-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          {/* Tab selector */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => {
                setActiveTab('camera');
                setDecodedResult(null);
              }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'camera' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Live Camera
            </button>
            <button
              onClick={() => {
                stopCameraScanner();
                setActiveTab('upload');
              }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                activeTab === 'upload' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>
          </div>

          {/* FR-B3: Staff Reverse-Ingestion Toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isStaffMode}
              onChange={(e) => setIsStaffMode(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
            />
            <span className="font-medium">Staff Copy Blocks</span>
          </label>
        </div>

        {/* Main Body */}
        <div className="p-5">
          {/* Decoded Result View */}
          {decodedResult ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/20 text-blue-300 rounded">
                      {decodedResult.type.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-white">{decodedResult.title}</span>
                  </div>
                  <button
                    onClick={handleCopyAllJSON}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700"
                  >
                    {copiedField === 'all_raw' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'all_raw' ? 'Copied Raw' : 'Copy Raw'}</span>
                  </button>
                </div>

                {/* Parsed Fields for Staff Ingestion (FR-B3) */}
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                  {decodedResult.parsedFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">{field.key}</span>
                        <span className="text-slate-200 font-mono break-all font-medium select-all">{field.value}</span>
                      </div>
                      <button
                        onClick={() => handleCopyField(field.key, field.value)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1 text-[11px] shrink-0"
                        title="Copy field value for legacy portal"
                      >
                        {copiedField === field.key ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{copiedField === field.key ? 'Done' : 'Copy'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button if actionable URL */}
              {decodedResult.actionUrl && (
                <a
                  href={decodedResult.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow transition-colors"
                >
                  <span>{decodedResult.actionLabel || 'Execute Intent / Open URL'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Rescan Button */}
              <button
                onClick={handleRescan}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Scan Another QR Code
              </button>
            </div>
          ) : (
            /* Active Scanning Area */
            <div>
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {activeTab === 'camera' ? (
                <div>
                  <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 min-h-[280px] flex items-center justify-center">
                    <div id={readerElementId} className="w-full h-full" />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center mt-3">
                    Point camera at any QR code, UPI code, Wi-Fi standee, or ServiceNow label.
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-950/40 transition-colors">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-200 mb-1">Select or drag QR image here</p>
                  <p className="text-xs text-slate-500 mb-4">Supports PNG, JPG, WEBP, or SVG screenshot</p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors">
                    <span>Browse Files</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <div id="file-scanner-temp" className="hidden" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
