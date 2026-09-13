import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  MessageSquare, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Smartphone, 
  AlertCircle,
  ArrowRight,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DualActionPayload } from '../types';
import { generateUPIUrl, generateWhatsAppUrl } from '../utils/qrParsers';

interface DualActionGateProps {
  onBackToGenerator?: () => void;
  customPayload?: DualActionPayload;
}

export const DualActionGate: React.FC<DualActionGateProps> = ({ 
  onBackToGenerator, 
  customPayload 
}) => {
  const [copied, setCopied] = useState(false);
  const [deviceOS, setDeviceOS] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [shareSupported, setShareSupported] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Ingestion helper: parses from customPayload, search string, and hash string
  const parseParams = (): DualActionPayload => {
    if (customPayload) return customPayload;
    
    // Parse window.location.search
    const searchParams = new URLSearchParams(window.location.search);
    
    // Parse query params in window.location.hash (e.g. #/pay?pa=... or #pay?pa=...)
    let hashQuery = '';
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      hashQuery = hash.slice(qIndex + 1);
    }
    const hashParams = new URLSearchParams(hashQuery);

    return {
      pa: hashParams.get('pa') || searchParams.get('pa') || 'merchant@upi',
      pn: hashParams.get('pn') || searchParams.get('pn') || 'Merchant Store',
      am: hashParams.get('am') || searchParams.get('am') || '',
      tn: hashParams.get('tn') || searchParams.get('tn') || 'Order Payment',
      wa: hashParams.get('wa') || searchParams.get('wa') || '',
    };
  };

  const [payload, setPayload] = useState<DualActionPayload>(parseParams);

  useEffect(() => {
    if (customPayload) {
      setPayload(customPayload);
    } else {
      const handleHashOrUrlChange = () => {
        setPayload(parseParams());
      };
      window.addEventListener('hashchange', handleHashOrUrlChange);
      return () => window.removeEventListener('hashchange', handleHashOrUrlChange);
    }
  }, [customPayload]);

  useEffect(() => {
    // OS detection for fallback logic
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setDeviceOS('ios');
    } else if (/android/i.test(userAgent)) {
      setDeviceOS('android');
    } else {
      setDeviceOS('desktop');
    }

    // Web Share API Level 2 check
    if (typeof navigator.share === 'function') {
      setShareSupported(true);
    }
  }, []);

  const upiUrl = generateUPIUrl(payload);
  const receiptMessage = `Hello ${payload.pn}, I have initiated payment of ₹${payload.am || 'specified amount'} for "${payload.tn || 'services'}". Here is my confirmation.`;
  const whatsappUrl = payload.wa ? generateWhatsAppUrl(payload.wa, receiptMessage) : '';

  const handleCopyVPA = async () => {
    try {
      await navigator.clipboard.writeText(payload.pa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      setStatusMessage('UPI ID copied to clipboard!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Copy failed. Please manually select the UPI ID.');
    }
  };

  // FR-A2: Intent 1 Execution (UPI)
  const handlePay = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch {
      // ignore
    }

    // Trigger UPI intent
    window.location.href = upiUrl;

    // Show fallback help if on desktop or browser doesn't intercept
    setTimeout(() => {
      setStatusMessage('Opening your UPI app... If nothing opened, copy the UPI ID below to pay.');
    }, 1200);
  };

  // FR-A3: Intent 2 Execution (WhatsApp Receipt Proof)
  const handleWhatsApp = () => {
    if (!whatsappUrl) {
      setStatusMessage('No WhatsApp number was provided for this payment.');
      return;
    }
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // FR-A4: Web Share Level 2 Fallback
  const handleWebShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `Payment to ${payload.pn}`,
        text: `Paid ₹${payload.am || ''} to ${payload.pn} (${payload.pa}). Ref: ${payload.tn}`,
        url: window.location.href,
      });
      setStatusMessage('Share sheet opened successfully.');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStatusMessage('Could not open share menu.');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-8 flex flex-col items-center">
      {onBackToGenerator && (
        <button
          onClick={onBackToGenerator}
          className="self-start mb-6 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to QR Generator Hub
        </button>
      )}

      {/* Main Card */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 backdrop-blur-md relative overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-emerald-400 to-indigo-500" />

        {/* Header / Payee Info */}
        <div className="text-center mt-2 mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2.5 py-0.5 rounded-full">
            Dual-Action Pay Gate
          </span>
          <h1 className="text-2xl font-bold text-slate-100 mt-2">{payload.pn}</h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{payload.pa}</p>
        </div>

        {/* Amount Display */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-center mb-6">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Amount Due</span>
          <div className="text-3xl font-extrabold text-white mt-1">
            {payload.am ? (
              <>
                <span className="text-xl font-normal text-emerald-400 mr-1">₹</span>
                {Number(payload.am).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </>
            ) : (
              <span className="text-lg font-medium text-slate-300">Custom / Open Amount</span>
            )}
          </div>
          {payload.tn && (
            <div className="mt-2 text-xs text-slate-400 bg-slate-900/90 py-1 px-2.5 rounded-md inline-block max-w-full truncate">
              For: <span className="text-slate-200 font-medium">{payload.tn}</span>
            </div>
          )}
        </div>

        {/* Status / Alert Banner */}
        {statusMessage && (
          <div className="mb-5 p-3 rounded-lg bg-blue-950/80 border border-blue-800/80 text-xs text-blue-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Primary Intent 1: Pay via UPI */}
        <div className="space-y-3">
          <button
            onClick={handlePay}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
          >
            <Smartphone className="w-5 h-5" />
            <span>Pay Now with UPI App</span>
            <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
          </button>

          {/* Primary Intent 2: Send WhatsApp Proof */}
          {payload.wa && (
            <button
              onClick={handleWhatsApp}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
            >
              <MessageSquare className="w-5 h-5 text-emerald-100" />
              <span>Send WhatsApp Proof to Merchant</span>
              <ExternalLink className="w-4 h-4 ml-0.5 opacity-80" />
            </button>
          )}

          {/* Web Share Level 2 Fallback */}
          {shareSupported && (
            <button
              onClick={handleWebShare}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4 text-slate-300" />
              <span>Share Receipt / Link</span>
            </button>
          )}
        </div>

        {/* Manual VPA Copy Failover */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Manual VPA Failover</span>
            {deviceOS !== 'desktop' && (
              <span className="text-[11px] text-slate-500">Detected: {deviceOS.toUpperCase()}</span>
            )}
          </div>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2">
            <span className="font-mono text-xs text-slate-300 truncate flex-1 select-all px-1">
              {payload.pa}
            </span>
            <button
              onClick={handleCopyVPA}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded text-xs flex items-center gap-1 font-medium transition-colors"
              title="Copy VPA"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Zero-Persistence Privacy Guarantee */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>Zero-Persistence: No transaction data stored on servers</span>
        </div>
      </div>
    </div>
  );
};
