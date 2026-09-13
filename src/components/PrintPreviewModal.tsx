import React, { useState } from 'react';
import { X, Printer, Download, Sparkles } from 'lucide-react';
import type { PrintTemplateConfig, PrintTemplateType } from '../types';
import { generatePrintPDF } from '../utils/pdfGenerator';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrImageDataUrl: string;
  defaultConfig: Partial<PrintTemplateConfig>;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  qrImageDataUrl,
  defaultConfig
}) => {
  const [templateType, setTemplateType] = useState<PrintTemplateType>(defaultConfig.type || 'tent-a4');
  const [title, setTitle] = useState(defaultConfig.title || 'Scan with Camera');
  const [subtitle, setSubtitle] = useState(defaultConfig.subtitle || 'Connect or Pay Instantly');
  const [primaryLabel, setPrimaryLabel] = useState(defaultConfig.humanReadablePrimary?.label || 'UPI / ID');
  const [primaryValue, setPrimaryValue] = useState(defaultConfig.humanReadablePrimary?.value || '');
  const [secondaryLabel, setSecondaryLabel] = useState(defaultConfig.humanReadableSecondary?.label || 'Backup Info');
  const [secondaryValue, setSecondaryValue] = useState(defaultConfig.humanReadableSecondary?.value || '');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const config: PrintTemplateConfig = {
        type: templateType,
        title,
        subtitle,
        humanReadablePrimary: primaryValue ? { label: primaryLabel, value: primaryValue } : undefined,
        humanReadableSecondary: secondaryValue ? { label: secondaryLabel, value: secondaryValue } : undefined
      };
      await generatePrintPDF(qrImageDataUrl, config);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Print-Ready Template Studio</h2>
              <p className="text-xs text-slate-400">Generate high-resolution physical standees, tent cards & asset labels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two columns (Controls on Left, Live Sheet Preview on Right) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto">
          {/* Controls Column */}
          <div className="md:col-span-6 space-y-5">
            {/* Format Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Paper & Layout Format</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTemplateType('tent-a4')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    templateType === 'tent-a4'
                      ? 'border-blue-500 bg-blue-950/40 text-white shadow'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200">A4 Tent Card</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Foldable double-face</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('standee-a5')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    templateType === 'standee-a5'
                      ? 'border-blue-500 bg-blue-950/40 text-white shadow'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200">A5 Standee</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Counter / desk stand</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateType('asset-tag-2x1')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    templateType === 'asset-tag-2x1'
                      ? 'border-blue-500 bg-blue-950/40 text-white shadow'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200">2" x 1" Label</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Asset / equipment tag</div>
                </button>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Header Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Scan to Pay / Wi-Fi Access"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle / Notice</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Free High-Speed Guest Wi-Fi"
                />
              </div>
            </div>

            {/* FR-E2: Human-Readable Failover Settings */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Human-Readable Failover Credentials (FR-E2)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Printed below the QR code in case the customer's phone camera lens is smudged or scratched.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Primary Label</label>
                  <input
                    type="text"
                    value={primaryLabel}
                    onChange={(e) => setPrimaryLabel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200"
                    placeholder="e.g. Network / UPI ID"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Primary Value</label>
                  <input
                    type="text"
                    value={primaryValue}
                    onChange={(e) => setPrimaryValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200 font-mono"
                    placeholder="e.g. CoffeeShop-5G"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Secondary Label</label>
                  <input
                    type="text"
                    value={secondaryLabel}
                    onChange={(e) => setSecondaryLabel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200"
                    placeholder="e.g. Password / Phone"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Secondary Value</label>
                  <input
                    type="text"
                    value={secondaryValue}
                    onChange={(e) => setSecondaryValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200 font-mono"
                    placeholder="e.g. guest2026"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : `Download Print-Ready PDF (${templateType.toUpperCase()})`}</span>
            </button>
          </div>

          {/* Live Visual Preview Sheet */}
          <div className="md:col-span-6 flex flex-col items-center justify-center bg-slate-950 p-6 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-3">
              Physical Print Simulation
            </span>

            {/* Simulation Card */}
            {templateType === 'tent-a4' && (
              <div className="w-64 bg-white text-slate-900 rounded-lg shadow-2xl p-4 border border-slate-300 flex flex-col items-center text-center relative">
                {/* Valley Fold dashed line */}
                <div className="w-full border-t border-dashed border-red-300 my-2 relative">
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-1 text-[8px] text-red-500 font-mono">
                    FOLD LINE
                  </span>
                </div>

                {/* Face Side */}
                <h3 className="font-bold text-sm text-slate-900 mt-2">{title}</h3>
                {subtitle && <p className="text-[10px] text-slate-500 mb-2">{subtitle}</p>}
                
                <img
                  src={qrImageDataUrl}
                  alt="QR preview"
                  className="w-28 h-28 my-1 rounded border border-slate-200"
                />

                {(primaryValue || secondaryValue) && (
                  <div className="w-full mt-2 p-1.5 bg-slate-100 rounded text-[9px] border border-slate-200 text-left font-mono">
                    {primaryValue && (
                      <div className="truncate font-semibold text-slate-800">
                        {primaryLabel}: <span className="font-normal">{primaryValue}</span>
                      </div>
                    )}
                    {secondaryValue && (
                      <div className="truncate text-slate-600">
                        {secondaryLabel}: <span className="font-normal">{secondaryValue}</span>
                      </div>
                    )}
                  </div>
                )}
                <span className="text-[7px] text-slate-400 mt-3">QR Print Engine</span>
              </div>
            )}

            {templateType === 'standee-a5' && (
              <div className="w-56 bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden border border-slate-300 flex flex-col items-center text-center">
                <div className="w-full bg-blue-600 py-2.5 px-2 text-white">
                  <h3 className="font-bold text-xs">{title}</h3>
                  {subtitle && <p className="text-[9px] text-blue-100 mt-0.5">{subtitle}</p>}
                </div>

                <div className="p-4 flex flex-col items-center">
                  <img
                    src={qrImageDataUrl}
                    alt="QR preview"
                    className="w-32 h-32 my-1 rounded border border-slate-200 p-1"
                  />

                  {(primaryValue || secondaryValue) && (
                    <div className="w-full mt-2 p-2 bg-slate-50 rounded text-[9px] border border-slate-200 text-center font-mono">
                      {primaryValue && (
                        <div className="truncate font-bold text-slate-800">
                          {primaryLabel}: {primaryValue}
                        </div>
                      )}
                      {secondaryValue && (
                        <div className="truncate text-slate-600 mt-0.5">
                          {secondaryLabel}: {secondaryValue}
                        </div>
                      )}
                    </div>
                  )}
                  <span className="text-[7px] text-slate-400 mt-3">Official Standee</span>
                </div>
              </div>
            )}

            {templateType === 'asset-tag-2x1' && (
              <div className="w-72 h-36 bg-white text-slate-900 rounded shadow-2xl border border-slate-400 p-2.5 flex items-center gap-3">
                <img
                  src={qrImageDataUrl}
                  alt="QR preview"
                  className="w-24 h-24 rounded border border-slate-300 shrink-0"
                />
                <div className="flex-1 text-left min-w-0">
                  <div className="text-[10px] font-bold text-slate-900 truncate uppercase">{title}</div>
                  <div className="text-[8px] text-slate-500 truncate">{subtitle}</div>
                  
                  {primaryValue && (
                    <div className="text-[9px] font-bold text-blue-600 truncate mt-1.5 font-mono">
                      {primaryLabel}: {primaryValue}
                    </div>
                  )}
                  {secondaryValue && (
                    <div className="text-[8px] text-slate-600 truncate font-mono">
                      {secondaryLabel}: {secondaryValue}
                    </div>
                  )}
                  <div className="text-[6px] text-slate-400 mt-2 italic">Do Not Remove Tag</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
