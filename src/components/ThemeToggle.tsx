import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import type { ThemeMode } from '../types';

interface ThemeToggleProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  currentTheme,
  onThemeChange
}) => {
  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
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
  );
};
