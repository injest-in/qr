import { COUNTRIES } from '../utils/countryCodes';

interface CountryCodeSelectProps {
  value: string; // dialCode like "+91"
  onChange: (dialCode: string) => void;
  className?: string;
}

export const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({
  value,
  onChange,
  className = ''
}) => {
  // Normalize value to ensure it matches a dial code
  const normalizedValue = value.startsWith('+') ? value : `+${value}`;
  const currentCountry = COUNTRIES.find(c => c.dialCode === normalizedValue) || COUNTRIES[0];

  return (
    <div className={`relative inline-flex items-center shrink-0 ${className}`}>
      <select
        value={currentCountry.dialCode}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg pl-2.5 pr-7 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        title="Select Country Dial Code"
      >
        {COUNTRIES.map((c) => (
          <option key={`${c.code}-${c.dialCode}`} value={c.dialCode} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            {c.flag} {c.dialCode} ({c.name})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500 dark:text-slate-400">
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
};
