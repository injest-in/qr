export interface DualActionPayload {
  pa: string; // Payee VPA
  pn: string; // Payee Name
  am?: string; // Amount
  tn?: string; // Transaction note
  wa?: string; // WhatsApp phone number with country code (e.g. 919876543210)
}

export interface UPIPayload {
  pa: string;
  pn: string;
  am?: string;
  tn?: string;
}

export interface WhatsAppPayload {
  countryCode: string;
  phone: string;
  message?: string;
}

export interface EmailPayload {
  to: string;
  subject?: string;
  body?: string;
}

export interface PhonePayload {
  countryCode: string;
  phone: string;
}

export interface LinkPayload {
  url: string;
}

export interface ServiceNowField {
  key: string;
  value: string;
}

export interface ServiceNowPayload {
  instance: string; // e.g. "dev12345" or "company"
  table: string; // default "incident"
  mode: 'platform' | 'portal';
  portalSysId?: string; // Catalog item sys_id for Service Portal
  fields: ServiceNowField[];
}

export interface GenericFormPayload {
  baseUrl: string;
  fields: { key: string; value: string }[];
}

export interface TransitPayload {
  lat: string;
  lng: string;
  name?: string;
  travelMode: 'transit' | 'driving' | 'walking' | 'bicycling';
}

export interface UberPayload {
  dropoffLat: string;
  dropoffLng: string;
  dropoffNickname: string;
}

export interface WhatsAppCatalogPayload {
  countryCode: string;
  phone: string;
}

export interface CalendarPayload {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // YYYY-MM-DDTHH:mm
  endDate: string; // YYYY-MM-DDTHH:mm
}

export interface WiFiPayload {
  ssid: string;
  password?: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardPayload {
  firstName: string;
  lastName: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
  address?: string;
}

export type QRMode = 
  // Simple tools
  | 'whatsapp'
  | 'email'
  | 'phone'
  | 'link'
  | 'upi'
  // Medium tools
  | 'calendar'
  | 'vcard'
  | 'maps'
  | 'wifi'
  // Advanced tools
  | 'pay-gate'
  | 'servicenow'
  | 'form'
  | 'uber'
  | 'catalog'
  // Aliases for compatibility
  | 'dual-action' 
  | 'generic-form' 
  | 'transit' 
  | 'wa-catalog' 
  | 'url';

export type ToolTier = 'simple' | 'medium' | 'advanced';

export type ThemeMode = 'light' | 'dark' | 'system';

export type DotType = 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
export type CornerSquareType = 'dot' | 'square' | 'extra-rounded';
export type CornerDotType = 'dot' | 'square';
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QROptions {
  fgColor: string;
  bgColor: string; // 'transparent' or '#ffffff', etc.
  isTransparent: boolean;
  useGradient: boolean;
  gradientColor2: string;
  gradientType: 'linear' | 'radial';
  dotsType: DotType;
  cornersSquareType: CornerSquareType;
  cornersDotType: CornerDotType;
  errorCorrectionLevel: ErrorCorrectionLevel;
  margin: number;
  logoDataUrl?: string;
  logoMargin: number;
}

export type PrintTemplateType = 'tent-a4' | 'standee-a5' | 'asset-tag-2x1';

export interface PrintTemplateConfig {
  type: PrintTemplateType;
  title: string;
  subtitle: string;
  humanReadablePrimary?: { label: string; value: string };
  humanReadableSecondary?: { label: string; value: string };
  brandColor?: string;
}

export const DEFAULT_QR_OPTIONS: QROptions = {
  fgColor: '#0f172a',
  bgColor: 'transparent',
  isTransparent: true,
  useGradient: false,
  gradientColor2: '#2563eb',
  gradientType: 'linear',
  dotsType: 'dots',
  cornersSquareType: 'extra-rounded',
  cornersDotType: 'dot',
  errorCorrectionLevel: 'M',
  margin: 4,
  logoMargin: 2
};

declare global {
  const __APP_VERSION__: string;
  const __COMMIT_HASH__: string;
  const __BUILD_TIME__: string;
}
