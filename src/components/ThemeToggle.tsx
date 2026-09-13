import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, ChevronDown, Check } from 'lucide-react';
import type { ThemeMode } from '../types';

interface ThemeToggleProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  currentTheme,
  onThemeChange
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <>
      {/* Mobile Dropdown (sm:hidden) - Conserves critical space */}
      <div className="relative sm:hidden" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(prev => !prev)}
          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700/80 flex items-center gap-1 cursor-pointer transition-colors"
          title={`Active Theme: ${currentTheme.toUpperCase()}`}
          aria-label="Change Theme"
        >
          {currentTheme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
          {currentTheme === 'dark' && <Moon className="w-3.5 h-3.5 text-blue-400" />}
          {currentTheme === 'system' && <Laptop className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-32 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                onThemeChange('light');
                setIsDropdownOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                currentTheme === 'light'
                  ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </div>
              {currentTheme === 'light' && <Check className="w-3 h-3 text-amber-500" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onThemeChange('dark');
                setIsDropdownOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                currentTheme === 'dark'
                  ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>Dark</span>
              </div>
              {currentTheme === 'dark' && <Check className="w-3 h-3 text-blue-400" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onThemeChange('system');
                setIsDropdownOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                currentTheme === 'system'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>System</span>
              </div>
              {currentTheme === 'system' && <Check className="w-3 h-3 text-indigo-500" />}
            </button>
          </div>
        )}
      </div>

      {/* Desktop Segmented Pill (hidden sm:flex) */}
      <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
        <button
          type="button"
          onClick={() => onThemeChange('light')}
          className={`p-1.5 rounded-md transition-all ${
            currentTheme === 'light'
              ? 'bg-white text-amber-500 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
          title="Light Mode"
          aria-label="Light Mode"
        >
          <Sun className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onThemeChange('dark')}
          className={`p-1.5 rounded-md transition-all ${
            currentTheme === 'dark'
              ? 'bg-slate-900 text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
          title="Dark Mode"
          aria-label="Dark Mode"
        >
          <Moon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onThemeChange('system')}
          className={`p-1.5 rounded-md transition-all ${
            currentTheme === 'system'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
          title="System Preference"
          aria-label="System Preference"
        >
          <Laptop className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
};
