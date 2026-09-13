export interface DualActionPayload {
  pa: string; // Payee VPA
  pn: string; // Payee Name
  am?: string; // Amount
  tn?: string; // Transaction note
  wa?: string; // WhatsApp phone number with country code (e.g. 919876543210)
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
  | 'dual-action' 
  | 'servicenow' 
  | 'generic-form' 
  | 'transit' 
  | 'uber' 
  | 'wa-catalog' 
  | 'wifi' 
  | 'vcard' 
  | 'calendar' 
  | 'url';

export type DotType = 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
export type CornerSquareType = 'dot' | 'square' | 'extra-rounded';
export type CornerDotType = 'dot' | 'square';
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QROptions {
  fgColor: string;
  bgColor: string;
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
