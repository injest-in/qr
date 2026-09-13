export interface CountryInfo {
  name: string;
  code: string; // ISO 2-letter
  dialCode: string; // e.g. "+91"
  flag: string;
}

export const COUNTRIES: CountryInfo[] = [
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852', flag: '🇭🇰' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { name: 'Poland', code: 'PL', dialCode: '+48', flag: '🇵🇱' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880', flag: '🇧🇩' },
  { name: 'Nepal', code: 'NP', dialCode: '+977', flag: '🇳🇵' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰' },
];

// Timezone prefix to country code mapping
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Calcutta': 'IN',
  'Asia/Kolkata': 'IN',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'Europe/London': 'GB',
  'Asia/Dubai': 'AE',
  'Asia/Singapore': 'SG',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Asia/Riyadh': 'SA',
  'Asia/Qatar': 'QA',
  'Asia/Kuwait': 'KW',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
};

/**
 * Automatically detects user country using TimeZone and Navigator Language,
 * defaulting to India (IN, +91) as specified.
 */
export function detectUserCountry(): CountryInfo {
  try {
    // 1. Try timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      if (TIMEZONE_TO_COUNTRY[tz]) {
        const found = COUNTRIES.find(c => c.code === TIMEZONE_TO_COUNTRY[tz]);
        if (found) return found;
      }
      if (tz.startsWith('Asia/Calcutta') || tz.startsWith('Asia/Kolkata')) {
        return COUNTRIES[0]; // India
      }
      if (tz.startsWith('America/')) {
        return COUNTRIES.find(c => c.code === 'US') || COUNTRIES[0];
      }
      if (tz.startsWith('Europe/London')) {
        return COUNTRIES.find(c => c.code === 'GB') || COUNTRIES[0];
      }
      if (tz.startsWith('Australia/')) {
        return COUNTRIES.find(c => c.code === 'AU') || COUNTRIES[0];
      }
    }

    // 2. Try navigator.languages or navigator.language
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const lang of langs) {
      if (!lang) continue;
      const parts = lang.split(/[-_]/);
      if (parts.length > 1) {
        const countryCode = parts[1].toUpperCase();
        const found = COUNTRIES.find(c => c.code === countryCode);
        if (found) return found;
      }
    }
  } catch {
    // ignore
  }

  // Fallback to India (+91)
  return COUNTRIES[0];
}

/**
 * Splits a full phone number into dialCode and localNumber
 */
export function splitPhoneNumber(fullNumber: string, defaultCountry: CountryInfo = COUNTRIES[0]): { dialCode: string; localNumber: string } {
  if (!fullNumber) return { dialCode: defaultCountry.dialCode, localNumber: '' };
  const clean = fullNumber.replace(/[^0-9+]/g, '');

  // If starts with +, try matching
  if (clean.startsWith('+')) {
    // Try longer dial codes first (e.g. +971 before +9)
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (clean.startsWith(c.dialCode)) {
        return { dialCode: c.dialCode, localNumber: clean.slice(c.dialCode.length) };
      }
    }
  }

  // Try matching raw digits without +
  const digitsOnly = clean.replace(/^\+/, '');
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    const rawDial = c.dialCode.replace('+', '');
    if (digitsOnly.startsWith(rawDial) && digitsOnly.length > rawDial.length + 5) {
      return { dialCode: c.dialCode, localNumber: digitsOnly.slice(rawDial.length) };
    }
  }

  return { dialCode: defaultCountry.dialCode, localNumber: digitsOnly };
}
