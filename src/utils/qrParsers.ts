import type { 
  DualActionPayload, 
  ServiceNowPayload, 
  GenericFormPayload, 
  TransitPayload, 
  UberPayload, 
  WhatsAppCatalogPayload, 
  CalendarPayload, 
  WiFiPayload, 
  VCardPayload 
} from '../types';

/**
 * Normalizes ServiceNow instance names (removes .service-now.com or protocols if pasted)
 */
export function cleanServiceNowInstance(input: string): string {
  let cleaned = input.trim().replace(/^https?:\/\//i, '');
  cleaned = cleaned.replace(/\.service-now\.com.*$/i, '');
  return cleaned;
}

/**
 * Builds standard UPI payment URI
 */
export function generateUPIUrl(payload: DualActionPayload): string {
  const params = new URLSearchParams();
  params.set('pa', payload.pa.trim());
  params.set('pn', payload.pn.trim());
  params.set('cu', 'INR');
  
  if (payload.am && !isNaN(Number(payload.am)) && Number(payload.am) > 0) {
    params.set('am', Number(payload.am).toFixed(2));
  }
  if (payload.tn && payload.tn.trim()) {
    params.set('tn', payload.tn.trim());
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Builds WhatsApp chat message link
 */
export function generateWhatsAppUrl(phoneNumber: string, message: string = ''): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanPhone) return '';
  return `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

/**
 * Builds client-side Dual-Action Gate URL for scanning
 */
export function generateDualActionGateUrl(payload: DualActionPayload, baseUrl?: string): string {
  const origin = baseUrl || window.location.origin + window.location.pathname;
  const url = new URL(origin);
  url.searchParams.set('mode', 'pay');
  url.searchParams.set('pa', payload.pa.trim());
  url.searchParams.set('pn', payload.pn.trim());
  if (payload.am) url.searchParams.set('am', payload.am.trim());
  if (payload.tn) url.searchParams.set('tn', payload.tn.trim());
  if (payload.wa) url.searchParams.set('wa', payload.wa.trim().replace(/[^0-9]/g, ''));
  return url.toString();
}

/**
 * Builds ServiceNow Platform UI or Service Portal URL
 */
export function generateServiceNowUrl(payload: ServiceNowPayload): string {
  const instance = cleanServiceNowInstance(payload.instance);
  if (!instance) return '';

  if (payload.mode === 'portal') {
    const valuesObj: Record<string, string> = {};
    payload.fields.forEach(f => {
      if (f.key.trim()) valuesObj[f.key.trim()] = f.value;
    });
    const encodedJson = encodeURIComponent(JSON.stringify(valuesObj));
    const sysId = payload.portalSysId || '';
    return `https://${instance}.service-now.com/sp?id=sc_cat_item&sys_id=${sysId}&sysparm_variable_values=${encodedJson}`;
  }

  // Platform UI mode
  const table = payload.table || 'incident';
  const queryParts = payload.fields
    .filter(f => f.key.trim().length > 0)
    .map(f => `${encodeURIComponent(f.key.trim())}=${encodeURIComponent(f.value.trim())}`);
  
  const queryStr = queryParts.join('^');
  return `https://${instance}.service-now.com/${table}.do?sys_id=-1&sysparm_query=${queryStr}`;
}

/**
 * Builds Generic Form URL with key-value parameters
 */
export function generateGenericFormUrl(payload: GenericFormPayload): string {
  if (!payload.baseUrl) return '';
  try {
    const url = new URL(payload.baseUrl);
    payload.fields.forEach(f => {
      if (f.key.trim()) {
        url.searchParams.set(f.key.trim(), f.value);
      }
    });
    return url.toString();
  } catch {
    // If not a full URL yet
    const query = payload.fields
      .filter(f => f.key.trim())
      .map(f => `${encodeURIComponent(f.key.trim())}=${encodeURIComponent(f.value)}`)
      .join('&');
    return payload.baseUrl + (payload.baseUrl.includes('?') ? '&' : '?') + query;
  }
}

/**
 * Builds Google Maps Transit Directions URL
 */
export function generateMapsTransitUrl(payload: TransitPayload): string {
  const mode = payload.travelMode || 'transit';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(payload.lat.trim())},${encodeURIComponent(payload.lng.trim())}&travelmode=${mode}`;
}

/**
 * Builds Uber Intent URL
 */
export function generateUberIntentUrl(payload: UberPayload): string {
  const nickname = encodeURIComponent(payload.dropoffNickname.trim() || 'Destination');
  return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${payload.dropoffLat.trim()}&dropoff[longitude]=${payload.dropoffLng.trim()}&dropoff[nickname]=${nickname}`;
}

