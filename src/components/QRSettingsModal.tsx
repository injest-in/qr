import React from 'react';
import { X, RotateCcw, Palette, Check } from 'lucide-react';
import type { QROptions, DotType, CornerSquareType, CornerDotType, ErrorCorrectionLevel } from '../types';
import { DEFAULT_QR_OPTIONS } from '../types';

const PRESET_COLORS = [
  { name: 'Deep Slate', hex: '#0f172a' },
  { name: 'True Black', hex: '#000000' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Electric Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Crimson', hex: '#dc2626' }
];

interface QRSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: QROptions;
  onChange: (newOptions: QROptions) => void;
}

export const QRSettingsModal: React.FC<QRSettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  onChange
}) => {
  if (!isOpen) return null;

  const handleToggleTransparent = (checked: boolean) => {
    onChange({
      ...options,
      isTransparent: checked,
      bgColor: checked ? 'transparent' : '#ffffff'
    });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_QR_OPTIONS });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Customize QR Style</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Appearance & Dot Precision Settings</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Section 1: Background & Transparency */}
          <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-[11px]">
              Background & Canvas
            </h3>
            
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                  Transparent Background
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Allows QR to seamlessly overlay posters, flyers, and merchandise.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={options.isTransparent}
                  onChange={(e) => handleToggleTransparent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {!options.isTransparent && (
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="font-medium text-slate-700 dark:text-slate-300">Custom Background Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={options.bgColor === 'transparent' ? '#ffffff' : options.bgColor}
                    onChange={(e) => onChange({ ...options, bgColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{options.bgColor}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: QR Foreground Color */}
          <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-[11px]">
                QR Pattern Color
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={options.fgColor}
                  onChange={(e) => onChange({ ...options, fgColor: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{options.fgColor}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onChange({ ...options, fgColor: c.hex })}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
                    options.fgColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                  <span>{c.name}</span>
                  {options.fgColor.toLowerCase() === c.hex.toLowerCase() && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Pattern & Eye Shapes */}
          <div className="space-y-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-[11px]">
              Geometric Shapes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Dot Matrix Style
                </label>
                <select
                  value={options.dotsType}
                  onChange={(e) => onChange({ ...options, dotsType: e.target.value as DotType })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="dots">Dots (Circular) ★</option>
                  <option value="rounded">Rounded</option>
                  <option value="classy">Classy</option>
                  <option value="classy-rounded">Classy Rounded</option>
                  <option value="square">Square (Classic)</option>
                  <option value="extra-rounded">Extra Rounded</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Corner Eye (Outer)
                </label>
                <select
                  value={options.cornersSquareType}
                  onChange={(e) => onChange({ ...options, cornersSquareType: e.target.value as CornerSquareType })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="extra-rounded">Extra Rounded ★</option>
                  <option value="dot">Circular Dot</option>
                  <option value="square">Square</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Corner Eye (Inner)
                </label>
                <select
                  value={options.cornersDotType}
                  onChange={(e) => onChange({ ...options, cornersDotType: e.target.value as CornerDotType })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="dot">Circular Dot ★</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Error Correction Level */}
          <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Error Correction Level (ECL)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Higher levels allow scanning even if the code is smudged, torn, or partially obscured.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { lvl: 'L', label: 'Low (7%)', desc: 'Dense data' },
                { lvl: 'M', label: 'Medium (15%)', desc: 'Default' },
                { lvl: 'Q', label: 'Quartile (25%)', desc: 'Outdoor' },
                { lvl: 'H', label: 'High (30%)', desc: 'Resilient' },
              ].map(({ lvl, label }) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onChange({ ...options, errorCorrectionLevel: lvl as ErrorCorrectionLevel })}
                  className={`py-2 px-2 rounded-xl text-center border transition-all ${
                    options.errorCorrectionLevel === lvl
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold font-mono text-sm">{lvl}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Quiet Zone Margin */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Quiet Zone Margin</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">{options.margin} modules</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={options.margin}
              onChange={(e) => onChange({ ...options, margin: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
