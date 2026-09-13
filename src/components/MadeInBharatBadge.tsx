import React from 'react';

interface MadeInBharatBadgeProps {
  variant?: 'pill' | 'footer' | 'inline';
  className?: string;
}

export const MadeInBharatBadge: React.FC<MadeInBharatBadgeProps> = ({ 
  variant = 'pill', 
  className = '' 
}) => {
  // Crisp vector representation of the Indian Flag with Ashoka Chakra
  const flagSvg = (
    <svg 
      className="w-4 h-2.5 rounded-[2px] overflow-hidden shadow-xs shrink-0 inline-block align-middle" 
      viewBox="0 0 30 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Flag of Bharat"
    >
      {/* Saffron Top Band */}
      <rect width="30" height="6.67" fill="#FF9933"/>
      {/* White Middle Band */}
      <rect y="6.67" width="30" height="6.67" fill="#FFFFFF"/>
      {/* Green Bottom Band */}
      <rect y="13.33" width="30" height="6.67" fill="#138808"/>
      {/* Ashoka Chakra in Navy Blue */}
      <circle cx="15" cy="10" r="2.3" stroke="#000080" strokeWidth="0.5" fill="none"/>
      <circle cx="15" cy="10" r="0.4" fill="#000080"/>
      {/* 24-spoke stylized radiating geometry */}
      <g stroke="#000080" strokeWidth="0.3" strokeLinecap="round">
        <line x1="15" y1="7.7" x2="15" y2="12.3" />
        <line x1="12.7" y1="10" x2="17.3" y2="10" />
        <line x1="13.37" y1="8.37" x2="16.63" y2="11.63" />
        <line x1="13.37" y1="11.63" x2="16.63" y2="8.37" />
        <line x1="14.12" y1="7.85" x2="15.88" y2="12.15" />
        <line x1="15.88" y1="7.85" x2="14.12" y2="12.15" />
        <line x1="12.85" y1="9.12" x2="17.15" y2="10.88" />
        <line x1="12.85" y1="10.88" x2="17.15" y2="9.12" />
      </g>
    </svg>
  );

  if (variant === 'footer') {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium ${className}`}>
        {flagSvg}
        <span>Made with pride in <span className="font-bold text-slate-800 dark:text-slate-200">Bharat</span></span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 ${className}`}>
        {flagSvg}
        <span>Made in Bharat</span>
      </span>
    );
  }

  // Default 'pill' variant for header
  return (
    <span 
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 text-[10px] font-bold text-slate-700 dark:text-slate-300 tracking-tight select-none ${className}`}
      title="Proudly Crafted in Bharat"
    >
      {flagSvg}
      <span className="hidden xs:inline">Made in Bharat</span>
      <span className="xs:hidden">Bharat</span>
    </span>
  );
};
