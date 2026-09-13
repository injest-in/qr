import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check } from 'lucide-react';

export interface TourStep {
  target: string;
  badge: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="tiers"]',
    badge: 'Step 1 of 6: Hierarchy',
    title: 'Ranked Tool Tiers',
    description: 'Switch between ⚡ Simple everyday tools (WhatsApp, Calls, Email, UPI), 🏢 Business cards & Wi-Fi, or 🚀 Advanced dual-action payment gates and ServiceNow tickets.'
  },
  {
    target: '[data-tour="bookmark"]',
    badge: 'Step 2 of 6: Deeplinks',
    title: 'Two-Way URL Bookmarking',
    description: 'Every field you type syncs into the URL hash in real time. Bookmark with Ctrl+D or click here to copy a permanent shareable link that restores this exact QR code.'
  },
  {
    target: '[data-tour="inputs"]',
    badge: 'Step 3 of 6: Clean Inputs',
    title: 'Empty States & Country Auto-Detection',
    description: 'All inputs start clean with helpful placeholders—no tedious backspacing required. Phone numbers automatically detect your country dial code (+91 default).'
  },
  {
    target: '[data-tour="preview"]',
    badge: 'Step 4 of 6: Rendering',
    title: 'High-Visibility QR Canvas',
    description: 'Live vector rendering with a 100% transparent background default. The preview box preserves a light high-contrast base across Light, Dark, and Auto modes so your code is always camera-ready.'
  },
  {
    target: '[data-tour="customize"]',
    badge: 'Step 5 of 6: Precision Tuning',
    title: 'Customize Style & Dot Shapes',
    description: 'Tweak dot matrix geometries (circular dots, rounded, classy), corner eye designs, background transparency, and Error Correction Levels (ECL).'
  },
  {
    target: '[data-tour="print"]',
    badge: 'Step 6 of 6: Physical Studio',
    title: 'Physical Print-Ready Standees (PDF)',
    description: 'Turn your QR into real-world signage! Generate 300 DPI vector PDFs for A4 table tents, A5 acrylic counter standees, or IT equipment asset tags with cut guides.'
  }
];

interface SpotlightTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
}

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const step = TOUR_STEPS[currentStep];

  // Dismiss tour and reliably store completion in localStorage
  const dismissTour = useCallback(() => {
    try {
      localStorage.setItem('qr_has_seen_tour', 'true');
    } catch {
      // ignore
    }
    setCurrentStep(0);
    onClose();
    if (onComplete) {
      onComplete();
    }
  }, [onClose, onComplete]);

  // Measure current position of target element
  const updateRect = useCallback(() => {
    if (!isOpen || !step) return;
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom
      });
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step]);

  // When step changes: scroll into view once and measure as scrolling progresses
  useEffect(() => {
    if (!isOpen || !step) return;
    const el = document.querySelector(step.target);
    if (el) {
      // Smooth scroll target to center of viewport
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });

      // Progressive measurements to track smooth scrolling accurately
      const timers = [
        setTimeout(updateRect, 10),
        setTimeout(updateRect, 60),
        setTimeout(updateRect, 150),
        setTimeout(updateRect, 300),
        setTimeout(updateRect, 500)
      ];

      return () => {
        timers.forEach(clearTimeout);
      };
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep, step, updateRect]);

  // Window scroll & resize listeners (read-only measurement, never triggering scrollIntoView)
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateRect();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep < TOUR_STEPS.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          dismissTour();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep(prev => prev - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updateRect, dismissTour, currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      dismissTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Crucial invariant: if not open, render nothing!
  if (!isOpen) {
    return null;
  }

  const padding = 8;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // Compute tooltip style: docked top/bottom on mobile, floating on desktop
  let cardStyle: React.CSSProperties = {};

  if (targetRect) {
    if (isMobile) {
      const targetCenterY = targetRect.top + targetRect.height / 2;
      const viewportCenterY = window.innerHeight / 2;

      if (targetCenterY < viewportCenterY) {
        // Target is in upper half: dock card at bottom
        cardStyle = {
          bottom: 16,
          left: 16,
          right: 16,
          maxWidth: 'calc(100vw - 32px)'
        };
      } else {
        // Target is in lower half: dock card at top
        cardStyle = {
          top: 16,
          left: 16,
          right: 16,
          maxWidth: 'calc(100vw - 32px)'
        };
      }
    } else {
      // Desktop positioning
      const cardWidth = 380;
      const cardHeight = 220;

      let top = targetRect.bottom + 14;
      if (targetRect.bottom + cardHeight + 20 >= window.innerHeight) {
        top = Math.max(16, targetRect.top - cardHeight - 14);
      }

      const left = Math.max(
        16,
        Math.min(targetRect.left, window.innerWidth - cardWidth - 16)
      );

      cardStyle = {
        top,
        left,
        maxWidth: cardWidth
      };
    }
  } else {
    // Fallback if target not yet found
    cardStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: 380
    };
  }

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden font-sans select-none animate-in fade-in duration-200"
      onClick={dismissTour}
    >
      {/* SVG Spotlight Mask */}
      {targetRect && (
        <svg className="fixed inset-0 w-full h-full pointer-events-none transition-all duration-300">
          <defs>
            <mask id="tour-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={Math.max(0, targetRect.left - padding)}
                y={Math.max(0, targetRect.top - padding)}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="14"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(2, 6, 23, 0.75)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>
      )}

      {/* Target Focus Ring Accent */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-2xl border-2 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all duration-150"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
          }}
        />
      )}

      {/* Floating Tour Tooltip Card */}
      <div
        className="fixed z-50 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 text-slate-900 dark:text-slate-100 transition-all duration-300 backdrop-blur-md pointer-events-auto"
        style={cardStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with step badge & prominent Skip Tour button */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-md">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
              {step.badge}
            </span>
          </div>

          {/* Prominent Skip Tour button */}
          <button
            type="button"
            onClick={dismissTour}
            className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Skip onboarding tour"
          >
            Skip Tour
          </button>
        </div>

        {/* Title & Body */}
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5">
          {step.title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Footer controls & progress dots */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Progress dots & text link */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-4 bg-blue-600'
                      : i < currentStep
                      ? 'w-1.5 bg-blue-400/50'
                      : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={dismissTour}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              Skip
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{isLast ? 'Got it!' : 'Next'}</span>
              {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