/**
 * Builds WhatsApp Business Catalog URL
 */
export function generateWACatalogUrl(payload: WhatsAppCatalogPayload): string {
  const code = payload.countryCode.replace(/[^0-9]/g, '');
  const phone = payload.phone.replace(/[^0-9]/g, '');
  return `https://wa.me/c/${code}${phone}`;
}

/**
 * Helper to escape Wi-Fi string values
 */
function escapeWifiString(str: string): string {
  return str.replace(/([\\;,:"])/g, '\\$1');
}

/**
 * Builds Wi-Fi configuration string
 */
export function generateWiFiString(payload: WiFiPayload): string {
  const ssid = escapeWifiString(payload.ssid);
  const pass = payload.password ? escapeWifiString(payload.password) : '';
  const enc = payload.encryption;
  const hidden = payload.hidden ? 'true' : 'false';
  return `WIFI:S:${ssid};T:${enc};P:${pass};H:${hidden};;`;
}

/**
 * Builds vCard 3.0 contact string
 */
export function generateVCardString(payload: VCardPayload): string {
  const parts = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${payload.lastName || ''};${payload.firstName || ''};;;`,
    `FN:${`${payload.firstName || ''} ${payload.lastName || ''}`.trim()}`,
  ];

  if (payload.organization) parts.push(`ORG:${payload.organization}`);
  if (payload.title) parts.push(`TITLE:${payload.title}`);
  if (payload.phone) parts.push(`TEL;TYPE=CELL:${payload.phone}`);
  if (payload.email) parts.push(`EMAIL:${payload.email}`);
  if (payload.url) parts.push(`URL:${payload.url}`);
  if (payload.address) parts.push(`ADR:;;${payload.address};;;;`);

  parts.push('END:VCARD');
  return parts.join('\n');
}

/**
 * Formats local ISO string to RFC 5545 timestamp YYYYMMDDTHHmmssZ or YYYYMMDDTHHmmss
 */
function formatICSDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Builds RFC 5545 Calendar string
 */
export function generateICSString(payload: CalendarPayload): string {
  const dtStart = formatICSDate(payload.startDate);
  const dtEnd = payload.endDate ? formatICSDate(payload.endDate) : dtStart;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SwissArmy QR//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${payload.title}`,
    payload.description ? `DESCRIPTION:${payload.description}` : '',
    payload.location ? `LOCATION:${payload.location}` : '',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\n');
}

/**
 * Detects payload category and extracts key fields for Reverse-Ingestion (Staff Mode)
 */
export interface DecodedQRInfo {
  raw: string;
  type: 'json' | 'servicenow' | 'wifi' | 'upi' | 'vcard' | 'calendar' | 'transit' | 'url' | 'text';
  title: string;
  parsedFields: { key: string; value: string }[];
  actionUrl?: string;
  actionLabel?: string;
}

export function parseDecodedQR(raw: string): DecodedQRInfo {
  const trimmed = raw.trim();

  // 1. JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const obj = JSON.parse(trimmed);
      const fields: { key: string; value: string }[] = [];

      const flatten = (data: any, prefix = '') => {
        for (const k in data) {
          if (typeof data[k] === 'object' && data[k] !== null) {
            flatten(data[k], `${prefix}${k}.`);
          } else {
            fields.push({ key: `${prefix}${k}`, value: String(data[k]) });
          }
        }
      };

      if (typeof obj === 'object' && obj !== null) {
        flatten(obj);
      }

      return {
        raw,
        type: 'json',
        title: 'Structured JSON Payload',
        parsedFields: fields,
      };
    } catch {
      // not valid JSON
    }
  }

  // 2. ServiceNow URL
  if (trimmed.includes('service-now.com')) {
    const fields: { key: string; value: string }[] = [];
    try {
      const url = new URL(trimmed);
      fields.push({ key: 'Instance URL', value: url.origin });
      
      const queryParam = url.searchParams.get('sysparm_query');
      if (queryParam) {
        queryParam.split('^').forEach(pair => {
          const [k, v] = pair.split('=');
          if (k) fields.push({ key: decodeURIComponent(k), value: decodeURIComponent(v || '') });
        });
      }

      const varValues = url.searchParams.get('sysparm_variable_values');
      if (varValues) {
        try {
          const parsed = JSON.parse(decodeURIComponent(varValues));
          for (const k in parsed) {
            fields.push({ key: k, value: String(parsed[k]) });
          }
        } catch {
          fields.push({ key: 'Variable Values', value: varValues });
        }
      }

      return {
        raw,
        type: 'servicenow',
        title: 'ServiceNow Prefill Request',
        parsedFields: fields,
        actionUrl: trimmed,
        actionLabel: 'Open ServiceNow Portal/Record'
      };
    } catch {
      // fallback
    }
  }

  // 3. Wi-Fi
  if (trimmed.startsWith('WIFI:')) {
    const fields: { key: string; value: string }[] = [];
    const clean = trimmed.substring(5).replace(/;;$/, '');
    const tokens = clean.match(/(?:[^;\\]|\\.)+/g) || [];

    tokens.forEach(token => {
      const [type, ...valParts] = token.split(':');
      const val = valParts.join(':').replace(/\\([\\;,:"])/g, '$1');
      if (type === 'S') fields.push({ key: 'Network SSID', value: val });
      if (type === 'P') fields.push({ key: 'Password', value: val });
      if (type === 'T') fields.push({ key: 'Encryption', value: val });
      if (type === 'H') fields.push({ key: 'Hidden', value: val === 'true' ? 'Yes' : 'No' });
    });

    return {
      raw,
      type: 'wifi',
      title: 'Wi-Fi Network Configuration',
      parsedFields: fields,
    };
  }

  // 4. UPI Payment
  if (trimmed.startsWith('upi://pay')) {
    const fields: { key: string; value: string }[] = [];
    try {
      const url = new URL(trimmed);
      const pa = url.searchParams.get('pa');
      const pn = url.searchParams.get('pn');
      const am = url.searchParams.get('am');
      const tn = url.searchParams.get('tn');

      if (pa) fields.push({ key: 'Payee VPA', value: pa });
      if (pn) fields.push({ key: 'Payee Name', value: pn });
      if (am) fields.push({ key: 'Amount (INR)', value: `₹${am}` });
      if (tn) fields.push({ key: 'Note', value: tn });

      return {
        raw,
        type: 'upi',
        title: 'UPI Payment Intent',
        parsedFields: fields,
        actionUrl: trimmed,
        actionLabel: 'Pay with UPI App'
      };
    } catch {
      // fallback
    }
  }

  // 5. vCard
  if (trimmed.includes('BEGIN:VCARD')) {
    const fields: { key: string; value: string }[] = [];
    const lines = trimmed.split(/\r?\n/);
    lines.forEach(line => {
      if (line.startsWith('FN:')) fields.push({ key: 'Full Name', value: line.substring(3) });
      else if (line.startsWith('TEL')) {
        const parts = line.split(':');
        fields.push({ key: 'Phone', value: parts[1] || '' });
      }
      else if (line.startsWith('EMAIL')) {
        const parts = line.split(':');
        fields.push({ key: 'Email', value: parts[1] || '' });
      }
      else if (line.startsWith('ORG:')) fields.push({ key: 'Organization', value: line.substring(4) });
      else if (line.startsWith('TITLE:')) fields.push({ key: 'Job Title', value: line.substring(6) });
      else if (line.startsWith('URL:')) fields.push({ key: 'Website', value: line.substring(4) });
    });

    return {
      raw,
      type: 'vcard',
      title: 'Contact vCard',
      parsedFields: fields,
    };
  }

  // 6. Transit / Google Maps / Uber
  if (trimmed.includes('google.com/maps') || trimmed.includes('uber.com')) {
    return {
      raw,
      type: 'transit',
      title: trimmed.includes('uber.com') ? 'Uber Ride Intent' : 'Google Maps Transit',
      parsedFields: [{ key: 'Destination Link', value: trimmed }],
      actionUrl: trimmed,
      actionLabel: 'Open Navigation'
    };
  }

  // 7. General URL
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      raw,
      type: 'url',
      title: 'Web URL Link',
      parsedFields: [{ key: 'URL', value: trimmed }],
      actionUrl: trimmed,
      actionLabel: 'Open Link in Browser'
    };
  }

  // 8. Plain Text
  return {
    raw,
    type: 'text',
    title: 'Text Content',
    parsedFields: [{ key: 'Content', value: trimmed }]
  };
}
